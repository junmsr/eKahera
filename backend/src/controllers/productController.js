const pool = require('../config/database');

exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE product_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  const { product_category_id, product_name, cost_price, selling_price, sku } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (product_category_id, product_name, cost_price, selling_price, sku) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_category_id, product_name, cost_price, selling_price, sku]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductBySku = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE sku = $1', [req.params.sku]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
