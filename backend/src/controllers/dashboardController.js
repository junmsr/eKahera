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

// Get comprehensive sales data for export (includes all sections for professional POS report)
exports.getSalesData = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    
    if (!businessId) {
      return res.status(200).json({
        salesByProduct: [],
        summary: {},
        paymentMethods: [],
        bestSellingProducts: [],
        salesByCategory: [],
        transactions: []
      });
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

    // 1. SALES SUMMARY: Calculate gross sales, net sales, discounts, total transactions, total items
    // Gross sales = sum of (price_at_sale * product_quantity) for all items (before discounts)
    // Net sales = sum of transaction.total_amount (after discounts)
    const summaryQuery = `
      WITH transaction_data AS (
        SELECT 
          t.transaction_id,
          t.total_amount AS net_amount,
          -- Calculate gross sales as sum of original item prices (price_at_sale * quantity)
          COALESCE(SUM(ti.price_at_sale * ti.product_quantity), 0) AS gross_subtotal
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        GROUP BY t.transaction_id, t.total_amount
      ),
      item_totals AS (
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
      )
      SELECT 
        COALESCE((SELECT SUM(gross_subtotal) FROM transaction_data), 0) AS gross_sales,
        COALESCE((SELECT SUM(net_amount) FROM transaction_data), 0) AS net_sales,
        COALESCE((SELECT SUM(gross_subtotal - net_amount) FROM transaction_data), 0) AS total_discounts,
        COALESCE((SELECT COUNT(DISTINCT transaction_id) FROM transaction_data), 0) AS total_transactions,
        COALESCE((SELECT total_items_sold FROM item_totals), 0) AS total_items_sold`;

    const summaryRes = await pool.query(summaryQuery, [businessId, startDateForQuery, endDateForQuery]);
    // Ensure we always have a summary object, even if no transactions exist
    let summary = summaryRes.rows[0];
    if (!summary || summaryRes.rows.length === 0) {
      summary = {
        gross_sales: 0,
        net_sales: 0,
        total_discounts: 0,
        total_transactions: 0,
        total_items_sold: 0
      };
    }
    const grossSales = Number(summary.gross_sales) || 0;
    const netSales = Number(summary.net_sales) || 0;
    const totalDiscounts = Number(summary.total_discounts) || 0;
    const totalTransactions = Number(summary.total_transactions) || 0;
    const totalItemsSold = Number(summary.total_items_sold) || 0;
    const avgTransactionValue = totalTransactions > 0 ? netSales / totalTransactions : 0;

    // 2. SALES BY PRODUCT: Include SKU, category, quantity, price, total
    // IMPORTANT: Discounts only apply to basic necessities
    const salesByProductQuery = `
      WITH transaction_totals AS (
        SELECT 
          t.transaction_id,
          t.total_amount,
          -- Gross subtotal (all items) - use price_at_sale * quantity for accurate gross
          COALESCE(SUM(ti.price_at_sale * ti.product_quantity), 0) AS items_subtotal,
          -- Basic necessity subtotal (only eligible items) - use price_at_sale * quantity
          COALESCE(SUM(
            CASE 
              WHEN COALESCE(pc.is_basic_necessity, false) = true THEN ti.price_at_sale * ti.product_quantity
              ELSE 0
            END
          ), 0) AS basic_necessity_subtotal
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
        LEFT JOIN products p ON ti.product_id = p.product_id
        LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        GROUP BY t.transaction_id, t.total_amount
      ),
      product_sales AS (
        SELECT 
          p.product_id,
          p.product_name,
          COALESCE(p.sku, 'N/A') AS sku,
          COALESCE(pc.product_category_name, 'Uncategorized') AS category,
          COALESCE(pc.is_basic_necessity, false) AS is_basic_necessity,
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
          ) AS quantity_sold,
          -- Apply discount ONLY to basic necessities, others get full gross subtotal
          SUM(
            CASE 
              WHEN COALESCE(pc.is_basic_necessity, false) = true AND tt.basic_necessity_subtotal > 0 THEN
                -- Basic necessity: apply proportional discount
                -- Calculate item's gross: price_at_sale * quantity
                -- Then apply discount proportionally: (item_gross / basic_necessity_gross) * (basic_necessity_gross - discount)
                ((ti.price_at_sale * ti.product_quantity) / tt.basic_necessity_subtotal) * (tt.basic_necessity_subtotal - (tt.items_subtotal - tt.total_amount))
              WHEN COALESCE(pc.is_basic_necessity, false) = true THEN
                -- Basic necessity but no basic necessity items in transaction (fallback)
                ti.price_at_sale * ti.product_quantity
              ELSE
                -- Non-basic-necessity: no discount, use full gross subtotal
                ti.price_at_sale * ti.product_quantity
            END
          ) AS total_sales,
          -- Get price_at_sale values for calculation
          SUM(ti.product_quantity) AS total_base_quantity,
          SUM(ti.price_at_sale * ti.product_quantity) AS total_price_weighted
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.transaction_id
        JOIN products p ON ti.product_id = p.product_id
        LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
        JOIN transaction_totals tt ON tt.transaction_id = t.transaction_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        GROUP BY p.product_id, p.product_name, p.sku, pc.product_category_name, pc.is_basic_necessity, p.display_unit, p.quantity_per_unit, p.base_unit, p.product_type
      )
      SELECT 
        product_id,
        product_name,
        sku,
        category,
        display_unit,
        quantity_sold,
        total_sales,
        -- Calculate average selling price per display unit from price_at_sale
        CASE 
          WHEN total_base_quantity > 0 THEN
            CASE 
              WHEN product_type = 'volume' AND base_unit = 'L' THEN
                (total_price_weighted / total_base_quantity) * (quantity_per_unit * 1000)
              WHEN product_type != 'count' AND quantity_per_unit > 0 THEN
                (total_price_weighted / total_base_quantity) * quantity_per_unit
              ELSE
                total_price_weighted / total_base_quantity
            END
          ELSE 0
        END AS selling_price
      FROM product_sales
      ORDER BY product_name`;

    const salesByProductRes = await pool.query(salesByProductQuery, [businessId, startDateForQuery, endDateForQuery]);
    const salesByProduct = salesByProductRes.rows.map(row => {
      const quantitySold = Number(row.quantity_sold) || 0;
      const totalSales = Number(row.total_sales) || 0;
      // Use the calculated selling_price from the query (based on price_at_sale, not discounted totals)
      const sellingPrice = Number(row.selling_price) || 0;
      
      return {
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku || 'N/A',
        category: row.category || 'Uncategorized',
        quantity_sold: quantitySold,
        unit: row.display_unit || 'pc',
        selling_price: sellingPrice,
        total_sales: totalSales
      };
    });

    // 3. PAYMENT METHOD BREAKDOWN
    // Use DISTINCT to ensure each transaction is counted only once per payment method
    // If a transaction has multiple payment records, use the first one
    const paymentMethodsQuery = `
      WITH transaction_payments AS (
        SELECT DISTINCT ON (t.transaction_id)
          t.transaction_id,
          t.total_amount,
          COALESCE(tp.payment_type, 'Unknown') AS payment_type
        FROM transactions t
        LEFT JOIN transaction_payment tp ON tp.transaction_id = t.transaction_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        ORDER BY t.transaction_id, tp.transaction_payment_id ASC
      )
      SELECT 
        payment_type,
        COALESCE(SUM(total_amount), 0) AS total_amount
      FROM transaction_payments
      GROUP BY payment_type
      ORDER BY total_amount DESC`;

    const paymentMethodsRes = await pool.query(paymentMethodsQuery, [businessId, startDateForQuery, endDateForQuery]);
    const paymentMethods = paymentMethodsRes.rows.map(row => ({
      payment_type: (row.payment_type || 'Unknown').toString(),
      total_amount: Number(row.total_amount) || 0
    }));

    // 4. BEST-SELLING PRODUCTS (Top 5 by quantity sold)
    const bestSellingQuery = `
      SELECT 
        p.product_id,
        p.product_name,
        COALESCE(p.sku, 'N/A') AS sku,
        SUM(
          CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000)
            ELSE
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1)
          END
        ) AS quantity_sold
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.transaction_id
      JOIN products p ON ti.product_id = p.product_id
      WHERE t.business_id = $1
        AND t.status = 'completed'
        AND DATE(t.created_at) BETWEEN $2::date AND $3::date
      GROUP BY p.product_id, p.product_name, p.sku
      ORDER BY quantity_sold DESC
      LIMIT 5`;

    const bestSellingRes = await pool.query(bestSellingQuery, [businessId, startDateForQuery, endDateForQuery]);
    const bestSellingProducts = bestSellingRes.rows.map(row => ({
      product_id: row.product_id,
      product_name: row.product_name,
      sku: row.sku || 'N/A',
      quantity_sold: Number(row.quantity_sold) || 0
    }));

    // 5. SALES BY CATEGORY
    // IMPORTANT: Discounts only apply to basic necessities
    const salesByCategoryQuery = `
      WITH transaction_totals AS (
        SELECT 
          t.transaction_id,
          t.total_amount,
          -- Gross subtotal (all items) - use price_at_sale * quantity for accurate gross
          COALESCE(SUM(ti.price_at_sale * ti.product_quantity), 0) AS items_subtotal,
          -- Basic necessity subtotal (only eligible items) - use price_at_sale * quantity
          COALESCE(SUM(
            CASE 
              WHEN COALESCE(pc.is_basic_necessity, false) = true THEN ti.price_at_sale * ti.product_quantity
              ELSE 0
            END
          ), 0) AS basic_necessity_subtotal
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
        LEFT JOIN products p ON ti.product_id = p.product_id
        LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        GROUP BY t.transaction_id, t.total_amount
      )
      SELECT 
        COALESCE(pc.product_category_name, 'Uncategorized') AS category_name,
        SUM(
          CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000)
            ELSE
              ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1)
          END
        ) AS total_items_sold,
        -- Apply discount ONLY to basic necessities, others get full gross subtotal
        SUM(
          CASE 
            WHEN COALESCE(pc.is_basic_necessity, false) = true AND tt.basic_necessity_subtotal > 0 THEN
              -- Basic necessity: apply proportional discount
              -- Calculate item's gross: price_at_sale * quantity
              -- Then apply discount proportionally: (item_gross / basic_necessity_gross) * (basic_necessity_gross - discount)
              ((ti.price_at_sale * ti.product_quantity) / tt.basic_necessity_subtotal) * (tt.basic_necessity_subtotal - (tt.items_subtotal - tt.total_amount))
            WHEN COALESCE(pc.is_basic_necessity, false) = true THEN
              -- Basic necessity but no basic necessity items in transaction (fallback)
              ti.price_at_sale * ti.product_quantity
            ELSE
              -- Non-basic-necessity: no discount, use full gross subtotal
              ti.price_at_sale * ti.product_quantity
          END
        ) AS total_sales_amount
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.transaction_id
      JOIN products p ON ti.product_id = p.product_id
      LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
      JOIN transaction_totals tt ON tt.transaction_id = t.transaction_id
      WHERE t.business_id = $1
        AND t.status = 'completed'
        AND DATE(t.created_at) BETWEEN $2::date AND $3::date
      GROUP BY pc.product_category_name
      ORDER BY total_sales_amount DESC`;

    const salesByCategoryRes = await pool.query(salesByCategoryQuery, [businessId, startDateForQuery, endDateForQuery]);
    const salesByCategory = salesByCategoryRes.rows.map(row => ({
      category_name: row.category_name || 'Uncategorized',
      total_items_sold: Number(row.total_items_sold) || 0,
      total_sales_amount: Number(row.total_sales_amount) || 0
    }));

    // 6. TRANSACTION DETAILS WITH ITEMS
    // Return one row per transaction item, with transaction details repeated
    // IMPORTANT: Discounts only apply to basic necessities
    const transactionsQuery = `
      WITH transaction_totals AS (
        SELECT 
          t.transaction_id,
          COALESCE(SUM(ti.price_at_sale * ti.product_quantity), 0) AS gross_subtotal,
          -- Calculate total for basic necessities only (eligible for discount)
          COALESCE(SUM(
            CASE 
              WHEN COALESCE(pc.is_basic_necessity, false) = true THEN ti.price_at_sale * ti.product_quantity
              ELSE 0
            END
          ), 0) AS basic_necessity_subtotal
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
        LEFT JOIN products p ON ti.product_id = p.product_id
        LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
        WHERE t.business_id = $1
          AND t.status = 'completed'
          AND DATE(t.created_at) BETWEEN $2::date AND $3::date
        GROUP BY t.transaction_id
      )
      SELECT 
        t.transaction_id,
        t.transaction_number,
        t.created_at,
        t.total_amount AS transaction_total,
        COALESCE(u.username, 'N/A') AS cashier_name,
        COALESCE(
          (SELECT tp.payment_type 
           FROM transaction_payment tp 
           WHERE tp.transaction_id = t.transaction_id 
           ORDER BY tp.transaction_payment_id ASC 
           LIMIT 1),
          'Unknown'
        ) AS payment_method,
        -- Product details
        p.product_name,
        p.display_unit,
        p.quantity_per_unit,
        p.base_unit,
        p.product_type,
        COALESCE(pc.is_basic_necessity, false) AS is_basic_necessity,
        ti.product_quantity,
        ti.price_at_sale,
        ti.subtotal AS item_subtotal,
        -- Transaction totals for discount calculation
        tt.gross_subtotal,
        (tt.gross_subtotal - t.total_amount) AS transaction_discount,
        tt.basic_necessity_subtotal,
        -- Calculate discount ONLY for basic necessities, proportionally distributed
        CASE 
          WHEN COALESCE(pc.is_basic_necessity, false) = true AND tt.basic_necessity_subtotal > 0 THEN
            (ti.subtotal / tt.basic_necessity_subtotal) * (tt.gross_subtotal - t.total_amount)
          ELSE 0
        END AS item_discount
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.transaction_id
      JOIN products p ON ti.product_id = p.product_id
      LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
      LEFT JOIN users u ON t.cashier_user_id = u.user_id
      JOIN transaction_totals tt ON tt.transaction_id = t.transaction_id
      WHERE t.business_id = $1
        AND t.status = 'completed'
        AND DATE(t.created_at) BETWEEN $2::date AND $3::date
      ORDER BY t.created_at DESC, ti.transaction_item_id ASC`;

    const transactionsRes = await pool.query(transactionsQuery, [businessId, startDateForQuery, endDateForQuery]);
    const transactions = transactionsRes.rows.map(row => {
      // Convert quantity to display units
      let quantityInDisplayUnits = Number(row.product_quantity) || 0;
      if (row.product_type && row.product_type !== 'count' && row.quantity_per_unit > 0) {
        if (row.product_type === 'volume' && row.base_unit === 'L') {
          quantityInDisplayUnits = quantityInDisplayUnits / (row.quantity_per_unit * 1000);
        } else {
          quantityInDisplayUnits = quantityInDisplayUnits / row.quantity_per_unit;
        }
      }

      // Calculate price per display unit
      // Use item_subtotal and quantity_in_display_units for accurate calculation
      // This avoids conversion issues with price_at_sale
      const itemSubtotal = Number(row.item_subtotal) || 0;
      const pricePerDisplayUnit = quantityInDisplayUnits > 0 
        ? itemSubtotal / quantityInDisplayUnits 
        : 0;

      return {
        transaction_id: row.transaction_id,
        transaction_number: row.transaction_number || `TXN-${row.transaction_id}`,
        date_time: row.created_at,
        cashier_name: row.cashier_name || 'N/A',
        payment_method: (row.payment_method || 'Unknown').toString(),
        product_name: row.product_name || 'Unknown Product',
        price: pricePerDisplayUnit,
        quantity: quantityInDisplayUnits,
        unit: row.display_unit || row.base_unit || 'pc',
        item_subtotal: Number(row.item_subtotal) || 0,
        item_discount: Number(row.item_discount) || 0,
        item_amount: Number(row.item_subtotal) - Number(row.item_discount) || 0
      };
    });

    // Return comprehensive data structure
    res.json({
      salesByProduct,
      summary: {
        net_sales: netSales,
        gross_sales: grossSales,
        total_transactions: totalTransactions,
        total_items_sold: totalItemsSold,
        total_discounts: totalDiscounts,
        average_transaction_value: avgTransactionValue
      },
      paymentMethods,
      bestSellingProducts,
      salesByCategory,
      transactions
    });
  } catch (err) {
    console.error('Error in getSalesData:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};