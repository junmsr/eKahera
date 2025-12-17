-- Verification query to check if sales_summary_view is updated
-- Run this AFTER running fix_views_for_units.sql
-- If it shows the CASE statement, the view is updated correctly

SELECT pg_get_viewdef('public.sales_summary_view', true);

-- Test query to see the calculation
-- Replace the date with today's date
SELECT 
  sale_date,
  total_transactions,
  total_sales_amount,
  total_items_sold
FROM sales_summary_view
WHERE business_id = 8 
  AND sale_date = '2025-12-17'
ORDER BY sale_date DESC;

