const pool = require('../config/database');

exports.getSummary = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const tenantId = role === 'superadmin' ? (req.query?.tenant_id ? Number(req.query.tenant_id) : null) : (req.user?.tenantId || null);
    if (!tenantId) return res.json({ totalRevenue: 0, newCustomers: 0, activeAccounts: 0, growthRate: 0 });

    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total
       FROM transactions
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId]
    );

    const customersRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE u.tenant_id = $1 AND lower(ut.user_type_name) = 'customer'`,
      [tenantId]
    );

    const accountsRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM users WHERE tenant_id = $1`,
      [tenantId]
    );

    // Simple growth rate placeholder: week-over-week revenue change
    const currWeek = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions
       WHERE tenant_id = $1 AND created_at >= date_trunc('week', NOW())`,
      [tenantId]
    );
    const prevWeek = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions
       WHERE tenant_id = $1 AND created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
         AND created_at < date_trunc('week', NOW())`,
      [tenantId]
    );
    const growthRate = Number(prevWeek.rows[0].total) === 0
      ? 0
      : ((Number(currWeek.rows[0].total) - Number(prevWeek.rows[0].total)) / Number(prevWeek.rows[0].total)) * 100;

    res.json({
      totalRevenue: Number(revenueRes.rows[0].total) || 0,
      newCustomers: customersRes.rows[0].cnt || 0,
      activeAccounts: accountsRes.rows[0].cnt || 0,
      growthRate: Math.round(growthRate * 10) / 10
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesTimeseries = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const tenantId = role === 'superadmin' ? (req.query?.tenant_id ? Number(req.query.tenant_id) : null) : (req.user?.tenantId || null);
    const days = Math.max(1, Math.min(180, Number(req.query?.days) || 30));
    if (!tenantId) return res.json([]);

    const tsRes = await pool.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(t.total_amount),0) AS total
       FROM generate_series(NOW()::date - ($2::int - 1) * INTERVAL '1 day', NOW()::date, INTERVAL '1 day') AS d
       LEFT JOIN transactions t ON t.tenant_id = $1 AND date_trunc('day', t.created_at) = d
       GROUP BY d
       ORDER BY d`,
      [tenantId, days]
    );
    res.json(tsRes.rows.map(r => ({ name: r.day, value: Number(r.total) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesByCategory = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const tenantId = role === 'superadmin' ? (req.query?.tenant_id ? Number(req.query.tenant_id) : null) : (req.user?.tenantId || null);
    if (!tenantId) return res.json([]);

    const pieRes = await pool.query(
      `SELECT COALESCE(pc.product_category_name, 'Uncategorized') AS name,
              COALESCE(SUM(ti.subtotal),0) AS value
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       WHERE t.tenant_id = $1
       GROUP BY pc.product_category_name
       ORDER BY value DESC
       LIMIT 10`,
      [tenantId]
    );
    res.json(pieRes.rows.map(r => ({ name: r.name, value: Number(r.value) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


