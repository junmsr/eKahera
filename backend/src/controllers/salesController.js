const pool = require('../config/database');
const { logAction } = require('../utils/logger');

exports.checkout = async (req, res) => {
  const { discount_id, payment_type, money_received, discount_percentage, discount_amount } = req.body || {};
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

    const transRes = await client.query(
      'INSERT INTO transactions (business_id, cashier_user_id, created_at, updated_at) VALUES ($1, $2, now(), now()) RETURNING transaction_id',
      [req.user?.businessId || null, req.user?.userId || null]
    );
    const transaction_id = transRes.rows[0].transaction_id;

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;
      // fetch current price
      const priceRes = await client.query('SELECT selling_price FROM products WHERE product_id = $1 AND (business_id = $2 OR $2 IS NULL)', [product_id, req.user?.businessId || null]);
      const price = priceRes.rows?.[0]?.selling_price || 0;
      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
        [transaction_id, product_id, quantity, price]
      );
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE product_id = $2 AND business_id = $3',
        [quantity, product_id, req.user?.businessId || null]
      );
    }

    // Optionally write transaction_payment
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total FROM transaction_items WHERE transaction_id = $1`,
      [transaction_id]
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
    // If not via id, accept provided percentage or fixed amount
    if (appliedDiscountPct == null && Number.isFinite(Number(discount_percentage))) {
      appliedDiscountPct = Number(discount_percentage);
    }
    if (appliedDiscountPct != null && appliedDiscountPct > 0) {
      total = total - (total * (appliedDiscountPct / 100));
    } else if (Number.isFinite(Number(discount_amount)) && Number(discount_amount) > 0) {
      total = Math.max(0, total - Number(discount_amount));
    }

    const money_change = money_received ? Number(money_received) - total : null;

    // update transaction total
    await client.query('UPDATE transactions SET total_amount = $1 WHERE transaction_id = $2', [total, transaction_id]);

    await client.query(
      `INSERT INTO transaction_payment (transaction_id, user_id, discount_id, payment_type, money_received, money_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [transaction_id, req.user?.userId || null, discount_id || null, (payment_type || 'cash').toString(), money_received || null, money_change]
    );

    // Generate a human-friendly transaction number (not stored in DB)
    const businessPart = req.user?.businessId ? String(req.user.businessId).padStart(2, '0') : '00';
    const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const transaction_number = `T-${businessPart}-${timePart}-${randPart}`;

    await client.query('COMMIT');
    // Log the sale
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Successful checkout for transaction_id=${transaction_id} with a total of ${total}`
    });
    res.status(201).json({ transaction_id, transaction_number, total });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Public checkout endpoint for customer app (no auth); requires business_id
exports.publicCheckout = async (req, res) => {
  const { items, payment_type, money_received, business_id, customer_user_id, discount_id, discount_percentage, discount_amount } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }
  if (!business_id) {
    return res.status(400).json({ error: 'business_id is required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transRes = await client.query(
      'INSERT INTO transactions (business_id, customer_user_id, created_at, updated_at) VALUES ($1, $2, now(), now()) RETURNING transaction_id',
      [business_id, customer_user_id || null]
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

    const businessPart = String(business_id).padStart(2, '0');
    const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const transaction_number = `T-${businessPart}-${timePart}-${randPart}`;

    await client.query('COMMIT');
    // Log sale for visibility in logs dashboard
    try {
      logAction({
        userId: customer_user_id || null,
        businessId: business_id,
        action: `Successful public checkout for transaction_id=${transaction_id} with a total of ${total}`
      });
    } catch (_) {}
    res.status(201).json({ transaction_id, transaction_number, total });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
