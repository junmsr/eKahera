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

    const { startDate, endDate } = req.query;
    const queryParams = [businessId];
    let dateFilter = '';

    if (startDate && endDate) {
      queryParams.push(startDate);
      queryParams.push(endDate);
      dateFilter = `AND DATE(t.created_at) BETWEEN $2 AND $3`;
    }

    const pieRes = await pool.query(
      `SELECT COALESCE(pc.product_category_name, 'Uncategorized') AS name,
              COALESCE(SUM(ti.subtotal),0) AS value
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       WHERE t.business_id = $1 
         AND t.status = 'completed'
         ${dateFilter}
       GROUP BY pc.product_category_name
       ORDER BY value DESC
       LIMIT 10`,
      queryParams
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
    if (!businessId) return res.json([]);

    let { startDate, endDate } = req.query;

    // Default to last 30 days if no date range is provided
    if (!startDate || !endDate) {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];
      const start = new Date();
      start.setDate(now.getDate() - 29);
      startDate = start.toISOString().split('T')[0];
    }

    const tsRes = await pool.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
              COALESCE(cnt, 0) AS customers
       FROM generate_series($2::date, $3::date, INTERVAL '1 day') AS d
       LEFT JOIN (
         SELECT date_trunc('day', created_at) AS day_key,
                COUNT(DISTINCT customer_user_id) AS cnt
         FROM transactions
         WHERE business_id = $1
           AND status = 'completed'
           AND DATE(created_at) BETWEEN $2::date AND $3::date
         GROUP BY day_key
       ) t ON t.day_key = d
       ORDER BY d`,
      [businessId, startDate, endDate]
    );
    res.json(tsRes.rows.map(r => ({ name: r.day, customers: Number(r.customers) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Helper function to get key metrics for a given period
const getPeriodMetrics = async (businessId, startDate, endDate) => {
  // Revenue from transactions
  const revenueRes = await pool.query(
    `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= $2 AND created_at < $3`,
    [businessId, startDate, endDate]
  );
  const revenue = Number(revenueRes.rows[0].total) || 0;

  // Cost of goods sold
  const costRes = await pool.query(
    `SELECT COALESCE(SUM(p.cost_price * ti.product_quantity),0) AS total_cost
     FROM transactions t
     JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
     JOIN products p ON p.product_id = ti.product_id
     WHERE t.business_id = $1 AND t.created_at >= $2 AND t.created_at < $3`,
    [businessId, startDate, endDate]
  );
  const costOfGoods = Number(costRes.rows[0].total_cost) || 0;

  const expenses = costOfGoods;

  // Gross margin
  const grossMargin = revenue > 0 ? Math.round(((revenue - costOfGoods) / revenue) * 100) : 0;

  // Net profit
  const netProfit = revenue - expenses;

  return { revenue, expenses, netProfit, grossMargin };
};

// New endpoints for business report
exports.getKeyMetrics = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json({
      revenue: { value: 0, change: 0 },
      expenses: { value: 0, change: 0 },
      netProfit: { value: 0, change: 0 },
      grossMargin: { value: 0, change: 0 }
    });

    const { startDate, endDate } = req.query;
    let end, start, prevEnd, prevStart;

    if (startDate && endDate) {
      // Use provided date range
      end = new Date(endDate);
      start = new Date(startDate);
      
      // Calculate previous period (same duration before startDate)
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - duration);
    } else {
      // Default: last 30 days
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);

      prevEnd = start;
      prevStart = new Date();
      prevStart.setDate(prevEnd.getDate() - 30);
    }

    const currentMetrics = await getPeriodMetrics(businessId, start, end);
    const previousMetrics = await getPeriodMetrics(businessId, prevStart, prevEnd);

    const calculateChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      revenue: {
        value: currentMetrics.revenue,
        change: calculateChange(currentMetrics.revenue, previousMetrics.revenue)
      },
      expenses: {
        value: currentMetrics.expenses,
        change: calculateChange(currentMetrics.expenses, previousMetrics.expenses)
      },
      netProfit: {
        value: currentMetrics.netProfit,
        change: calculateChange(currentMetrics.netProfit, previousMetrics.netProfit)
      },
      grossMargin: {
        value: currentMetrics.grossMargin,
        change: calculateChange(currentMetrics.grossMargin, previousMetrics.grossMargin)
      }
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

    const { startDate, endDate } = req.query;
    let queryParams = [businessId];
    let dateFilter = '';

    if (startDate && endDate) {
      queryParams.push(startDate);
      queryParams.push(endDate);
      dateFilter = `AND DATE(created_at) BETWEEN $2 AND $3`;
    } else {
      // Default to last 30 days if no date range provided
      dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
    }

    // Since no location table, return sales by business (single entry)
    const salesRes = await pool.query(
      `SELECT 'Main' AS location, COALESCE(SUM(total_amount),0) AS sales FROM transactions WHERE business_id = $1 ${dateFilter}`,
      queryParams
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

    const { startDate, endDate } = req.query;
    let data = [];

    if (startDate && endDate) {
      // Use provided date range - split into months if range spans multiple months
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Group by month within the date range
      const monthMap = new Map();
      const current = new Date(start);
      
      while (current <= end) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
        
        // Clamp to actual date range
        const rangeStart = monthStart < start ? start : monthStart;
        const rangeEnd = monthEnd > end ? end : monthEnd;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { monthStart: rangeStart, monthEnd: rangeEnd, monthName: monthStart.toLocaleString('default', { month: 'short' }) });
        }
        
        current.setMonth(current.getMonth() + 1);
      }
      
      // Fetch data for each month
      for (const [key, { monthStart, monthEnd, monthName }] of monthMap) {
        const revenueRes = await pool.query(
          `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= $2 AND created_at <= $3`,
          [businessId, monthStart, monthEnd]
        );
        const revenue = Number(revenueRes.rows[0].total) || 0;
        
        const costRes = await pool.query(
          `SELECT COALESCE(SUM(p.cost_price * ti.product_quantity),0) AS total_cost
           FROM transactions t
           JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
           JOIN products p ON p.product_id = ti.product_id
           WHERE t.business_id = $1 AND t.created_at >= $2 AND t.created_at <= $3`,
          [businessId, monthStart, monthEnd]
        );
        const expenses = Number(costRes.rows[0].total_cost) || 0;

        data.push({
          month: monthName,
          revenue,
          expenses
        });
      }
    } else {
      // Default: Last 2 months
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
        
        const costRes = await pool.query(
          `SELECT COALESCE(SUM(p.cost_price * ti.product_quantity),0) AS total_cost
           FROM transactions t
           JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
           JOIN products p ON p.product_id = ti.product_id
           WHERE t.business_id = $1 AND t.created_at >= $2 AND t.created_at < $3`,
          [businessId, monthStart, monthEnd]
        );
        const expenses = Number(costRes.rows[0].total_cost) || 0;

        data.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          revenue,
          expenses
        });
      }
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

    const { startDate, endDate } = req.query;
    let data = [];

    if (startDate && endDate) {
      // Use provided date range - split into months if range spans multiple months
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Group by month within the date range
      const monthMap = new Map();
      const current = new Date(start);
      
      while (current <= end) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
        
        // Clamp to actual date range
        const rangeStart = monthStart < start ? start : monthStart;
        const rangeEnd = monthEnd > end ? end : monthEnd;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { monthStart: rangeStart, monthEnd: rangeEnd, monthName: monthStart.toLocaleString('default', { month: 'short' }) });
        }
        
        current.setMonth(current.getMonth() + 1);
      }
      
      // Fetch data for each month
      for (const [key, { monthStart, monthEnd, monthName }] of monthMap) {
        const revenueRes = await pool.query(
          `SELECT COALESCE(SUM(total_amount),0) AS total FROM transactions WHERE business_id = $1 AND created_at >= $2 AND created_at <= $3`,
          [businessId, monthStart, monthEnd]
        );
        const revenue = Number(revenueRes.rows[0].total) || 0;
        const costRes = await pool.query(
          `SELECT COALESCE(SUM(p.cost_price * ti.product_quantity),0) AS total_cost
           FROM transactions t
           JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
           JOIN products p ON p.product_id = ti.product_id
           WHERE t.business_id = $1 AND t.created_at >= $2 AND t.created_at <= $3`,
          [businessId, monthStart, monthEnd]
        );
        const expenses = Number(costRes.rows[0].total_cost) || 0;
        const profit = revenue - expenses;

        data.push({
          month: monthName,
          profit
        });
      }
    } else {
      // Default: Last 3 months
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
        const costRes = await pool.query(
          `SELECT COALESCE(SUM(p.cost_price * ti.product_quantity),0) AS total_cost
           FROM transactions t
           JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
           JOIN products p ON p.product_id = ti.product_id
           WHERE t.business_id = $1 AND t.created_at >= $2 AND t.created_at < $3`,
          [businessId, monthStart, monthEnd]
        );
        const expenses = Number(costRes.rows[0].total_cost) || 0;
        const profit = revenue - expenses;

        data.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          profit
        });
      }
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

    const { startDate, endDate } = req.query;
    let queryParams = [businessId];
    let dateFilter = '';

    if (startDate && endDate) {
      queryParams.push(startDate);
      queryParams.push(endDate);
      dateFilter = `AND DATE(t.created_at) BETWEEN $2 AND $3`;
    }

    const paymentRes = await pool.query(
      `SELECT payment_type, COUNT(*) as count
       FROM transaction_payment tp
       JOIN transactions t ON t.transaction_id = tp.transaction_id
       WHERE t.business_id = $1 ${dateFilter}
       GROUP BY payment_type`,
      queryParams
    );

    const total = paymentRes.rows.reduce((s, r) => s + Number(r.count), 0) || 1;
    const data = paymentRes.rows.map(r => ({
      name: r.payment_type,
      value: Math.round((Number(r.count) / total) * 100),
      fill: r.payment_type === 'Cash' ? '#3b82f6' : r.payment_type === 'GCash' ? '#10b981' : r.payment_type === 'Maya' ? '#8B5CF6' : '#f59e0b'
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

    const { startDate, endDate } = req.query;
    let currentQueryParams = [businessId];
    let currentDateFilter = '';
    let previousQueryParams = [businessId];
    let previousDateFilter = '';

    if (startDate && endDate) {
      // Calculate previous period (same duration before startDate)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - duration);

      currentQueryParams.push(startDate);
      currentQueryParams.push(endDate);
      currentDateFilter = `AND DATE(t.created_at) BETWEEN $2 AND $3`;

      previousQueryParams.push(prevStart.toISOString().split('T')[0]);
      previousQueryParams.push(prevEnd.toISOString().split('T')[0]);
      previousDateFilter = `AND DATE(t.created_at) BETWEEN $2 AND $3`;
    } else {
      // Default: last 30 days vs previous 30 days
      currentDateFilter = `AND t.created_at >= NOW() - INTERVAL '30 days'`;
      previousDateFilter = `AND t.created_at >= NOW() - INTERVAL '60 days' AND t.created_at < NOW() - INTERVAL '30 days'`;
    }

    const currentSalesRes = await pool.query(
      `SELECT COALESCE(pc.product_category_name, 'Uncategorized') AS name,
              COALESCE(SUM(ti.subtotal),0) AS sales
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       WHERE t.business_id = $1 ${currentDateFilter}
       GROUP BY pc.product_category_name
       ORDER BY sales DESC
       LIMIT 5`,
      currentQueryParams
    );

    const previousSalesRes = await pool.query(
      `SELECT COALESCE(pc.product_category_name, 'Uncategorized') AS name,
              COALESCE(SUM(ti.subtotal),0) AS sales
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
       JOIN products p ON p.product_id = ti.product_id
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       WHERE t.business_id = $1 ${previousDateFilter}
       GROUP BY pc.product_category_name`,
      previousQueryParams
    );

    const previousSalesMap = new Map(previousSalesRes.rows.map(r => [r.name, Number(r.sales)]));

    const data = currentSalesRes.rows.map(r => {
      const currentSales = Number(r.sales);
      const previousSales = previousSalesMap.get(r.name) || 0;
      let trend = 'flat';
      if (currentSales > previousSales) {
        trend = 'up';
      } else if (currentSales < previousSales) {
        trend = 'down';
      }
      return {
        name: r.name,
        sales: currentSales,
        trend: trend
      };
    });

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

    const { startDate, endDate } = req.query;
    let end, start, prevEnd, prevStart;

    if (startDate && endDate) {
      // Use provided date range
      end = new Date(endDate);
      start = new Date(startDate);
      
      // Calculate previous period (same duration before startDate)
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - duration);
    } else {
      // Default: last month
      end = new Date();
      start = new Date();
      start.setMonth(end.getMonth() - 1);

      prevEnd = start;
      prevStart = new Date();
      prevStart.setMonth(prevEnd.getMonth() - 1);
    }

    const currentMetrics = await getPeriodMetrics(businessId, start, end);
    const previousMetrics = await getPeriodMetrics(businessId, prevStart, prevEnd);

    // Cash flow: assume positive, calculate as net profit
    const cashFlow = currentMetrics.netProfit;

    const operatingCosts = currentMetrics.expenses;

    // Profit growth: compare current period to previous
    const profitGrowth = previousMetrics.netProfit > 0 ? Math.round(((currentMetrics.netProfit - previousMetrics.netProfit) / previousMetrics.netProfit) * 100 * 10) / 10 : (currentMetrics.netProfit > 0 ? 100 : 0);

    res.json({
      cashFlow,
      operatingCosts,
      profitGrowth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cash ledger: totals grouped by payment method for the current business, filtered by user role and today's transactions
exports.getCashLedger = async (req, res) => {
  try {
    console.log('getCashLedger req.user:', req.user); // Log user info for debug
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    let params = [businessId];
    let whereClause = 'WHERE t.business_id = $1 AND DATE(t.created_at) = CURRENT_DATE';
    if (role === 'cashier') {
      params.push(req.user?.userId);
      whereClause += ` AND t.cashier_user_id = $${params.length}`;
    }

    const q = `
      SELECT tp.payment_type, COALESCE(SUM(t.total_amount),0) AS total
      FROM transaction_payment tp
      JOIN transactions t ON t.transaction_id = tp.transaction_id
      ${whereClause}
      GROUP BY tp.payment_type
      ORDER BY total DESC
    `;
    const r = await pool.query(q, params);
    res.json(r.rows.map(row => ({ name: row.payment_type, balance: Number(row.total) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cash transactions list: optionally filter by payment_type and limit results, filtered by user role and today's transactions
exports.getCashTransactions = async (req, res) => {
  try {
    console.log('getCashTransactions req.user:', req.user); // Log user info for debug
    const role = (req.user?.role || '').toLowerCase();
    const businessId = role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
    if (!businessId) return res.json([]);

    const paymentType = req.query?.payment_type || null;
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit) || 50));

    let params = [businessId];
    let whereClause = 'WHERE t.business_id = $1 AND DATE(t.created_at) = CURRENT_DATE';
    if (role === 'cashier') {
      params.push(req.user?.userId);
      whereClause += ` AND t.cashier_user_id = $${params.length}`;
    }
    if (paymentType) {
      params.push(paymentType);
      whereClause += ` AND tp.payment_type = $${params.length}`;
    }

    params.push(limit);

    const q = `
      SELECT t.transaction_id, t.total_amount, tp.payment_type, tp.money_received, tp.money_change, t.created_at, t.cashier_user_id
      FROM transactions t
      JOIN transaction_payment tp ON tp.transaction_id = t.transaction_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${params.length}
    `;

    const r = await pool.query(q, params);
    res.json(r.rows.map(row => ({
      transaction_id: row.transaction_id,
      total: Number(row.total_amount),
      payment_type: row.payment_type,
      money_received: row.money_received,
      money_change: row.money_change,
      created_at: row.created_at,
      cashier_user_id: row.cashier_user_id
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
