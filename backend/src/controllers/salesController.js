const pool = require('../config/database');

exports.checkout = async (req, res) => {
  const { tenant_id, items, discount_id, payment_type, money_received } = req.body;
  if (!tenant_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'tenant_id and items are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transRes = await client.query(
      'INSERT INTO transactions (tenant_id, cashier_user_id, created_at, updated_at) VALUES ($1, $2, now(), now()) RETURNING transaction_id',
      [tenant_id, req.user?.userId || null]
    );
    const transaction_id = transRes.rows[0].transaction_id;

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;
      // fetch current price
      const priceRes = await client.query('SELECT selling_price FROM products WHERE product_id = $1 AND (tenant_id = $2 OR $2 IS NULL)', [product_id, tenant_id]);
      const price = priceRes.rows?.[0]?.selling_price || 0;
      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
        [transaction_id, product_id, quantity, price]
      );
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 WHERE product_id = $2 AND tenant_id = $3',
        [quantity, product_id, tenant_id]
      );
    }

    // Optionally write transaction_payment
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total FROM transaction_items WHERE transaction_id = $1`,
      [transaction_id]
    );
    const total = Number(totalRes.rows[0].total) || 0;
    const money_change = money_received ? Number(money_received) - total : null;

    // update transaction total
    await client.query('UPDATE transactions SET total_amount = $1 WHERE transaction_id = $2', [total, transaction_id]);

    await client.query(
      `INSERT INTO transaction_payment (transaction_id, user_id, discount_id, payment_type, money_received, money_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [transaction_id, req.user?.userId || null, discount_id || null, payment_type || 'cash', money_received || null, money_change]
    );

    await client.query('COMMIT');
    // Log the sale
    try {
      await pool.query(
        'INSERT INTO logs (tenant_id, transaction_id, date_time) VALUES ($1, $2, NOW())',
        [tenant_id, transaction_id]
      );
    } catch (_) {}
    res.status(201).json({ transaction_id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
