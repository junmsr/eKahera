const pool = require('../config/database');

exports.getStock = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.inventory_id, i.product_id, p.product_name, p.sku, i.quantity_in_stock
       FROM inventory i JOIN products p ON p.product_id = i.product_id
       ORDER BY p.product_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adjustStock = async (req, res) => {
  const { product_id, delta } = req.body;
  if (!product_id || !Number.isInteger(delta)) {
    return res.status(400).json({ error: 'product_id and integer delta are required' });
  }
  try {
    const result = await pool.query(
      'UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1 WHERE product_id = $2 RETURNING *',
      [delta, product_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inventory not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
