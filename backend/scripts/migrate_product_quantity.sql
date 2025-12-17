-- Migration script to change product_quantity from INTEGER to NUMERIC(12,4)
-- This allows storing decimal quantities for weight/volume products (e.g., 0.25L, 1.5kg)
-- 
-- IMPORTANT: We must drop and recreate the GENERATED column (subtotal) because
-- PostgreSQL doesn't allow altering a column type that's used by a generated column.

BEGIN;

-- Step 1: Drop the generated column (subtotal)
ALTER TABLE transaction_items 
DROP COLUMN IF EXISTS subtotal;

-- Step 2: Alter the product_quantity column type from INTEGER to NUMERIC(12,4)
ALTER TABLE transaction_items 
ALTER COLUMN product_quantity TYPE NUMERIC(12,4) 
USING product_quantity::NUMERIC(12,4);

-- Step 3: Recreate the subtotal column as a generated column
-- The formula calculates: product_quantity * price_at_sale
ALTER TABLE transaction_items 
ADD COLUMN subtotal NUMERIC(12,2) 
GENERATED ALWAYS AS (
  (COALESCE(product_quantity, 0)::NUMERIC(12,4) * COALESCE(price_at_sale, 0)::NUMERIC(12,2))
) STORED;

COMMIT;

-- Verify the changes:
-- SELECT column_name, data_type, numeric_precision, numeric_scale, is_generated, generation_expression
-- FROM information_schema.columns
-- WHERE table_name = 'transaction_items' 
-- AND column_name IN ('product_quantity', 'subtotal');

