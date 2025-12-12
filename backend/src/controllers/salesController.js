const pool = require('../config/database');
const { logAction } = require('../utils/logger');

const generateTransactionNumber = (businessId) => {
  const businessPart = businessId ? String(businessId).padStart(2, '0') : '00';
  const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `T-${businessPart}-${timePart}-${randPart}`;
};

exports.checkout = async (req, res) => {
  const { 
    discount_id, 
    payment_type = 'cash', 
    money_received, 
    discount_percentage, 
    discount_amount, 
    transaction_id, 
    transaction_number: frontendTxnNumber 
  } = req.body || {};
  
  // Note: discount_id is not currently stored in the transactions table

  // Accept items from multiple possible keys to be resilient
  let items = Array.isArray(req.body?.items) ? req.body.items
    : Array.isArray(req.body?.cart) ? req.body.cart
    : Array.isArray(req.body?.products) ? req.body.products
    : [];

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let effectiveTransactionId = transaction_id;
    let transaction_number;
    let subtotal = 0;

    if (!transaction_id) {
      // Generate a new transaction number if not provided
      transaction_number = frontendTxnNumber || generateTransactionNumber(req.user?.businessId);

      // Insert new transaction with initial values (without discount_id)
      const transRes = await client.query(
        `INSERT INTO transactions 
         (business_id, cashier_user_id, created_at, updated_at, status, transaction_number) 
         VALUES ($1, $2, now(), now(), $3, $4) 
         RETURNING transaction_id, transaction_number`,
        [
          req.user?.businessId || null, 
          req.user?.userId || null, 
          'completed', 
          transaction_number
        ]
      );
      
      effectiveTransactionId = transRes.rows[0].transaction_id;
      transaction_number = transRes.rows[0].transaction_number;
    } else {
      // Update existing transaction
      const tRes = await client.query(
        'SELECT transaction_id, status, transaction_number FROM transactions WHERE transaction_id = $1 FOR UPDATE', 
        [transaction_id]
      );
      
      if (tRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      transaction_number = tRes.rows[0].transaction_number;
      
      // Update transaction with cashier_user_id and status (no discount_id)
      await client.query(
        'UPDATE transactions SET cashier_user_id = $1, status = $2, updated_at = NOW() WHERE transaction_id = $3',
        [req.user?.userId || null, 'completed', transaction_id]
      );
      
      // Clear existing transaction items
      await client.query('DELETE FROM transaction_items WHERE transaction_id = $1', [transaction_id]);
    }

    // Insert transaction items and update inventory
    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;
      
      // Get current price
      const priceRes = await client.query(
        'SELECT selling_price FROM products WHERE product_id = $1 AND (business_id = $2 OR $2 IS NULL)', 
        [product_id, req.user?.businessId || null]
      );
      
      const price = priceRes.rows?.[0]?.selling_price || 0;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;

      // Add to transaction items
      // Note: subtotal is a GENERATED column, so we don't insert it - it's calculated automatically
      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
        [effectiveTransactionId, product_id, quantity, price]
      );

      // Update inventory
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE product_id = $2 AND business_id = $3',
        [quantity, product_id, req.user?.businessId || null]
      );
    }

    // Calculate total with discount
    let total = subtotal;
    let appliedDiscountPct = null;
    let appliedDiscountAmount = 0;

    // First, try to get discount_percentage from discount_id if provided and discount_percentage is not explicitly provided
    if (discount_id && !Number.isFinite(Number(discount_percentage)) && !Number.isFinite(Number(discount_amount))) {
      const discRes = await client.query(
        'SELECT discount_percentage FROM discounts WHERE discount_id = $1',
        [discount_id]
      );
      if (discRes.rowCount > 0) {
        appliedDiscountPct = Number(discRes.rows[0].discount_percentage);
        console.log(`[Checkout] Found discount_id ${discount_id} with percentage: ${appliedDiscountPct}%`);
      }
    }

    // Apply discount if explicitly provided via percentage or amount, or if we got it from discount_id
    if (Number.isFinite(Number(discount_percentage))) {
      appliedDiscountPct = Number(discount_percentage);
      appliedDiscountAmount = subtotal * (appliedDiscountPct / 100);
      total = subtotal - appliedDiscountAmount;
      console.log(`[Checkout] Applied discount_percentage: ${appliedDiscountPct}%, subtotal: ${subtotal}, discount: ${appliedDiscountAmount}, total: ${total}`);
    } else if (appliedDiscountPct != null && appliedDiscountPct > 0) {
      // Use discount_percentage from discount_id lookup
      appliedDiscountAmount = subtotal * (appliedDiscountPct / 100);
      total = subtotal - appliedDiscountAmount;
      console.log(`[Checkout] Applied discount from discount_id: ${appliedDiscountPct}%, subtotal: ${subtotal}, discount: ${appliedDiscountAmount}, total: ${total}`);
    } else if (Number.isFinite(Number(discount_amount)) && Number(discount_amount) > 0) {
      appliedDiscountAmount = Math.min(Number(discount_amount), subtotal);
      total = subtotal - appliedDiscountAmount;
      appliedDiscountPct = (appliedDiscountAmount / subtotal) * 100;
      console.log(`[Checkout] Applied discount_amount: ${appliedDiscountAmount}, subtotal: ${subtotal}, total: ${total}`);
    } else {
      console.log(`[Checkout] No discount applied. subtotal: ${subtotal}, total: ${total}`);
    }

    // Update transaction with final total
    await client.query(
      'UPDATE transactions SET total_amount = $1, updated_at = NOW() WHERE transaction_id = $2',
      [total, effectiveTransactionId]
    );
    
    // Calculate money_change for cash payments
    // For cash: change = money_received - total (if money_received > total)
    // For online payments (gcash, maya): change is null (exact amount paid)
    const paymentTypeLower = (payment_type || 'cash').toString().toLowerCase();
    const money_change = (paymentTypeLower === 'cash' && money_received) 
      ? Math.max(0, Number(money_received) - total)
      : null;
    
    // Insert payment information into transaction_payment table
    await client.query(
      `INSERT INTO transaction_payment (transaction_id, user_id, discount_id, payment_type, money_received, money_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        effectiveTransactionId,
        req.user?.userId || null,
        discount_id || null,
        (payment_type || 'cash').toString(),
        money_received || null,
        money_change
      ]
    );
    
    // Log the discount application if any
    if (appliedDiscountPct > 0) {
      logAction({
        userId: req.user?.userId || null,
        businessId: req.user?.businessId || null,
        action: `Applied discount of ${appliedDiscountPct.toFixed(2)}% (₱${appliedDiscountAmount.toFixed(2)}) to transaction ${effectiveTransactionId}`,
      });
    }

    await client.query('COMMIT');

    // Log the sale
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Checkout for transaction ${effectiveTransactionId} with a total of ${total} via ${payment_type}`,
    });

    res.status(201).json({ 
      transaction_id: effectiveTransactionId, 
      transaction_number, 
      total,
      subtotal,
      discount_amount: subtotal - total,
      discount_percentage: appliedDiscountPct
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to process checkout: ' + err.message });
  } finally {
    client.release();
  }
};

// Public checkout endpoint for customer app (no auth); requires business_id
exports.publicCheckout = async (req, res) => {
  const { items, payment_type, money_received, business_id, customer_user_id, discount_id, discount_percentage, discount_amount, transaction_number: frontendTxnNumber } = req.body || {};
  console.log("[DEBUG publicCheckout] Received items in req.body:", items);
  console.log("[DEBUG publicCheckout] customer_user_id:", customer_user_id);
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }
  if (!business_id) {
    return res.status(400).json({ error: 'business_id is required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If customer_user_id is not provided, create a customer user as fallback
    let finalCustomerUserId = customer_user_id || null;
    if (!finalCustomerUserId) {
      console.log("[DEBUG publicCheckout] No customer_user_id provided, creating customer user as fallback");
      try {
        // Get customer user_type id
        const utRes = await client.query("SELECT user_type_id FROM user_type WHERE lower(user_type_name) = 'customer' LIMIT 1");
        const userTypeId = utRes.rows?.[0]?.user_type_id || null;
        
        if (userTypeId) {
          // Generate unique 8-char alphanumeric username
          const genUsername = () => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let s = '';
            for (let i = 0; i < 8; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
            return s;
          };
          
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts) {
            attempts++;
            const username = genUsername();
            try {
              const insRes = await client.query(
                `INSERT INTO users (username, email, contact_number, role, user_type_id, business_id, created_at, updated_at)
                 VALUES ($1, NULL, NULL, $2, $3, $4, NOW(), NOW()) RETURNING user_id, username`,
                [username, 'customer', userTypeId, business_id]
              );
              finalCustomerUserId = insRes.rows[0].user_id;
              console.log("[DEBUG publicCheckout] Created customer user as fallback:", finalCustomerUserId);
              break;
            } catch (e) {
              // Unique violation for username -> retry
              if (e && e.code === '23505') {
                continue;
              }
              throw e;
            }
          }
        }
      } catch (err) {
        console.error("[DEBUG publicCheckout] Failed to create customer user as fallback:", err);
        // Continue with null customer_user_id if creation fails
      }
    }

    const transaction_number = frontendTxnNumber || generateTransactionNumber(business_id);

    // Create transaction with status pending (customer flow)
    const transRes = await client.query(
      'INSERT INTO transactions (business_id, customer_user_id, status, created_at, updated_at, transaction_number) VALUES ($1, $2, $3, now(), now(), $4) RETURNING transaction_id',
      [business_id, finalCustomerUserId, 'pending', transaction_number]
    );
    const transaction_id = transRes.rows[0].transaction_id;

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;
      const priceRes = await client.query('SELECT selling_price FROM products WHERE product_id = $1 AND (business_id = $2 OR $2 IS NULL)', [product_id, business_id]);
      const price = priceRes.rows?.[0]?.selling_price || 0;
      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
        [transaction_id, product_id, quantity, price]
      );
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE product_id = $2 AND business_id = $3',
        [quantity, product_id, business_id]
      );
    }

    const totalRes = await client.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total FROM transaction_items WHERE transaction_id = $1`,
      [transaction_id]
    );
    let total = Number(totalRes.rows[0].total) || 0;

    // Discount resolution
    let appliedDiscountPct = null;
    if (discount_id) {
      const discRes = await client.query('SELECT discount_percentage FROM discounts WHERE discount_id = $1', [discount_id]);
      if (discRes.rowCount > 0) {
        appliedDiscountPct = Number(discRes.rows[0].discount_percentage);
      }
    }
    if (appliedDiscountPct == null && Number.isFinite(Number(discount_percentage))) {
      appliedDiscountPct = Number(discount_percentage);
    }
    if (appliedDiscountPct != null && appliedDiscountPct > 0) {
      total = total - (total * (appliedDiscountPct / 100));
    } else if (Number.isFinite(Number(discount_amount)) && Number(discount_amount) > 0) {
      total = Math.max(0, total - Number(discount_amount));
    }

    const money_change = money_received ? Number(money_received) - total : null;

    await client.query('UPDATE transactions SET total_amount = $1 WHERE transaction_id = $2', [total, transaction_id]);
    await client.query(
      `INSERT INTO transaction_payment (transaction_id, user_id, discount_id, payment_type, money_received, money_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [transaction_id, finalCustomerUserId, discount_id || null, (payment_type || 'cash').toString(), money_received || null, money_change]
    );

    await client.query('COMMIT');
    // Log sale for visibility in logs dashboard
    try {
      logAction({
        userId: finalCustomerUserId,
        businessId: business_id,
        action: `Public checkout for transaction ${transaction_id} with a total of ${total} via ${payment_type}`,
      });
    } catch (_) {}
    // Build a QR payload for cashier scanning when payment type is cash
    let qr_payload = null;
    if ((payment_type || 'cash').toString().toLowerCase() === 'cash') {
      // Include full cart items in qr_payload for cashier scanning
      const payload = {
        t: 'cart',
        b: business_id,
        transaction_id,
        transaction_number: transaction_number,
        items: items.map(item => ({
          p: item.product_id,
          q: item.quantity,
          sku: item.sku || null
        }))
      };
      qr_payload = JSON.stringify(payload);
      // Optionally could base64 encode if needed by frontend
      // qr_payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    res.status(201).json({ transaction_id, transaction_number, total, qr_payload });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.enterStore = async (req, res) => {
  const { business_id } = req.body || {};
  if (!business_id) return res.status(400).json({ error: 'business_id is required' });

  const client = await pool.connect();
  try {
    // Check store exists
    const bizRes = await client.query('SELECT business_id FROM business WHERE business_id = $1', [business_id]);
    if (bizRes.rowCount === 0) return res.status(404).json({ error: 'Business not found' });

    // Get customer user_type id if available
    const utRes = await client.query("SELECT user_type_id FROM user_type WHERE lower(user_type_name) = 'customer' LIMIT 1");
    const userTypeId = utRes.rows?.[0]?.user_type_id || null;
    console.log('DEBUG enterStore: userTypeId:', userTypeId);

    if (!userTypeId) {
      return res.status(500).json({ error: 'User type "customer" not found in user_type table' });
    }

    // Generate unique 8-char alphanumeric username
    const genUsername = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let s = '';
      for (let i = 0; i < 8; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
      return s;
    };

    await client.query('BEGIN');

    let newUser = null;
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      attempts++;
      const username = genUsername();
      try {
        const insRes = await client.query(
          `INSERT INTO users (username, email, contact_number, role, user_type_id, business_id, created_at, updated_at)
           VALUES ($1, NULL, NULL, $2, $3, $4, NOW(), NOW()) RETURNING user_id, username`,
          [username, 'customer', userTypeId, business_id]
        );
        newUser = insRes.rows[0];
        break;
      } catch (e) {
        console.error('DEBUG enterStore: error inserting user:', e);
        // Unique violation for username -> retry
        if (e && e.code === '23505') {
          // continue to next attempt
          continue;
        }
        // Unknown error -> rethrow
        throw e;
      }
    }

    if (!newUser) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to create anonymous user after multiple attempts' });
    }

    await client.query('COMMIT');

    // Log action
    try { logAction({ userId: newUser.user_id, businessId: business_id, action: `Anonymous customer created: ${newUser.username}` }); } catch (_) {}

    res.status(201).json({ user_id: newUser.user_id, username: newUser.username });
  } catch (err) {
    console.error('DEBUG enterStore: caught error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Endpoint for cashier to mark a transaction as completed (scans customer's cart QR and accepts payment)
exports.completeTransaction = async (req, res) => {
  const transactionId = req.params.id;
  if (!transactionId) return res.status(400).json({ error: 'transaction id is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get the transaction with all necessary details
    const tRes = await client.query(
      `SELECT t.transaction_id, t.status, t.business_id, t.transaction_number, 
              t.customer_user_id, t.total_amount, t.created_at
       FROM transactions t 
       WHERE t.transaction_id = $1 
       FOR UPDATE`, 
      [transactionId]
    );
    
    if (tRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = tRes.rows[0];
    
    // If already completed, return the existing transaction details
    if (transaction.status === 'completed') {
      await client.query('ROLLBACK');
      return res.json({ 
        transaction_id: Number(transactionId),
        transaction_number: transaction.transaction_number,
        business_id: transaction.business_id,
        customer_user_id: transaction.customer_user_id,
        total_amount: transaction.total_amount,
        created_at: transaction.created_at,
        status: 'completed', 
        message: 'Transaction was already completed' 
      });
    }

    // Verify business ID matches cashier's business
    if (transaction.business_id && req.user?.businessId) {
      if (Number(transaction.business_id) !== Number(req.user.businessId)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Transaction does not belong to your business' });
      }
    }

    // Update the existing transaction to mark it as completed
    await client.query(
      `UPDATE transactions 
       SET status = $1, 
           cashier_user_id = $2, 
           updated_at = NOW() 
       WHERE transaction_id = $3`, 
      ['completed', req.user?.userId || null, transactionId]
    );
    
    await client.query('COMMIT');

    // Log the action
    try { 
      logAction({ 
        userId: req.user?.userId || null, 
        businessId: transaction.business_id, 
        action: `Transaction ${transaction.transaction_number || transactionId} completed by cashier ${req.user?.userId || 'unknown'}` 
      }); 
    } catch (_) {}

    res.json({ 
      transaction_id: Number(transactionId),
      transaction_number: transaction.transaction_number,
      business_id: transaction.business_id,
      customer_user_id: transaction.customer_user_id,
      total_amount: transaction.total_amount,
      created_at: transaction.created_at,
      status: 'completed', 
      message: 'Transaction completed successfully',
      receipt_url: `/receipt?tn=${transaction.transaction_number}`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error completing transaction:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Public: get transaction status (for customer app to poll)
exports.getTransactionStatus = async (req, res) => {
  const transactionId = req.params.id;
  if (!transactionId) return res.status(400).json({ error: 'transaction id is required' });

  try {
    const result = await pool.query('SELECT transaction_id, status, total_amount, transaction_number FROM transactions WHERE transaction_id = $1', [transactionId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    const row = result.rows[0];
    res.json({
      transaction_id: row.transaction_id,
      status: row.status,
      total: Number(row.total_amount),
      tn: row.transaction_number
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSaleDetailsByTransactionNumber = async (req, res) => {
  const { tn } = req.params;

  if (!tn) {
    return res.status(400).json({ error: 'Transaction number is required' });
  }

  const client = await pool.connect();
  try {
    // 1. Get transaction details
    const transactionRes = await client.query(
      `SELECT t.transaction_id, t.business_id, t.cashier_user_id, t.total_amount, t.created_at, u_cashier.username as cashier_name
       FROM transactions t
       LEFT JOIN users u_cashier ON t.cashier_user_id = u_cashier.user_id
       WHERE t.transaction_number = $1`,
      [tn]
    );

    if (transactionRes.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionRes.rows[0];
    const { transaction_id, business_id, total_amount, created_at, cashier_name } = transaction;

    // 2. Get business details
    const businessRes = await client.query(
      'SELECT business_name, business_address, mobile, email FROM business WHERE business_id = $1',
      [business_id]
    );
    const business = businessRes.rows[0] || {};

    // 3. Get payment and discount information
    const paymentRes = await client.query(
      `SELECT tp.payment_type, tp.money_received, tp.money_change, tp.discount_id, d.discount_percentage, d.discount_name
       FROM transaction_payment tp
       LEFT JOIN discounts d ON tp.discount_id = d.discount_id
       WHERE tp.transaction_id = $1
       ORDER BY tp.transaction_payment_id DESC
       LIMIT 1`,
      [transaction_id]
    );
    const payment = paymentRes.rows[0] || {};

    // 4. Get transaction items
    const itemsRes = await client.query(
      `SELECT p.product_name, p.sku, ti.product_quantity, ti.price_at_sale, ti.subtotal
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.product_id
       WHERE ti.transaction_id = $1
       ORDER BY p.product_name`,
      [transaction_id]
    );
    const items = itemsRes.rows;
    
    // 5. Calculate subtotal from items
    const subtotal = items.reduce((acc, item) => acc + Number(item.subtotal), 0);
    const discountAmount = subtotal - Number(total_amount); 

    // 6. Calculate tax (assuming 12% VAT applied on the total)
    const grandTotal = Number(total_amount);
    const vatableSales = grandTotal / 1.12;
    const vatAmount = grandTotal - vatableSales;


    // 7. Assemble response
    const receiptDetails = {
      transactionNumber: tn,
      date: created_at,
      total: grandTotal,
      subtotal: subtotal,
      discountTotal: discountAmount,
      taxDetails: {
          vatableSales: vatableSales,
          vatAmount: vatAmount
      },
      cashierName: cashier_name,
      business: {
        name: business.business_name,
        address: business.business_address,
        contact: business.mobile,
        email: business.email,
        tin: business.tin || null // schema doesn't have TIN yet, but good to have
      },
      payment: {
        method: payment.payment_type || 'cash',
        amountTendered: payment.money_received ? Number(payment.money_received) : Number(total_amount),
        change: payment.money_change ? Number(payment.money_change) : 0
      },
      discount: payment.discount_id ? {
        id: payment.discount_id,
        name: payment.discount_name || 'Discount',
        percentage: payment.discount_percentage ? Number(payment.discount_percentage) : null
      } : null,
      items: items.map(i => ({
        name: i.product_name,
        sku: i.sku,
        quantity: i.product_quantity,
        price: Number(i.price_at_sale).toFixed(2),
        subtotal: Number(i.subtotal).toFixed(2)
      })),
      totalQuantity: items.reduce((acc, item) => acc + item.product_quantity, 0)
    };

    res.json(receiptDetails);

  } catch (err) {
    console.error(`Error fetching sale details for TN: ${tn}`, err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Get recent receipts for the authenticated cashier.
 */
exports.getRecentCashierReceipts = async (req, res) => {
  const userId = req.user?.userId || null;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // First, get the transactions for the cashier with payment information
    const result = await pool.query(
      `
        SELECT
          t.transaction_id,
          t.transaction_number,
          t.created_at,
          t.updated_at,
          t.status,
          t.total_amount,
          t.business_id,
          t.customer_user_id,
          -- Payment information
          COALESCE(tp.payment_type, 'cash') as payment_type,
          COALESCE(tp.money_received, t.total_amount) as amount_received,
          COALESCE(tp.money_change, 0) as change_given,
          -- Format the total amount to 2 decimal places
          to_char(t.total_amount, 'FM999,999,999.00') as formatted_total,
          -- Get the count of items in the transaction
          (SELECT COUNT(*) FROM transaction_items WHERE transaction_id = t.transaction_id) as item_count,
          -- Get the first product name if available
          (SELECT p.product_name 
           FROM transaction_items ti 
           LEFT JOIN products p ON p.product_id = ti.product_id 
           WHERE ti.transaction_id = t.transaction_id 
           LIMIT 1) as first_product_name
        FROM transactions t
        LEFT JOIN transaction_payment tp ON t.transaction_id = tp.transaction_id
        WHERE t.cashier_user_id = $1
        ORDER BY t.updated_at DESC NULLS LAST, t.created_at DESC NULLS LAST
        LIMIT 20
      `,
      [userId]
    );
    // Format the response to match the frontend expectations
    const formattedRows = (result.rows || []).map(row => {
      const total = parseFloat(row.total_amount) || 0;
      const amountReceived = parseFloat(row.amount_received) || total;
      const change = parseFloat(row.change_given) || 0;
      
      return {
        ...row,
        total_amount: total,
        payment: {
          method: row.payment_type || 'cash',
          amountTendered: amountReceived,
          change: change,
          // Include these for backward compatibility
          amount_received: amountReceived,
          money_change: change
        },
        // Add a simple items array for compatibility
        items: [{
          product_name: row.first_product_name || 'Item',
          quantity: row.item_count || 1,
          price: (total / (row.item_count || 1)).toFixed(2),
          subtotal: total.toFixed(2)
        }]
      };
    });
    
    return res.json(formattedRows);
  } catch (err) {
    console.error('Failed to fetch recent receipts', err);
    return res.status(500).json({ error: 'Failed to fetch receipts' });
  }
};

/**
 * Get recent transactions for the entire business (admin view)
 */
exports.getRecentBusinessReceipts = async (req, res) => {
  const businessId = req.user?.businessId;
  if (!businessId) return res.status(400).json({ error: 'Business ID is required' });

  try {
    const result = await pool.query(
      `
        SELECT
        t.transaction_id,
        t.transaction_number,
        t.created_at,
        t.updated_at,
        t.status,
        t.total_amount::numeric,
        t.business_id,
        t.cashier_user_id,
        u.username as cashier_name,
        -- Payment information
        COALESCE((
          SELECT payment_type 
          FROM transaction_payment 
          WHERE transaction_id = t.transaction_id 
          ORDER BY 
            CASE WHEN payment_type = 'cash' THEN 0 ELSE 1 END,  -- Prefer 'cash' payments
            transaction_payment_id DESC 
          LIMIT 1
        ), 'cash') as payment_type,
        COALESCE((
          SELECT money_received 
          FROM transaction_payment 
          WHERE transaction_id = t.transaction_id 
          ORDER BY 
            CASE WHEN payment_type = 'cash' THEN 0 ELSE 1 END,  -- Prefer 'cash' payments
            transaction_payment_id DESC 
          LIMIT 1
        ), t.total_amount)::numeric as amount_received,
        COALESCE((
          SELECT money_change 
          FROM transaction_payment 
          WHERE transaction_id = t.transaction_id 
          ORDER BY 
            CASE WHEN payment_type = 'cash' THEN 0 ELSE 1 END,  -- Prefer 'cash' payments
            transaction_payment_id DESC 
          LIMIT 1
        ), 0)::numeric as change_given,
        -- Rest of the query remains the same...
        CASE WHEN EXISTS (
          SELECT 1 
          FROM transaction_payment 
          WHERE transaction_id = t.transaction_id 
          AND discount_id IS NOT NULL
        ) THEN 'Discount Applied' ELSE 'No discount' END as discount_info,
        0 as discount_percentage,
        0 as discount_amount,
        (SELECT COUNT(*) FROM transaction_items WHERE transaction_id = t.transaction_id) as item_count,
        (SELECT p.product_name 
        FROM transaction_items ti 
        LEFT JOIN products p ON p.product_id = ti.product_id 
        WHERE ti.transaction_id = t.transaction_id 
        ORDER BY ti.transaction_item_id
        LIMIT 1) as first_product_name
      FROM transactions t
      LEFT JOIN users u ON t.cashier_user_id = u.user_id
      WHERE t.business_id = $1
        AND t.status = 'completed'
      ORDER BY t.updated_at DESC NULLS LAST, t.created_at DESC NULLS LAST
      LIMIT 50
      `,
      [businessId]
    );

    // Format the response to match the frontend expectations
    const formattedRows = (result.rows || []).map(row => {
      const total = parseFloat(row.total_amount) || 0;
      const amountReceived = parseFloat(row.amount_received) || total;
      const change = parseFloat(row.change_given) || 0;
      
      return {
        transaction_id: row.transaction_id,
        transaction_number: row.transaction_number,
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        total_amount: total,
        payment: {
          method: row.payment_type || 'cash',
          amountTendered: amountReceived,
          change: change,
          amount_received: amountReceived,
          money_change: change
        },
        cashier_name: row.cashier_name || 'Unknown',
        discount_percentage: row.discount_percentage,
        discount_amount: row.discount_amount,
        items: [{
          product_name: row.first_product_name || 'Item',
          quantity: row.item_count || 1,
          price: (total / (row.item_count || 1)).toFixed(2),
          subtotal: total.toFixed(2)
        }]
      };
    });
    
    return res.json(formattedRows);
  } catch (err) {
    console.error('Failed to fetch business receipts', err);
    return res.status(500).json({ error: 'Failed to fetch business receipts' });
  }
};
