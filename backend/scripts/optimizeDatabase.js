const { Pool } = require('pg');
require('dotenv').config({ path: '../config.env' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database optimization...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Add indexes for frequently queried columns
    console.log('Creating indexes...');
    await client.query(`
      -- Products table
      CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
      
      -- Sales table
      CREATE INDEX IF NOT EXISTS idx_sales_business_id ON sales(business_id);
      CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
      
      -- Inventory table
      CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);
      
      -- Users table
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
      
      -- Business table
      CREATE INDEX IF NOT EXISTS idx_business_owner_id ON business(owner_id);
      CREATE INDEX IF NOT EXISTS idx_business_status ON business(status);
    `);
    
    // 2. Update table statistics
    console.log('Updating table statistics...');
    await client.query('ANALYZE');
    
    // 3. Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Database optimization completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during database optimization:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the optimization
addIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to optimize database:', error);
    process.exit(1);
  });
