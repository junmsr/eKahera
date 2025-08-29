const pool = require('../config/database');

exports.getStock = async (req, res) => {
  try {
    const params = [];
    let where = '';

    const role = (req.user?.role || '').toLowerCase();
    const userTenantId = req.user?.tenantId || null;
    const queryTenantId = req.query?.tenant_id ? Number(req.query.tenant_id) : null;

    // Superadmin can optionally filter by tenant_id; otherwise return empty by default
    if (role === 'superadmin') {
      if (queryTenantId) {
        params.push(queryTenantId);
        where = 'WHERE i.tenant_id = $1';
      } else {
        return res.json([]);
      }
    } else {
      // Admin/Cashier must be tenant-scoped; if missing, return empty
      if (!userTenantId) {
        return res.json([]);
      }
      params.push(userTenantId);
      where = 'WHERE i.tenant_id = $1';
    }
    const result = await pool.query(
      `SELECT i.inventory_id, i.product_id, p.product_name, p.sku, i.quantity_in_stock
       FROM inventory i JOIN products p ON p.product_id = i.product_id
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
    if (req.user?.tenantId) {
      params.push(req.user.tenantId);
      where += ' AND tenant_id = $3';
    }
    const result = await pool.query(
      `UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1 WHERE ${where} RETURNING *`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inventory not found' });
    // Log inventory adjustment
    try {
      await pool.query(
        'INSERT INTO logs (tenant_id, inventory_id, product_id, date_time) VALUES ($1, $2, $3, NOW())',
        [req.user?.tenantId || null, result.rows[0].inventory_id, result.rows[0].product_id]
      );
    } catch (_) {}
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
