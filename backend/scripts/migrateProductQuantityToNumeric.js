/**
 * Migration script to change product_quantity from INTEGER to NUMERIC
 * This allows storing decimal quantities for weight/volume products
 */

const pool = require('../src/config/database');

async function migrateProductQuantityToNumeric() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: product_quantity INTEGER -> NUMERIC(12,4)...');
    
    await client.query('BEGIN');
    
    // Check if column is already NUMERIC
    const checkResult = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_items' 
      AND column_name = 'product_quantity'
    `);
    
    if (checkResult.rows.length > 0) {
      const currentType = checkResult.rows[0].data_type;
      if (currentType === 'numeric') {
        console.log('Column is already NUMERIC. Migration not needed.');
        await client.query('ROLLBACK');
        return;
      }
    }
    
    // Alter the column type to NUMERIC(12,4) to support decimals
    // This allows quantities like 0.25L, 1.5kg, etc.
    await client.query(`
      ALTER TABLE transaction_items 
      ALTER COLUMN product_quantity TYPE NUMERIC(12,4) 
      USING product_quantity::NUMERIC(12,4)
    `);
    
    // Update the generated column formula if it exists
    // The subtotal column is generated, so it should automatically work with NUMERIC
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
    console.log('product_quantity column is now NUMERIC(12,4)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateProductQuantityToNumeric()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = migrateProductQuantityToNumeric;

