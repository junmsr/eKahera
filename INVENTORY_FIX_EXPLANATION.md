# Inventory Display Issue - Explanation & Fix

## The Problem

Your product "Cheese Squeeze" shows:
- **Display**: "0.83 115 g sachet" 
- **Database**: `quantity_per_unit = 115g`, `product_type = weight`

This means:
- Inventory stored: **95.45g** (0.83 × 115)
- But if you originally added **1 unit**, it should be **115g**, not 95.45g

## Root Cause

This product was likely created **before** the unit conversion fix was implemented. The old system stored inventory as:
- **Units** (e.g., 1 unit) instead of **Base Units** (e.g., 115g)

So when you added 1 unit of 115g sachet:
- ❌ **Old system**: Stored `1` (thinking it was 1g)
- ✅ **New system**: Should store `115` (1 unit × 115g = 115g)

## The Fix

I've created a migration script that will:
1. Find all weight/volume products with inventory
2. Check if inventory appears to be stored in units (value < quantity_per_unit)
3. Convert them to base units (multiply by quantity_per_unit)

### To Run the Fix:

```bash
node backend/scripts/fixInventoryUnits.js
```

The script will:
- Show you what it's fixing
- Only fix products that appear to have incorrect values
- Skip products that are already correct
- Show a summary at the end

### Example Output:

```
Fixing: Cheese Squeeze (ID: 14)
  Current: 1 (appears to be in units)
  Corrected: 115 (in base units: 115g)
  Quantity per unit: 115g
  ✓ Fixed
```

## Manual Fix (Alternative)

If you prefer to fix manually, you can:

1. **Check current inventory value:**
   ```sql
   SELECT i.quantity_in_stock, p.quantity_per_unit, p.product_name
   FROM inventory i
   JOIN products p ON i.product_id = p.product_id
   WHERE p.product_id = 14;
   ```

2. **Fix the inventory:**
   ```sql
   -- If current stock is 1 (should be 115g for 1 unit)
   UPDATE inventory 
   SET quantity_in_stock = 115, updated_at = NOW()
   WHERE product_id = 14;
   ```

## After the Fix

After running the migration script, your product should show:
- **Display**: "1 115 g sachet" (if you had 1 unit)
- The inventory will be correctly stored as **115g** in the database

## Important Notes

1. **Backup first**: Always backup your database before running migration scripts
2. **Test on a copy**: If possible, test the script on a copy of your database first
3. **Check results**: After running, verify a few products to ensure they're correct
4. **New products**: Products created after the fix will work correctly automatically

## Verification

After fixing, you can verify by:
1. Checking the inventory display - should show whole numbers for products you added as whole units
2. Running a query to check inventory values:
   ```sql
   SELECT 
     p.product_name,
     i.quantity_in_stock as base_units,
     p.quantity_per_unit,
     ROUND(i.quantity_in_stock / p.quantity_per_unit, 2) as display_units,
     p.display_unit
   FROM products p
   JOIN inventory i ON i.product_id = p.product_id
   WHERE p.product_type IN ('weight', 'volume')
   ORDER BY p.product_name;
   ```

