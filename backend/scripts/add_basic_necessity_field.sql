-- Migration script to add is_basic_necessity field to product_categories table
-- This field marks categories that are eligible for PWD/Senior Citizen discounts in the Philippines

-- Add the is_basic_necessity column to product_categories table
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS is_basic_necessity BOOLEAN DEFAULT FALSE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_basic_necessity 
ON product_categories(is_basic_necessity) 
WHERE is_basic_necessity = TRUE;

-- Update common basic necessity categories (based on Philippine law)
-- These are typical categories that qualify for PWD/Senior Citizen discounts
UPDATE product_categories 
SET is_basic_necessity = TRUE 
WHERE LOWER(product_category_name) IN (
  'fresh produce',
  'meat & poultry',
  'seafood',
  'dairy & eggs',
  'bread & bakery',
  'rice, pasta & grains',
  'condiments & spices',
  'cleaning supplies',
  'household essentials',
  'basic grocery items',
  'basic otc medicines',
  'prescription medicines',
  'first aid supplies'
);

-- Note: Store owners can manually update categories to mark them as basic necessities
-- through the admin interface if needed

