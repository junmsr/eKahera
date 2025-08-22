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
      'INSERT INTO transactions (tenant_id) VALUES ($1) RETURNING transaction_id',
      [tenant_id]
    );
    const transaction_id = transRes.rows[0].transaction_id;

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity) continue;
      await client.query(
        'INSERT INTO cart (transaction_id, product_id, product_quantity) VALUES ($1, $2, $3)',
        [transaction_id, product_id, quantity]
      );
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 WHERE product_id = $2',
        [quantity, product_id]
      );
    }

    // Optionally write transaction_payment
    if (payment_type !== undefined || discount_id || money_received) {
      const totalRes = await client.query(
        `SELECT COALESCE(SUM(p.selling_price * c.product_quantity), 0) AS total
         FROM cart c JOIN products p ON p.product_id = c.product_id
         WHERE c.transaction_id = $1`,
        [transaction_id]
      );
      const total = Number(totalRes.rows[0].total) || 0;
      const money_change = money_received ? Number(money_received) - total : null;
      await client.query(
        `INSERT INTO transaction_payment (user_id, discount_id, payment_type, money_received, money_change)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user?.roleId || null, discount_id || null, payment_type ?? true, money_received || null, money_change]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ transaction_id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
