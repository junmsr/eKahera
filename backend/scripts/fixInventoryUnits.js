/**
 * Migration Script: Fix Inventory Units for Existing Products
 * 
 * This script fixes inventory quantities for products that were created
 * before the unit conversion system was implemented.
 * 
 * Problem: Products created before the fix stored inventory as units instead of base units.
 * Solution: Convert existing inventory to base units for weight/volume products.
 * 
 * Usage: node backend/scripts/fixInventoryUnits.js
 */

const pool = require('../src/config/database');

async function fixInventoryUnits() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting inventory unit conversion fix...\n');
    
    // Get all products with their inventory and unit information
    const productsResult = await client.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_type,
        p.quantity_per_unit,
        p.base_unit,
        i.inventory_id,
        i.quantity_in_stock,
        i.business_id
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.product_id
      WHERE p.product_type IN ('weight', 'volume')
        AND i.quantity_in_stock IS NOT NULL
        AND p.quantity_per_unit > 0
      ORDER BY p.product_id
    `);
    
    console.log(`Found ${productsResult.rows.length} weight/volume products with inventory.\n`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const product of productsResult.rows) {
      const currentStock = Number(product.quantity_in_stock);
      const quantityPerUnit = Number(product.quantity_per_unit);
      
      // Check if inventory appears to be stored in units (not base units)
      // Heuristic: If current stock is a small whole number (< 10) and less than quantity_per_unit,
      // it's likely stored in units. Also check if multiplying by quantity_per_unit gives a reasonable result.
      // Example: If quantity_per_unit is 115g and stock is 1, it should be 115g, not 1g
      const isLikelyInUnits = currentStock > 0 && 
                              currentStock < quantityPerUnit && 
                              currentStock < 10 && 
                              Number.isInteger(currentStock) &&
                              (currentStock * quantityPerUnit) > currentStock;
      
      if (isLikelyInUnits) {
        // This looks like it's stored in units, convert to base units
        const correctedStock = currentStock * quantityPerUnit;
        
        console.log(`Fixing: ${product.product_name} (ID: ${product.product_id})`);
        console.log(`  Current: ${currentStock} (appears to be in units)`);
        console.log(`  Corrected: ${correctedStock} (in base units: ${correctedStock}${product.base_unit})`);
        console.log(`  Quantity per unit: ${quantityPerUnit}${product.base_unit}`);
        console.log(`  Display will show: ${correctedStock / quantityPerUnit} units`);
        
        await client.query(
          'UPDATE inventory SET quantity_in_stock = $1, updated_at = NOW() WHERE inventory_id = $2',
          [Math.round(correctedStock), product.inventory_id]
        );
        
        fixedCount++;
        console.log(`  ✓ Fixed\n`);
      } else {
        // Inventory appears to already be in base units, skip
        const displayUnits = (currentStock / quantityPerUnit).toFixed(2);
        console.log(`Skipping: ${product.product_name} (ID: ${product.product_id})`);
        console.log(`  Current: ${currentStock}${product.base_unit} (${displayUnits} units) - appears correct\n`);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n=== Summary ===');
    console.log(`Total products checked: ${productsResult.rows.length}`);
    console.log(`Products fixed: ${fixedCount}`);
    console.log(`Products skipped (already correct): ${skippedCount}`);
    console.log('\n✓ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  fixInventoryUnits()
    .then(() => {
      console.log('\nScript completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixInventoryUnits };

