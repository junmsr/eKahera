# Inventory System Analysis - Products & Units Implementation

## Current Database Schema

### Products Table
```sql
- product_id (PK)
- product_type: 'count', 'weight', or 'volume'
- base_unit: 'pc', 'kg', 'g', 'L', 'mL'
- quantity_per_unit: NUMERIC(10,4) - e.g., 20 for 20g, 350 for 350mL
- display_unit: VARCHAR(50) - e.g., "20 g sachet" or "350 mL bottle"
```

### Inventory Table
```sql
- inventory_id (PK)
- product_id (FK)
- quantity_in_stock: INTEGER - stores stock quantity
- business_id (FK)
```

## Current Implementation Logic

### 1. Product Creation (Backend - productController.js)

**For "Per Piece" products:**
- `product_type = 'count'`
- `base_unit = 'pc'`
- `quantity_per_unit = 1`
- `display_unit = null`
- Initial stock: `quantity` added directly to `inventory.quantity_in_stock`

**For "By Weight" products:**
- `product_type = 'weight'`
- `base_unit = 'kg'` or `'g'`
- `quantity_per_unit = unitSize` (e.g., 20 for 20g)
- `display_unit = "20 g sachet"` (example)
- Initial stock: `quantity` added directly to `inventory.quantity_in_stock`

**For "By Volume" products:**
- `product_type = 'volume'`
- `base_unit = 'L'` or `'mL'`
- `quantity_per_unit = unitSize` (e.g., 350 for 350mL)
- `display_unit = "350 mL bottle"` (example)
- Initial stock: `quantity` added directly to `inventory.quantity_in_stock`

### 2. Stock Addition (Backend - productController.js & inventoryController.js)

- `addStockBySku`: Adds `quantity` directly to `inventory.quantity_in_stock`
- No conversion based on product type

### 3. Sales/Checkout (Backend - salesController.js)

**For "count" products:**
```javascript
inventoryDeduction = quantity;  // Direct deduction
```

**For "weight" or "volume" products:**
```javascript
inventoryDeduction = quantity * quantity_per_unit;
// Example: Selling 2 units of 20g product deducts 40 from inventory
```

## THE PROBLEM: Conceptual Inconsistency

### Issue #1: Mixed Units in Inventory Table

The `inventory.quantity_in_stock` field stores **different things** depending on product type:

1. **For "Per Piece" products:**
   - `quantity_in_stock = 100` means "100 pieces" ✅ (makes sense)

2. **For "By Weight" products:**
   - `quantity_in_stock = 100` means "100 grams" (NOT 100 units!)
   - If you add 100 units of 20g sachets, inventory shows 100 (should be 2000g)
   - If you sell 1 unit, it deducts 20g (correct), but the initial stock was wrong

3. **For "By Volume" products:**
   - `quantity_in_stock = 100` means "100 milliliters" (NOT 100 units!)
   - Same issue as weight products

### Issue #2: Stock Addition Logic is Inconsistent

**Current behavior:**
- When adding stock, you enter "quantity" (e.g., 100 units)
- For count products: 100 → inventory becomes 100 ✅
- For weight/volume: 100 → inventory becomes 100 ❌ (should be 100 × quantity_per_unit)

**Example:**
- Product: "Sugar 20g sachet" (quantity_per_unit = 20)
- Add 100 units
- Current: inventory = 100 (wrong! should be 2000)
- Sell 1 unit: deducts 20 from inventory
- After sale: inventory = 80 (wrong! should be 1980)

### Issue #3: Display Confusion

The frontend likely shows `quantity_in_stock` directly, which would be confusing:
- For count products: "Stock: 100" = 100 pieces ✅
- For weight products: "Stock: 100" = 100 grams (but user thinks it's 100 units) ❌

## Recommended Solution

### Option 1: Store Everything in Base Units (Recommended)

**Change inventory to always store base units:**
- Count products: Store as pieces (current behavior)
- Weight products: Store as grams/kilograms (convert on add)
- Volume products: Store as milliliters/liters (convert on add)

**Changes needed:**

1. **Stock Addition (addStockBySku & createProduct):**
   ```javascript
   let stockToAdd = quantity;
   if (product.product_type === 'weight' || product.product_type === 'volume') {
     stockToAdd = quantity * product.quantity_per_unit;
   }
   // Then add stockToAdd to inventory
   ```

2. **Stock Display (Frontend):**
   ```javascript
   // Convert back to units for display
   let displayStock = inventory.quantity_in_stock;
   if (product.product_type === 'weight' || product.product_type === 'volume') {
     displayStock = inventory.quantity_in_stock / product.quantity_per_unit;
   }
   // Display: "Stock: 100 units" or "Stock: 100 pieces"
   ```

3. **Sales Logic:**
   - Already correct! Deducts `quantity * quantity_per_unit` for weight/volume

**Pros:**
- Consistent: inventory always stores base units
- Sales logic already works correctly
- No database schema changes needed

**Cons:**
- Need to update stock addition logic
- Need to update frontend display logic

### Option 2: Store Everything as Units (Alternative)

**Change inventory to always store number of units:**
- All products: Store as units
- Sales logic needs to change for weight/volume

**Changes needed:**

1. **Sales Logic:**
   ```javascript
   // For all products, deduct quantity directly
   inventoryDeduction = quantity;
   ```

2. **Database:**
   - No changes needed

**Pros:**
- Simpler mental model: inventory = number of units
- Frontend display is straightforward

**Cons:**
- Sales logic needs significant changes
- Less precise for weight/volume (can't track partial units)

## Recommendation

**Use Option 1** because:
1. Sales logic is already implemented correctly
2. More precise for weight/volume products
3. Allows tracking of partial units (e.g., 1.5kg of rice)
4. Only requires changes to stock addition and display logic

## Files That Need Changes

### Backend:
1. `backend/src/controllers/productController.js`
   - `createProduct`: Convert quantity to base units before adding to inventory
   - `addStockBySku`: Convert quantity to base units before adding

2. `backend/src/controllers/inventoryController.js`
   - `adjustStock`: May need to handle unit conversion

### Frontend:
1. `frontend/src/pages/Inventory.jsx`
   - Convert `quantity_in_stock` to units for display
   - Show appropriate unit label (pieces/units)

2. `frontend/src/components/modals/ProductFormModal.jsx`
   - May need to update validation/display

3. Any other components that display inventory quantities

## Additional Considerations

1. **Low Stock Alerts:**
   - Currently uses `quantity_in_stock` directly
   - Need to convert to units for comparison with `low_stock_alert`

2. **Reports/Analytics:**
   - Any views that show inventory quantities need unit conversion

3. **Migration:**
   - Existing data may need conversion if changing approach
   - For Option 1: Multiply existing weight/volume inventory by `quantity_per_unit`

