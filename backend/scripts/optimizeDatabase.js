const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });

// Database connection configuration
// Handle SSL certificate issues for local development
if (process.env.NODE_ENV !== 'production') {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbHost = process.env.DB_HOST || '';
  const looksLikeSupabase = dbUrl.includes('supabase') || dbHost.includes('supabase');
  if (looksLikeSupabase) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : (process.env.DATABASE_URL?.includes('supabase') || process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false)
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
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(product_category_id);
      
      -- Transactions table (heavily queried)
      CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_business_status ON transactions(business_id, status);
      CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions(updated_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_user_id);
      
      -- Transaction items (heavily queried)
      CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);
      
      -- Transaction payments (heavily queried)
      CREATE INDEX IF NOT EXISTS idx_transaction_payment_transaction_id ON transaction_payment(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_payment_type ON transaction_payment(payment_type);
      
      -- Inventory table
      CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_product_business ON inventory(product_id, business_id);
      
      -- Users table
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      
      -- Business table
      CREATE INDEX IF NOT EXISTS idx_business_verification_status ON business(verification_status);
      
      -- Business documents
      CREATE INDEX IF NOT EXISTS idx_business_documents_business_id ON business_documents(business_id);
      CREATE INDEX IF NOT EXISTS idx_business_documents_status ON business_documents(verification_status);
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
