# Inventory Unit System - Implementation Explanation

## Overview

The inventory system now correctly handles products sold by different units (pieces, weight, volume) by storing everything in **base units** in the database and converting to **display units** for user-facing interfaces.

## How It Works

### 1. **Backend: Stock Addition (Converting Units → Base Units)**

When adding stock, the system converts user-entered units to base units before storing in the database.

#### Example: Adding 100 units of "Sugar 20g sachet"
- User enters: **100 units**
- Product type: `weight`
- Quantity per unit: `20g`
- **Calculation**: 100 units × 20g = **2000g**
- **Stored in database**: `quantity_in_stock = 2000`

#### Code Location: `backend/src/controllers/productController.js`

**In `createProduct` function (lines ~187-204):**
```javascript
// Calculate stock in base units
let stockInBaseUnits = initialQuantity;
if (product_type !== 'count' && quantity_per_unit > 0) {
  stockInBaseUnits = initialQuantity * Number(quantity_per_unit);
}
// Then store stockInBaseUnits in inventory
```

**In `addStockBySku` function (lines ~310-331):**
```javascript
// Get product type and quantity_per_unit
const prod = await client.query(`SELECT product_id, product_type, quantity_per_unit FROM products...`);

// Convert quantity to base units
let stockInBaseUnits = qty;
if (product.product_type && product.product_type !== 'count' && product.quantity_per_unit > 0) {
  stockInBaseUnits = qty * Number(product.quantity_per_unit);
}
// Then add stockInBaseUnits to inventory
```

### 2. **Backend: Stock Retrieval (Including Unit Info)**

The backend now includes product unit information so the frontend can convert back to display units.

#### Code Location: `backend/src/controllers/inventoryController.js`

**In `getStock` function (lines ~50-68):**
```javascript
// Added these fields to the SELECT query:
p.product_type,
p.quantity_per_unit,
p.base_unit,
p.display_unit
```

This allows the frontend to know:
- What type of product it is (`count`, `weight`, `volume`)
- How many base units per display unit (e.g., 20g per sachet)
- What unit to display (e.g., "20 g sachet")

### 3. **Frontend: Display Conversion (Base Units → Display Units)**

The frontend converts base units back to display units for user-friendly display.

#### Code Location: `frontend/src/components/inventory/Inventory.jsx`

**Utility Function (lines ~10-28):**
```javascript
const convertToDisplayUnits = (quantityInBaseUnits, productType, quantityPerUnit) => {
  if (!quantityInBaseUnits || quantityInBaseUnits === 0) return 0;
  
  // For count products, quantity is already in units
  if (productType === 'count' || !productType) {
    return quantityInBaseUnits;
  }
  
  // For weight/volume products, divide by quantity_per_unit
  // e.g., 2000g / 20g = 100 units
  if (quantityPerUnit && quantityPerUnit > 0) {
    return quantityInBaseUnits / quantityPerUnit;
  }
  
  return quantityInBaseUnits;
};
```

**Usage in Display (lines ~455-476):**
```javascript
// Convert quantity from base units to display units
const displayQuantity = convertToDisplayUnits(
  product.quantity,           // 2000 (base units)
  product.product_type,       // 'weight'
  product.quantity_per_unit  // 20
);
// Result: displayQuantity = 100

// Display with unit label
{displayQuantity.toFixed(displayQuantity % 1 === 0 ? 0 : 2)}
{product.display_unit ? ` ${product.display_unit}` : ' pcs'}
// Shows: "100 20 g sachet" or "100 pcs"
```

### 4. **Frontend: Low Stock Comparisons**

Low stock alerts now compare display units (what users see) instead of base units.

#### Code Location: `frontend/src/components/inventory/Inventory.jsx`

**Updated `getStockStatus` function (lines ~119-138):**
```javascript
const getStockStatus = (
  quantityInBaseUnits,
  lowStockLevel = DEFAULT_LOW_STOCK_LEVEL,
  productType = 'count',
  quantityPerUnit = 1
) => {
  // Convert to display units for comparison
  const displayQuantity = convertToDisplayUnits(
    quantityInBaseUnits, 
    productType, 
    quantityPerUnit
  );
  const threshold = Number(lowStockLevel ?? DEFAULT_LOW_STOCK_LEVEL);
  
  // Compare displayQuantity with threshold
  if (displayQuantity === 0) return { label: "Out of Stock", ... };
  if (displayQuantity < threshold) return { label: "Low Stock", ... };
  return { label: "In Stock", ... };
};
```

### 5. **Frontend: Filtering and Sorting**

All filtering and sorting operations now use display units for consistency.

#### Code Location: `frontend/src/pages/Inventory.jsx`

**Stock Filtering (lines ~411-433):**
```javascript
if (stockFilter === "low_stock") {
  filtered = filtered.filter((p) => {
    const displayQty = convertToDisplayUnits(
      p.quantity, 
      p.product_type, 
      p.quantity_per_unit
    );
    const threshold = Number(p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL);
    return displayQty > 0 && displayQty < threshold;
  });
}
```

**Sorting by Quantity (lines ~445-447):**
```javascript
else if (sortBy === "quantity") {
  // Sort by display units for consistent sorting
  aVal = convertToDisplayUnits(a.quantity, a.product_type, a.quantity_per_unit);
  bVal = convertToDisplayUnits(b.quantity, b.product_type, b.quantity_per_unit);
}
```

## Complete Flow Example

### Scenario: Adding and Selling "Sugar 20g Sachet"

1. **Product Creation:**
   - User creates product: "Sugar 20g Sachet"
   - Product type: `weight`
   - Quantity per unit: `20`
   - Base unit: `g`
   - Initial stock: `100 units`

2. **Backend Processing:**
   - Converts: 100 units × 20g = **2000g**
   - Stores in database: `quantity_in_stock = 2000`

3. **Frontend Display:**
   - Reads from database: `quantity_in_stock = 2000`
   - Converts: 2000g ÷ 20g = **100 units**
   - Displays: **"100 20 g sachet"**

4. **Selling Product:**
   - User sells: `2 units`
   - Backend deducts: 2 × 20g = **40g**
   - New inventory: 2000g - 40g = **1960g**
   - Frontend displays: 1960g ÷ 20g = **"98 20 g sachet"**

5. **Low Stock Alert:**
   - Threshold: `10 units`
   - Current stock: 1960g = 98 units
   - Comparison: 98 units ≥ 10 units → **"In Stock"** ✅

## Benefits

1. **Consistency**: All inventory stored in base units (grams, milliliters, pieces)
2. **Accuracy**: Sales calculations are precise (already implemented correctly)
3. **User-Friendly**: Frontend displays in units users understand
4. **Flexibility**: Supports partial units (e.g., 1.5kg of rice)
5. **No Database Changes**: Works with existing schema

## Files Modified

### Backend:
- `backend/src/controllers/productController.js`
  - `createProduct`: Converts initial quantity to base units
  - `addStockBySku`: Converts added quantity to base units

- `backend/src/controllers/inventoryController.js`
  - `getStock`: Includes product_type, quantity_per_unit, base_unit, display_unit

### Frontend:
- `frontend/src/pages/Inventory.jsx`
  - Added `convertToDisplayUnits` helper
  - Updated stats calculations
  - Updated filtering logic
  - Updated sorting logic
  - Updated product mapping to include unit fields

- `frontend/src/components/inventory/Inventory.jsx`
  - Added `convertToDisplayUnits` utility function
  - Updated `getStockStatus` to use display units
  - Updated all quantity displays to show converted units with labels

## Testing Recommendations

1. **Create a weight-based product:**
   - Add 100 units of a 20g product
   - Verify inventory shows "100 units" (not "2000g")

2. **Create a volume-based product:**
   - Add 50 units of a 350mL product
   - Verify inventory shows "50 units" (not "17500mL")

3. **Create a count product:**
   - Add 200 pieces
   - Verify inventory shows "200 pcs"

4. **Test low stock alerts:**
   - Set threshold to 10 units
   - Add 5 units of a weight product
   - Verify it shows "Low Stock"

5. **Test sales:**
   - Sell 2 units of a 20g product
   - Verify inventory decreases by 2 units (not 40g in display)

