-- Fix database views to handle weight/volume products correctly
-- This script updates views that calculate costs using product_quantity
-- Since product_quantity is now stored in base units, we need to convert to display units for cost calculations
-- For volume products with base_unit "L", product_quantity is stored in mL, so convert to L first

-- Fix sales_summary_view to convert product_quantity to display units
DROP VIEW IF EXISTS public.sales_summary_view;
CREATE VIEW public.sales_summary_view AS
 SELECT COALESCE(t.business_id, 0) AS business_id,
    date(t.created_at) AS sale_date,
    count(DISTINCT t.transaction_id) AS total_transactions,
    COALESCE(sum(t.total_amount), (0)::numeric) AS total_sales_amount,
    -- Convert product_quantity to display units for total_items_sold
    -- For volume products with base_unit "L": convert mL to L first (divide by 1000), then divide by quantity_per_unit
    -- For other products: divide by quantity_per_unit
    COALESCE(sum(
      CASE 
        WHEN p.product_type = 'volume' AND p.base_unit = 'L' AND p.quantity_per_unit > 0 THEN
          (ti.product_quantity::numeric / (p.quantity_per_unit * 1000))
        WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
          (ti.product_quantity::numeric / 1000)
        WHEN p.product_type IN ('weight', 'volume') AND p.quantity_per_unit > 0 THEN
          (ti.product_quantity::numeric / p.quantity_per_unit)
        WHEN p.product_type = 'count' OR p.product_type IS NULL THEN
          ti.product_quantity::numeric
        ELSE
          ti.product_quantity::numeric
      END
    ), (0)::numeric) AS total_items_sold,
        CASE
            WHEN (count(DISTINCT t.transaction_id) = 0) THEN (0)::numeric
            ELSE (COALESCE(sum(t.total_amount), (0)::numeric) / (count(DISTINCT t.transaction_id))::numeric)
        END AS average_transaction_value
   FROM (public.transactions t
     LEFT JOIN public.transaction_items ti ON ((t.transaction_id = ti.transaction_id)))
     LEFT JOIN public.products p ON ((ti.product_id = p.product_id))
  WHERE ((t.status)::text = 'completed'::text)
  GROUP BY t.business_id, (date(t.created_at))
  ORDER BY (date(t.created_at)) DESC;

    -- Fix profit_analysis_view
    -- The view calculates cost_price * product_quantity, but needs to account for quantity_per_unit
    -- For volume products with base_unit "L", product_quantity is stored in mL, so convert to L first
    DROP VIEW IF EXISTS public.profit_analysis_view;
    CREATE VIEW public.profit_analysis_view AS
    SELECT p.business_id,
        p.product_id,
        p.product_name,
        pc.product_category_name,
        sum(ti.product_quantity) AS total_quantity_sold,
        sum(ti.subtotal) AS total_revenue,
        -- Convert product_quantity (base units) to display units for cost calculation
        -- For volume products with base_unit "L": convert mL to L first (divide by 1000)
        sum(
        CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
            ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000))::numeric * p.cost_price)
            ELSE
            ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1))::numeric * p.cost_price)
        END
        ) AS total_cost,
        (sum(ti.subtotal) - sum(
        CASE 
            WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
            ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000))::numeric * p.cost_price)
            ELSE
            ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1))::numeric * p.cost_price)
        END
        )) AS gross_profit,
            CASE
                WHEN (sum(ti.subtotal) = (0)::numeric) THEN (0)::numeric
                ELSE ((sum(ti.subtotal) - sum(
                CASE 
                    WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
                    ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000))::numeric * p.cost_price)
                    ELSE
                    ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1))::numeric * p.cost_price)
                END
                )) / sum(ti.subtotal)) * (100)::numeric
            END AS profit_margin_percentage
    FROM (((public.products p
        JOIN public.product_categories pc ON ((p.product_category_id = pc.product_category_id)))
        JOIN public.transaction_items ti ON ((p.product_id = ti.product_id)))
        JOIN public.transactions t ON ((ti.transaction_id = t.transaction_id)))
    WHERE ((t.status)::text = 'completed'::text)
    GROUP BY p.business_id, p.product_id, p.product_name, pc.product_category_name
    ORDER BY (sum(ti.subtotal) - sum(
        CASE 
        WHEN p.product_type = 'volume' AND p.base_unit = 'L' THEN
            ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit * 1000, 0), 1000))::numeric * p.cost_price)
        ELSE
            ((ti.product_quantity / COALESCE(NULLIF(p.quantity_per_unit, 0), 1))::numeric * p.cost_price)
        END
    )) DESC;

