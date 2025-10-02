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

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_category_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        cost_price NUMERIC(12,2) NOT NULL,
        selling_price NUMERIC(12,2) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);


    await client.query('COMMIT');
    
    // Create initial superadmin if environment variables are set
    await createInitialSuperAdminIfNeeded();
    
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

module.exports = { initializeDatabase }; 