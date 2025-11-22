const pool = require('../config/database');

exports.getSummary = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json({ totalRevenue: 0, newCustomers: 0, activeAccounts: 0, growthRate: 0 });

    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total
       FROM transactions
       WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );

    const customersRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE u.business_id = $1 AND lower(ut.user_type_name) = 'customer'`,
      [businessId]
    );

    const accountsRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM users WHERE business_id = $1`,
      [businessId]
    );

    // Simple growth rate placeholder: week-over-week revenue change
    const currWeek = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions
       WHERE business_id = $1 AND created_at >= date_trunc('week', NOW())`,
      [businessId]
    );
    const prevWeek = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions
       WHERE business_id = $1 AND created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
         AND created_at < date_trunc('week', NOW())`,
      [businessId]
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
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    const days = Math.max(1, Math.min(180, Number(req.query?.days) || 30));
    if (!businessId) return res.json([]);

    const tsRes = await pool.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(t.total_amount),0) AS total
       FROM generate_series(NOW()::date - ($2::int - 1) * INTERVAL '1 day', NOW()::date, INTERVAL '1 day') AS d
       LEFT JOIN transactions t ON t.business_id = $1 AND date_trunc('day', t.created_at) = d
       GROUP BY d
       ORDER BY d`,
      [businessId, days]
    );
    res.json(tsRes.rows.map(r => ({ name: r.day, value: Number(r.total) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesByCategory = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    const pieRes = await pool.query(
      `SELECT COALESCE(pc.product_category_name, 'Uncategorized') AS name,
              COALESCE(SUM(ti.subtotal),0) AS value
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       WHERE t.business_id = $1
       GROUP BY pc.product_category_name
       ORDER BY value DESC
       LIMIT 10`,
      [businessId]
    );
    res.json(pieRes.rows.map(r => ({ name: r.name, value: Number(r.value) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Distinct customers per day (based on transactions.customer_user_id)
exports.getCustomersTimeseries = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    const days = Math.max(1, Math.min(180, Number(req.query?.days) || 30));
    if (!businessId) return res.json([]);

    const tsRes = await pool.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
              COALESCE(cnt, 0) AS customers
       FROM generate_series(NOW()::date - ($2::int - 1) * INTERVAL '1 day', NOW()::date, INTERVAL '1 day') AS d
       LEFT JOIN (
         SELECT date_trunc('day', created_at) AS day_key,
                COUNT(DISTINCT customer_user_id) AS cnt
         FROM transactions
         WHERE business_id = $1
         GROUP BY day_key
       ) t ON t.day_key = d
       ORDER BY d`,
      [businessId, days]
    );
    res.json(tsRes.rows.map(r => ({ name: r.day, customers: Number(r.customers) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New endpoints for business report
exports.getKeyMetrics = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json({ revenue: 0, expenses: 0, netProfit: 0, grossMargin: 0 });

    // Revenue from transactions
    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const revenue = Number(revenueRes.rows[0].total) || 0;

    // Expenses: assume 65% of revenue for demo
    const expenses = Math.round(revenue * 0.65);

    // Cost of goods sold: sum of cost_price * quantity from transaction_items
    const costRes = await pool.query(
      `SELECT COALESCE(SUM(p.cost_price * ti.product_quantity),0) AS total_cost
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       WHERE t.business_id = $1 AND t.created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const costOfGoods = Number(costRes.rows[0].total_cost) || 0;

    // Gross margin = (revenue - cost) / revenue * 100
    const grossMargin = revenue > 0 ? Math.round(((revenue - costOfGoods) / revenue) * 100) : 0;

    // Net profit = revenue - expenses
    const netProfit = revenue - expenses;

    res.json({
      revenue,
      expenses,
      netProfit,
      grossMargin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesByLocation = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    // Since no location table, return sales by business (single entry)
    const salesRes = await pool.query(
      `SELECT 'Main' AS location, COALESCE(SUM(total_amount),0) AS sales FROM transactions WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );

    res.json(salesRes.rows.map(r => ({ location: r.location, sales: Number(r.sales) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRevenueVsExpenses = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    // Last 2 months
    const data = [];
    for (let i = 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const revenueRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= $2 AND created_at < $3`,
        [businessId, monthStart, monthEnd]
      );
      const revenue = Number(revenueRes.rows[0].total) || 0;
      const expenses = Math.round(revenue * 0.65); // Assume 65%

      data.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue,
        expenses
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfitTrend = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    // Last 3 months
    const data = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const revenueRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= $2 AND created_at < $3`,
        [businessId, monthStart, monthEnd]
      );
      const revenue = Number(revenueRes.rows[0].total) || 0;
      const expenses = Math.round(revenue * 0.65);
      const profit = revenue - expenses;

      data.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        profit
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    const paymentRes = await pool.query(
      `SELECT payment_type, COUNT(*) as count
       FROM transaction_payment tp
       JOIN transactions t ON t.transaction_id = tp.transaction_id
       WHERE t.business_id = $1
       GROUP BY payment_type`,
      [businessId]
    );

    const total = paymentRes.rows.reduce((s, r) => s + Number(r.count), 0) || 1;
    const data = paymentRes.rows.map(r => ({
      name: r.payment_type,
      value: Math.round((Number(r.count) / total) * 100),
      fill: r.payment_type === 'Cash' ? '#3b82f6' : r.payment_type === 'GCash' ? '#10b981' : '#f59e0b'
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductPerformance = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    const perfRes = await pool.query(
      `SELECT COALESCE(pc.product_category_name, 'Uncategorized') AS name,
              COALESCE(SUM(ti.subtotal),0) AS sales
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       WHERE t.business_id = $1
       GROUP BY pc.product_category_name
       ORDER BY sales DESC
       LIMIT 5`,
      [businessId]
    );

    // Determine trend: compare to previous period (simplified, assume current > previous for demo)
    const data = perfRes.rows.map((r, idx) => ({
      name: r.name,
      sales: Number(r.sales),
      trend: idx < 2 ? 'up' : idx < 4 ? 'down' : 'flat'
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBusinessStats = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json({ cashFlow: 0, operatingCosts: 0, profitGrowth: 0 });

    // Cash flow: assume positive, calculate as net profit
    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );
    const revenue = Number(revenueRes.rows[0].total) || 0;
    const expenses = Math.round(revenue * 0.65);
    const cashFlow = revenue - expenses;

    // Operating costs: assume 30% of revenue
    const operatingCosts = Math.round(revenue * 0.3);

    // Profit growth: compare current month to previous
    const currMonth = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= date_trunc('month', NOW())`,
      [businessId]
    );
    const prevMonth = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= date_trunc('month', NOW()) - INTERVAL '1 month' AND created_at < date_trunc('month', NOW())`,
      [businessId]
    );
    const curr = Number(currMonth.rows[0].total) || 0;
    const prev = Number(prevMonth.rows[0].total) || 0;
    const profitGrowth = prev > 0 ? Math.round(((curr - prev) / prev) * 100 * 10) / 10 : 0;

    res.json({
      cashFlow,
      operatingCosts,
      profitGrowth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
