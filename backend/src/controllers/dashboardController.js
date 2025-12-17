const pool = require('../config/database');

// Helper to determine business id from request (support superadmin query param)
function resolveBusinessId(req) {
  const role = (req.user?.role || '').toLowerCase();
  return role === 'superadmin' ? (req.query?.business_id ? Number(req.query.business_id) : null) : (req.user?.businessId || null);
}

exports.getOverview = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    
    if (!businessId) {
      return res.status(200).json({ message: 'no business selected', metrics: {} });
    }

    // Get date range from query params
    let { startDate, endDate } = req.query;
    
    // Parse dates if they exist, otherwise use defaults
    const now = new Date();
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month if no dates provided
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Format dates to YYYY-MM-DD for the query
    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateForQuery = formatDate(start);
    const endDateForQuery = formatDate(end);

    // Get sales data for the period
    // Use direct transaction query to avoid double-counting from sales_summary_view
    // Calculate transaction totals separately from item quantities to avoid duplication
    const salesQuery = `
      SELECT 
        COALESCE(transaction_totals.total_sales, 0) AS total_sales,
        COALESCE(transaction_totals.total_transactions, 0) AS total_transactions,
        COALESCE(item_totals.total_items_sold, 0) AS total_items_sold,
        COALESCE(transaction_totals.total_sales / NULLIF(transaction_totals.total_transactions, 0), 0) AS avg_transaction_value
       FROM (
         SELECT 
           SUM(t.total_amount) AS total_sales,
           COUNT(*) AS total_transactions
         FROM transactions t
         WHERE t.business_id = $1 
           AND t.status = 'completed'
           AND DATE(t.created_at) BETWEEN $2::date AND $3::date
       ) AS transaction_totals
       CROSS JOIN (
         SELECT 
           COALESCE(SUM(
             CASE 
               WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
                 ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000)
               ELSE
                 ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1)
             END
           ), 0) AS total_items_sold
         FROM transactions t
         JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
         JOIN products p ON ti.product_id = p.product_id
         WHERE t.business_id = $1 
           AND t.status = 'completed'
           AND DATE(t.created_at) BETWEEN $2::date AND $3::date
       ) AS item_totals`;
    
    const salesRes = await pool.query(salesQuery, [businessId, startDateForQuery, endDateForQuery]);

    // Calculate expenses (using transaction_items and products cost_price)
    // Note: product_quantity is stored in base units, cost_price is per display unit
    // For weight/volume products: convert base units to display units using quantity_per_unit
    // For volume products with base_unit "L", product_quantity is stored in mL, so convert to L first
    // Formula: cost_price * (product_quantity / quantity_per_unit) for most products
    // For volume products with base_unit "L": cost_price * (product_quantity / (quantity_per_unit * 1000))
    const expensesQuery = `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
              (ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000)) * p.cost_price
            ELSE
              (ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1)) * p.cost_price
          END
        ), 0) AS total_expenses
       FROM transactions t
       JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
       JOIN products p ON ti.product_id = p.product_id
       WHERE t.business_id = $1
         AND t.status = 'completed'
         AND DATE(t.created_at) BETWEEN $2::date AND $3::date`;
    
    const expensesRes = await pool.query(expensesQuery, [businessId, startDateForQuery, endDateForQuery]);

    const totalSales = Number(salesRes.rows[0].total_sales) || 0;
    const totalExpenses = Number(expensesRes.rows[0]?.total_expenses) || 0;
    const netProfit = totalSales - totalExpenses;
    const grossMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Top products and categories for the period
    // Convert product_quantity from base units to display units
    const topProductsQuery = `
      SELECT 
        p.product_id, 
        p.product_name, 
        SUM(
          CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000)
            ELSE
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1)
          END
        ) AS total_sold, 
        SUM(ti.subtotal) AS total_revenue
       FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.transaction_id
       JOIN products p ON ti.product_id = p.product_id
       WHERE t.business_id = $1
         AND t.status = 'completed'
         AND DATE(t.created_at) BETWEEN $2::date AND $3::date
       GROUP BY p.product_id, p.product_name
       ORDER BY total_sold DESC
       LIMIT 10`;
    
    const topProductsRes = await pool.query(topProductsQuery, [businessId, startDateForQuery, endDateForQuery]);

    const categoriesQuery = `
      SELECT 
        pc.product_category_name, 
        SUM(ti.product_quantity) AS total_items_sold, 
        SUM(ti.subtotal) AS total_revenue
       FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.transaction_id
       JOIN products p ON ti.product_id = p.product_id
       JOIN product_categories pc ON p.product_category_id = pc.product_category_id
       WHERE t.business_id = $1
         AND t.status = 'completed'
         AND DATE(t.created_at) BETWEEN $2::date AND $3::date
       GROUP BY pc.product_category_name
       ORDER BY total_revenue DESC
       LIMIT 5`;
    
    const categoriesRes = await pool.query(categoriesQuery, [businessId, startDateForQuery, endDateForQuery]);

    const response = {
      totalSales,
      totalExpenses,
      netProfit,
      grossMargin: Math.round(grossMargin * 100) / 100,
      totalTransactions: Number(salesRes.rows[0].total_transactions) || 0,
      totalItemsSold: Number(salesRes.rows[0].total_items_sold) || 0,
      averageTransactionValue: Number(salesRes.rows[0].avg_transaction_value) || 0,
      topProducts: topProductsRes.rows || [],
      topCategories: categoriesRes.rows || []
    };
    
    res.json(response);
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

// Get sales data for export (transaction items grouped by product)
exports.getSalesData = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    
    if (!businessId) {
      return res.status(200).json([]);
    }

    // Get date range from query params
    let { startDate, endDate } = req.query;
    
    // Parse dates if they exist, otherwise use defaults
    const now = new Date();
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month if no dates provided
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Format dates to YYYY-MM-DD for the query
    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateForQuery = formatDate(start);
    const endDateForQuery = formatDate(end);

    // Query to get sales data grouped by product
    // product_quantity is stored in base units, we need to convert to display units
    // For volume products with base_unit "L", product_quantity is in mL
    // We calculate proportional subtotal based on transaction total_amount to account for discounts
    const salesQuery = `
      WITH transaction_totals AS (
        SELECT 
          t.transaction_id,
          t.total_amount,
          COALESCE(SUM(ti.subtotal), 0) AS items_subtotal
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        GROUP BY t.transaction_id, t.total_amount
      )
      SELECT 
        p.product_id,
        p.product_name,
        p.display_unit,
        p.quantity_per_unit,
        p.base_unit,
        p.product_type,
        SUM(
          CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000)
            ELSE
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1)
          END
        ) AS number_of_sold_items,
        -- Calculate proportional subtotal: distribute transaction_total proportionally
        SUM(
          CASE 
            WHEN tt.items_subtotal > 0 THEN
              (ti.subtotal / tt.items_subtotal) * tt.total_amount
            ELSE
              ti.subtotal
          END
        ) AS subtotal
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.transaction_id
      JOIN products p ON ti.product_id = p.product_id
      JOIN transaction_totals tt ON tt.transaction_id = t.transaction_id
      WHERE t.business_id = $1
        AND t.status = 'completed'
        AND DATE(t.created_at) BETWEEN $2::date AND $3::date
      GROUP BY p.product_id, p.product_name, p.display_unit, p.quantity_per_unit, p.base_unit, p.product_type
      ORDER BY p.product_name`;

    const salesRes = await pool.query(salesQuery, [businessId, startDateForQuery, endDateForQuery]);

    // Format the response
    const salesData = salesRes.rows.map(row => {
      const soldItems = Number(row.number_of_sold_items) || 0;
      const subtotal = Number(row.subtotal) || 0;
      // Calculate price per unit from subtotal and quantity
      const price = soldItems > 0 ? subtotal / soldItems : 0;
      
      return {
        product_id: row.product_id,
        product_name: row.product_name,
        number_of_sold_items: soldItems,
        unit: row.display_unit || row.base_unit || 'pc',
        price: price,
        subtotal: subtotal
      };
    });

    res.json(salesData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};