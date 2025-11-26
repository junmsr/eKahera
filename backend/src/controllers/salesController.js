const pool = require('../config/database');
const { logAction } = require('../utils/logger');

const generateTransactionNumber = (businessId) => {
  const businessPart = businessId ? String(businessId).padStart(2, '0') : '00';
  const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `T-${businessPart}-${timePart}-${randPart}`;
};

exports.checkout = async (req, res) => {
  const { discount_id, payment_type, money_received, discount_percentage, discount_amount, transaction_id, transaction_number: frontendTxnNumber } = req.body || {};
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

    if (!transaction_id) {
      // Prioritize frontend transaction number, fall back to generating one
      transaction_number = frontendTxnNumber || generateTransactionNumber(req.user?.businessId);

      // Insert new transaction if no transaction_id provided
      const transRes = await client.query(
        'INSERT INTO transactions (business_id, cashier_user_id, created_at, updated_at, status, transaction_number) VALUES ($1, $2, now(), now(), $3, $4) RETURNING transaction_id',
        [req.user?.businessId || null, req.user?.userId || null, 'completed', transaction_number]
      );
      effectiveTransactionId = transRes.rows[0].transaction_id;
    } else {
      // Lock the existing transaction row for update and fetch its transaction_number
      const tRes = await client.query('SELECT transaction_id, status, transaction_number FROM transactions WHERE transaction_id = $1 FOR UPDATE', [transaction_id]);
      if (tRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Transaction not found' });
      }
      transaction_number = tRes.rows[0].transaction_number;
      // Update transaction with cashier_user_id, status 'completed', updated_at
      await client.query(
        'UPDATE transactions SET cashier_user_id = $1, status = $2, updated_at = NOW() WHERE transaction_id = $3',
        [req.user?.userId || null, 'completed', transaction_id]
      );
      // Delete old transaction_items for this transaction
      await client.query('DELETE FROM transaction_items WHERE transaction_id = $1', [transaction_id]);
      // Delete old transaction_payment rows if any for this transaction (optional, could also update instead)
      await client.query('DELETE FROM transaction_payment WHERE transaction_id = $1', [transaction_id]);
    }

    // Insert transaction_items for all items
    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;
      // fetch current price
      const priceRes = await client.query('SELECT selling_price FROM products WHERE product_id = $1 AND (business_id = $2 OR $2 IS NULL)', [product_id, req.user?.businessId || null]);
      const price = priceRes.rows?.[0]?.selling_price || 0;
      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
        [effectiveTransactionId, product_id, quantity, price]
      );
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE product_id = $2 AND business_id = $3',
        [quantity, product_id, req.user?.businessId || null]
      );
    }

    const totalRes = await client.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total FROM transaction_items WHERE transaction_id = $1`,
      [effectiveTransactionId]
    );
    let total = Number(totalRes.rows[0].total) || 0;

    // Resolve discount percent if discount_id provided
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

    // Update total_amount in transactions
    await client.query('UPDATE transactions SET total_amount = $1 WHERE transaction_id = $2', [total, effectiveTransactionId]);

    // Insert a new transaction_payment
    await client.query(
      `INSERT INTO transaction_payment (transaction_id, user_id, discount_id, payment_type, money_received, money_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [effectiveTransactionId, req.user?.userId || null, discount_id || null, (payment_type || 'cash').toString(), money_received || null, money_change]
    );

    await client.query('COMMIT');
    // Log the sale
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Checkout for transaction ${effectiveTransactionId} with a total of ${total} via ${payment_type}`,
    });
    res.status(201).json({ transaction_id: effectiveTransactionId, transaction_number, total });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Public checkout endpoint for customer app (no auth); requires business_id
exports.publicCheckout = async (req, res) => {
  const { items, payment_type, money_received, business_id, customer_user_id, discount_id, discount_percentage, discount_amount, transaction_number: frontendTxnNumber } = req.body || {};
  console.log("[DEBUG publicCheckout] Received items in req.body:", items);
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }
  if (!business_id) {
    return res.status(400).json({ error: 'business_id is required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transaction_number = frontendTxnNumber || generateTransactionNumber(business_id);

    // Create transaction with status pending (customer flow)
    const transRes = await client.query(
      'INSERT INTO transactions (business_id, customer_user_id, status, created_at, updated_at, transaction_number) VALUES ($1, $2, $3, now(), now(), $4) RETURNING transaction_id',
      [business_id, customer_user_id || null, 'pending', transaction_number]
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
      [transaction_id, customer_user_id || null, discount_id || null, (payment_type || 'cash').toString(), money_received || null, money_change]
    );

    await client.query('COMMIT');
    // Log sale for visibility in logs dashboard
    try {
      logAction({
        userId: customer_user_id || null,
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
    const tRes = await client.query('SELECT transaction_id, status FROM transactions WHERE transaction_id = $1 FOR UPDATE', [transactionId]);
    if (tRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const currentStatus = tRes.rows[0].status;
    if (currentStatus === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Transaction already completed' });
    }

await client.query('UPDATE transactions SET status = $1, cashier_user_id = $2, updated_at = NOW() WHERE transaction_id = $3', ['completed', req.user?.userId || null, transactionId]);
    await client.query('COMMIT');

    // Log action
    try { logAction({ userId: req.user?.userId || null, businessId: req.user?.businessId || null, action: `Transaction ${transactionId} marked completed by user ${req.user?.userId || 'unknown'}` }); } catch (_) {}

    res.json({ transaction_id: Number(transactionId), status: 'completed', message: 'Transaction marked completed' });
  } catch (err) {
    await client.query('ROLLBACK');
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
    const result = await pool.query('SELECT transaction_id, status, total_amount FROM transactions WHERE transaction_id = $1', [transactionId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    const row = result.rows[0];
    res.json({ transaction_id: row.transaction_id, status: row.status, total: Number(row.total_amount) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
