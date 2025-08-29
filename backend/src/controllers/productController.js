const pool = require('../config/database');

exports.getAllProducts = async (req, res) => {
  try {
    const params = [];
    let where = '';
    const role = (req.user?.role || '').toLowerCase();
    const userTenantId = req.user?.tenantId || null;
    const queryTenantId = req.query?.tenant_id ? Number(req.query.tenant_id) : null;

    if (role === 'superadmin') {
      if (queryTenantId) {
        params.push(queryTenantId);
        where = 'WHERE tenant_id = $1';
      } else {
        return res.json([]);
      }
    } else {
      if (!userTenantId) return res.json([]);
      params.push(userTenantId);
      where = 'WHERE tenant_id = $1';
    }
    const result = await pool.query(`SELECT * FROM products ${where} ORDER BY product_id DESC`, params);
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
  try {
    const body = req.body || {};
    const product_category_id = body.product_category_id ?? null;
    console.log('Incoming request body:', body); // Log the incoming request body
    const product_name = body.product_name || body.name;
    console.log('Product name:', product_name); // Log the product name before validation
    const cost_price = body.cost_price ?? 0;
    const selling_price = body.selling_price ?? body.price ?? 0;
    const sku = body.sku || `SKU-${Date.now()}`;

    if (!product_name) {
      return res.status(400).json({ error: 'product_name is required' });
    }

    const tenantId = req.user?.tenantId || null;
    const result = await pool.query(
      'INSERT INTO products (product_category_id, product_name, cost_price, selling_price, sku, tenant_id, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [product_category_id, product_name, cost_price, selling_price, sku, tenantId, req.user?.userId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductBySku = async (req, res) => {
  try {
    const params = [req.params.sku];
    let where = 'sku = $1';
    if (req.user?.tenantId) {
      params.push(req.user.tenantId);
      where += ' AND tenant_id = $2';
    }
    const result = await pool.query(`SELECT * FROM products WHERE ${where}`, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add or adjust stock by SKU
exports.addStockBySku = async (req, res) => {
  const { sku, quantity } = req.body;
  if (!sku || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Valid sku and positive integer quantity are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const params = [sku];
    let where = 'sku = $1';
    if (req.user?.tenantId) {
      params.push(req.user.tenantId);
      where += ' AND tenant_id = $2';
    }
    const prod = await client.query(`SELECT product_id FROM products WHERE ${where} LIMIT 1`, params);
    if (prod.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found for this tenant' });
    }
    const productId = prod.rows[0].product_id;
    // Upsert inventory row for this product+business
    await client.query(
      `INSERT INTO inventory (product_id, quantity_in_stock, tenant_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, tenant_id) DO UPDATE SET quantity_in_stock = inventory.quantity_in_stock + EXCLUDED.quantity_in_stock`,
      [productId, quantity, req.user?.tenantId || null]
    );
    await client.query('COMMIT');
    // Log stock add
    try {
      const invRow = await pool.query('SELECT inventory_id FROM inventory WHERE product_id = $1 AND tenant_id = $2', [productId, req.user?.tenantId || null]);
      await pool.query(
        'INSERT INTO logs (tenant_id, inventory_id, product_id, date_time) VALUES ($1, $2, $3, NOW())',
        [req.user?.tenantId || null, invRow.rows?.[0]?.inventory_id || null, productId]
      );
    } catch (_) {}
    res.json({ message: 'Stock added', product_id: productId, quantity });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
