const pool = require('../config/database');

// Helper to determine business id from request (support superadmin query param)
function resolveBusinessId(req) {
  const role = (req.user?.role || '').toLowerCase();
  return role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
}

exports.getOverview = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) return res.status(200).json({ message: 'no business selected', metrics: {} });

    // Use sales_summary_view to compute today's aggregates
    const kpiRes = await pool.query(
      `SELECT COALESCE(SUM(total_sales_amount),0) AS total_sales,
              COALESCE(SUM(total_transactions),0) AS total_transactions,
              COALESCE(SUM(total_items_sold),0) AS total_items
       FROM sales_summary_view
       WHERE business_id = $1 AND sale_date = CURRENT_DATE`,
      [businessId]
    );

    // Average transaction value over the period
    const avgTx = kpiRes.rows[0].total_transactions > 0 ? Number(kpiRes.rows[0].total_sales) / Number(kpiRes.rows[0].total_transactions) : 0;

    // Top products and categories
    const topProductsRes = await pool.query(
      `SELECT product_id, product_name, total_sold, total_revenue
       FROM top_selling_products
       WHERE business_id = $1
       ORDER BY total_sold DESC
       LIMIT 5`,
      [businessId]
    );

    const categoriesRes = await pool.query(
      `SELECT product_category_name, total_items_sold, total_revenue
       FROM category_sales_view
       WHERE business_id = $1
       ORDER BY total_revenue DESC
       LIMIT 5`,
      [businessId]
    );

    res.json({
      totalSales: Number(kpiRes.rows[0].total_sales) || 0,
      totalTransactions: Number(kpiRes.rows[0].total_transactions) || 0,
      totalItemsSold: Number(kpiRes.rows[0].total_items) || 0,
      averageTransactionValue: Math.round(avgTx * 100) / 100,
      topProducts: topProductsRes.rows || [],
      topCategories: categoriesRes.rows || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInventoryMovement = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) return res.status(200).json([]);

    const q = await pool.query(
      `SELECT product_id, product_name, product_category_name, quantity_in_stock, total_sold, total_handled
       FROM inventory_movement_view
       WHERE business_id = $1
       ORDER BY COALESCE(quantity_in_stock,0) ASC, COALESCE(total_sold,0) DESC
       LIMIT 20`,
      [businessId]
    );
    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfitAnalysis = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) return res.status(200).json([]);

    const q = await pool.query(
      `SELECT product_id, product_name, product_category_name, total_quantity_sold, total_revenue, total_cost, gross_profit, profit_margin_percentage
       FROM profit_analysis_view
       WHERE business_id = $1
       ORDER BY gross_profit DESC
       LIMIT 10`,
      [businessId]
    );
    res.json(q.rows.map(r => ({
      ...r,
      total_quantity_sold: Number(r.total_quantity_sold) || 0,
      total_revenue: Number(r.total_revenue) || 0,
      total_cost: Number(r.total_cost) || 0,
      gross_profit: Number(r.gross_profit) || 0,
      profit_margin_percentage: Number(r.profit_margin_percentage) || 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCashierPerformance = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) return res.status(200).json([]);

    const q = await pool.query(
      `SELECT cashier_id, cashier_name, total_transactions_handled, total_sales_generated, average_transaction_value, first_transaction, last_transaction
       FROM cashier_performance_view
       WHERE business_id = $1
       ORDER BY total_sales_generated DESC
       LIMIT 10`,
      [businessId]
    );
    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesTimeseriesFromView = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    const days = Math.max(1, Math.min(365, Number(req.query?.days) || 30));
    if (!businessId) return res.status(200).json([]);

    const q = await pool.query(
      `SELECT to_char(sale_date, 'YYYY-MM-DD') as day, COALESCE(total_sales_amount,0) as total
       FROM sales_summary_view
       WHERE business_id = $1 AND sale_date >= (NOW()::date - ($2::int - 1) * INTERVAL '1 day')
       ORDER BY sale_date`,
      [businessId, days]
    );

    res.json(q.rows.map(r => ({ day: r.day, total: Number(r.total) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
