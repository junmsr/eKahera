const pool = require('./database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load config from config.env file
const configPath = path.join(__dirname, '..', '..', 'config.env');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = {};

configContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    config[key.trim()] = value.trim();
  }
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create user_type table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_type (
        user_type_id SERIAL PRIMARY KEY,
        user_type_name VARCHAR(50) UNIQUE
      );
    `);

    // Insert default user types
    await client.query(`
      INSERT INTO user_type (user_type_name) VALUES ('superadmin'), ('admin'), ('cashier'), ('customer')
      ON CONFLICT (user_type_name) DO NOTHING;
    `);

    // Create business table
    await client.query(`
      CREATE TABLE IF NOT EXISTS business (
        business_id SERIAL PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        business_address TEXT NOT NULL,
        house_number VARCHAR(50),
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'repass')),
        verification_submitted_at TIMESTAMP WITH TIME ZONE,
        verification_reviewed_at TIMESTAMP WITH TIME ZONE,
        verification_reviewed_by INTEGER,
        verification_rejection_reason TEXT,
        verification_resubmission_notes TEXT
      );
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        user_type_id INTEGER REFERENCES user_type(user_type_id),
        username VARCHAR(150) NOT NULL UNIQUE,
        contact_number VARCHAR(20),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        business_id INTEGER REFERENCES business(business_id)
      );
    `);

    // Add foreign key for business.verification_reviewed_by
    await client.query(`
      ALTER TABLE business ADD CONSTRAINT IF NOT EXISTS business_verification_reviewed_by_fkey FOREIGN KEY (verification_reviewed_by) REFERENCES users(user_id);
    `);

    // Create product_categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_category_id SERIAL PRIMARY KEY,
        product_category_name VARCHAR(100)
      );
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_category_id INTEGER REFERENCES product_categories(product_category_id),
        product_name VARCHAR(255) NOT NULL,
        cost_price NUMERIC(12,2),
        selling_price NUMERIC(12,2),
        sku VARCHAR(100) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by_user_id INTEGER REFERENCES users(user_id),
        business_id INTEGER REFERENCES business(business_id),
        description TEXT
      );
    `);

    // Create inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        inventory_id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(product_id),
        quantity_in_stock INTEGER DEFAULT 0 CHECK (quantity_in_stock >= 0),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        business_id INTEGER REFERENCES business(business_id)
      );
    `);

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        cashier_user_id INTEGER REFERENCES users(user_id),
        customer_user_id INTEGER REFERENCES users(user_id),
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        business_id INTEGER REFERENCES business(business_id)
      );
    `);

    // Create transaction_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        transaction_item_id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(transaction_id),
        product_id INTEGER REFERENCES products(product_id),
        product_quantity INTEGER,
        price_at_sale NUMERIC(12,2),
        subtotal NUMERIC(12,2) DEFAULT 0
      );
    `);

    // Create discounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS discounts (
        discount_id SERIAL PRIMARY KEY,
        discount_name VARCHAR(100),
        discount_percentage NUMERIC(5,2)
      );
    `);

    // Create transaction_payment table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_payment (
        transaction_payment_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        discount_id INTEGER REFERENCES discounts(discount_id),
        payment_type VARCHAR(50) NOT NULL,
        money_received NUMERIC(12,2),
        money_change NUMERIC(12,2),
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        transaction_id INTEGER REFERENCES transactions(transaction_id)
      );
    `);

    // Create returns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS returns (
        return_id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(transaction_id),
        date_returned DATE,
        money_returned NUMERIC(12,2)
      );
    `);

    // Create returned_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS returned_items (
        returned_items_id SERIAL PRIMARY KEY,
        return_id INTEGER REFERENCES returns(return_id),
        product_id INTEGER REFERENCES products(product_id),
        product_quantity INTEGER
      );
    `);

    // Create business_documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_documents (
        document_id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES business(business_id),
        document_type VARCHAR(50) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER CHECK (file_size <= 10485760),
        mime_type VARCHAR(100),
        verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'repass')),
        verification_notes TEXT,
        verified_by INTEGER REFERENCES users(user_id),
        verified_at TIMESTAMP WITH TIME ZONE,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create email_notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_notifications (
        notification_id SERIAL PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        business_id INTEGER REFERENCES business(business_id),
        user_id INTEGER REFERENCES users(user_id),
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'sent'
      );
    `);

    // Create logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        log_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        business_id INTEGER REFERENCES business(business_id),
        action TEXT NOT NULL,
        details JSONB,
        date_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_business_id ON logs(business_id);
    `);

    await client.query('COMMIT');

    // Create initial superadmin if environment variables are set
    await createInitialSuperAdminIfNeeded();

    // Seed sample data
    await seedSampleData();

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function createInitialSuperAdminIfNeeded() {
  // Only create if explicitly enabled in development
  if (config.CREATE_INITIAL_SUPERADMIN !== 'true') {
    return;
  }

  const email = config.SUPERADMIN_EMAIL;
  const password = config.SUPERADMIN_PASSWORD;
  const name = config.SUPERADMIN_NAME || 'System Administrator';

  if (!email || !password) {
    console.log('Skipping initial superadmin creation: Missing email or password in environment');
    return;
  }

  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await pool.query(
      'SELECT 1 FROM users WHERE role = $1 LIMIT 1',
      ['superadmin']
    );

    if (existingSuperAdmin.rowCount > 0) {
      console.log('SuperAdmin already exists, skipping creation');
      return;
    }

    // Check if email is already taken
    const existingUser = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rowCount > 0) {
      console.log('Email already exists, skipping superadmin creation');
      return;
    }

    // Hash password with high salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get superadmin user_type_id
    const superAdminTypeRes = await pool.query(
      'SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1',
      ['superadmin']
    );

    const superAdminTypeId = superAdminTypeRes.rows[0]?.user_type_id || 1;

    // Create superadmin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, user_type_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'superadmin', $4, NOW(), NOW())
       RETURNING user_id, username, email`,
      [name, email, hashedPassword, superAdminTypeId]
    );

    console.log('✅ Initial SuperAdmin created successfully:', {
      user_id: result.rows[0].user_id,
      username: result.rows[0].username,
      email: result.rows[0].email
    });

  } catch (err) {
    console.error('❌ Failed to create initial superadmin:', err.message);
  }
}

async function seedSampleData() {
  try {
    // Check if sample data already exists
    const existingBusiness = await pool.query('SELECT 1 FROM business LIMIT 1');
    if (existingBusiness.rowCount > 0) {
      console.log('Sample data already exists, skipping seeding');
      return;
    }

    console.log('Seeding sample data...');

    // Create sample business
    const businessRes = await pool.query(
      `INSERT INTO business (business_name, business_type, country, business_address, house_number, mobile, email, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING business_id`,
      ['Sample Store', 'Retail', 'Philippines', '123 Main St, Manila', '123', '+639123456789', 'sample@store.com', 'approved']
    );
    const businessId = businessRes.rows[0].business_id;

    // Create sample admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminRes = await pool.query(
      `INSERT INTO users (user_type_id, username, email, password_hash, role, business_id)
       VALUES ((SELECT user_type_id FROM user_type WHERE user_type_name = 'admin'), $1, $2, $3, $4, $5)
       RETURNING user_id`,
      ['admin', 'admin@sample.com', hashedPassword, 'admin', businessId]
    );
    const adminId = adminRes.rows[0].user_id;

    // Create sample customers
    const customerIds = [];
    for (let i = 1; i <= 5; i++) {
      const customerRes = await pool.query(
        `INSERT INTO users (user_type_id, username, email, role, business_id)
         VALUES ((SELECT user_type_id FROM user_type WHERE user_type_name = 'customer'), $1, $2, $3, $4)
         RETURNING user_id`,
        [`customer${i}`, `customer${i}@sample.com`, 'customer', businessId]
      );
      customerIds.push(customerRes.rows[0].user_id);
    }

    // Create sample product categories
    const categories = ['Electronics', 'Clothing', 'Food', 'Books'];
    const categoryIds = [];
    for (const cat of categories) {
      const catRes = await pool.query(
        'INSERT INTO product_categories (product_category_name) VALUES ($1) RETURNING product_category_id',
        [cat]
      );
      categoryIds.push(catRes.rows[0].product_category_id);
    }

    // Create sample products
    const products = [
      { name: 'Laptop', price: 50000, cost: 40000, category: 0, stock: 10 },
      { name: 'T-Shirt', price: 500, cost: 300, category: 1, stock: 50 },
      { name: 'Apple', price: 50, cost: 30, category: 2, stock: 100 },
      { name: 'Book', price: 200, cost: 150, category: 3, stock: 30 },
      { name: 'Phone', price: 20000, cost: 15000, category: 0, stock: 15 },
      { name: 'Jeans', price: 800, cost: 500, category: 1, stock: 40 },
      { name: 'Banana', price: 30, cost: 20, category: 2, stock: 80 },
      { name: 'Notebook', price: 100, cost: 70, category: 3, stock: 60 }
    ];

    const productIds = [];
    for (const prod of products) {
      const prodRes = await pool.query(
        `INSERT INTO products (product_category_id, product_name, cost_price, selling_price, sku, created_by_user_id, business_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING product_id`,
        [categoryIds[prod.category], prod.name, prod.cost, prod.price, `SKU${Date.now()}${Math.random()}`, adminId, businessId]
      );
      const productId = prodRes.rows[0].product_id;
      productIds.push(productId);

      // Add inventory
      await pool.query(
        'INSERT INTO inventory (product_id, quantity_in_stock, business_id) VALUES ($1, $2, $3)',
        [productId, prod.stock, businessId]
      );
    }

    // Create sample transactions over the last 30 days
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Random number of transactions per day (0-3)
      const numTransactions = Math.floor(Math.random() * 4);

      for (let j = 0; j < numTransactions; j++) {
        const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items

        let totalAmount = 0;
        const items = [];

        for (let k = 0; k < numItems; k++) {
          const productIndex = Math.floor(Math.random() * productIds.length);
          const productId = productIds[productIndex];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity

          // Get product price
          const priceRes = await pool.query('SELECT selling_price FROM products WHERE product_id = $1', [productId]);
          const price = priceRes.rows[0].selling_price;
          const subtotal = price * quantity;
          totalAmount += subtotal;

          items.push({ productId, quantity, price, subtotal });
        }

        // Create transaction
        const transRes = await pool.query(
          `INSERT INTO transactions (cashier_user_id, customer_user_id, total_amount, business_id, created_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING transaction_id`,
          [adminId, customerId, totalAmount, businessId, date]
        );
        const transactionId = transRes.rows[0].transaction_id;

        // Create transaction items
        for (const item of items) {
          await pool.query(
            'INSERT INTO transaction_items (transaction_id, product_id, product_quantity, price_at_sale, subtotal) VALUES ($1, $2, $3, $4, $5)',
            [transactionId, item.productId, item.quantity, item.price, item.subtotal]
          );
        }

        // Update inventory (decrease stock)
        for (const item of items) {
          await pool.query(
            'UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 WHERE product_id = $2 AND business_id = $3',
            [item.quantity, item.productId, businessId]
          );
        }
      }
    }

    console.log('✅ Sample data seeded successfully');
  } catch (err) {
    console.error('❌ Failed to seed sample data:', err.message);
  }
}

module.exports = { initializeDatabase };
