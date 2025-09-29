const pool = require('../config/database');
const { logAction } = require('../utils/logger');

exports.getStock = async (req, res) => {
  try {
    const params = [];
    let where = '';

    const role = (req.user?.role || '').toLowerCase();
    const userBusinessId = req.user?.businessId || null;
    const queryBusinessId = req.query?.business_id ? Number(req.query.business_id) : null;

    // Superadmin can optionally filter by business_id; otherwise return empty by default
    if (role === 'superadmin') {
      if (queryBusinessId) {
        params.push(queryBusinessId);
        where = 'WHERE p.business_id = $1';
      } else {
        return res.json([]);
      }
    } else {
      // Admin/Cashier must be business-scoped; if missing, return empty
      if (!userBusinessId) {
        return res.json([]);
      }
      params.push(userBusinessId);
      where = 'WHERE p.business_id = $1';
    }
    const result = await pool.query(
      `SELECT 
        p.product_id as id,
        p.product_name as name,
        COALESCE(pc.product_category_name, 'Uncategorized') as category,
        p.description,
        p.cost_price,
        p.selling_price,
        COALESCE(i.quantity_in_stock, 0) as quantity,
        p.sku
       FROM products p
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       LEFT JOIN inventory i ON i.product_id = p.product_id AND i.business_id = p.business_id
       ${where}
       ORDER BY p.product_name`,
      params
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
    const params = [delta, product_id];
    let where = 'product_id = $2';
    if (req.user?.businessId) {
      params.push(req.user.businessId);
      where += ' AND business_id = $3';
    }
    const result = await pool.query(
      `UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1 WHERE ${where} RETURNING *`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inventory not found' });
    // Log inventory adjustment
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Adjust stock by ${delta} for product_id=${result.rows[0].product_id} (inventory_id=${result.rows[0].inventory_id})`
    });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { product_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete from inventory first (if exists)
    await client.query('DELETE FROM inventory WHERE product_id = $1 AND business_id = $2', 
      [product_id, req.user?.businessId || null]);
    
    // Delete from products
    const result = await client.query(
      'DELETE FROM products WHERE product_id = $1 AND business_id = $2 RETURNING *',
      [product_id, req.user?.businessId || null]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await client.query('COMMIT');
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Delete product_id=${product_id}`
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const { product_name, cost_price, selling_price, sku, category, description } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Resolve category if provided
    let categoryId = null;
    if (category && category.trim()) {
      const existing = await client.query(
        'SELECT product_category_id FROM product_categories WHERE LOWER(product_category_name) = LOWER($1) LIMIT 1', 
        [category.trim()]
      );
      if (existing.rowCount > 0) {
        categoryId = existing.rows[0].product_category_id;
      } else {
        const insCat = await client.query(
          'INSERT INTO product_categories (product_category_name) VALUES ($1) RETURNING product_category_id', 
          [category.trim()]
        );
        categoryId = insCat.rows[0].product_category_id;
      }
    }
    
    // Update product
    const result = await client.query(
      `UPDATE products 
       SET product_name = $1, cost_price = $2, selling_price = $3, sku = $4, 
           product_category_id = $5, description = $6, updated_at = NOW()
       WHERE product_id = $7 AND business_id = $8
       RETURNING *`,
      [product_name, cost_price, selling_price, sku, categoryId, description, product_id, req.user?.businessId || null]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
