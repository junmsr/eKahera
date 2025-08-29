const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

const pool = new Pool({
  host: config.DB_HOST || 'localhost',
  port: config.DB_PORT || 5432,
  database: config.DB_NAME,
  user: config.DB_USER || 'postgres',
  password: config.DB_PASSWORD,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Admin creates a cashier user for their tenant
exports.createCashier = async (req, res) => {
  try {
    const adminUserId = req.user.userId;
    const adminTenantId = req.user.tenantId;
    if (!adminTenantId) {
      return res.status(400).json({ error: 'Admin is not associated with a tenant' });
    }

    const { username, password, contact_number, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    // Check duplicates
    const exists = await pool.query('SELECT 1 FROM users WHERE username = $1 OR email = $2', [username, email || null]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const roleRes = await pool.query('SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1', ['cashier']);
    const cashierTypeId = roleRes.rows[0]?.user_type_id || null;

    const ins = await pool.query(
      `INSERT INTO users (username, email, password_hash, contact_number, user_type_id, role, tenant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'cashier', $6, NOW(), NOW())
       RETURNING user_id, username, tenant_id`,
      [username, email || null, passwordHash, contact_number || null, cashierTypeId, adminTenantId]
    );

    res.status(201).json({
      message: 'Cashier created',
      cashier: ins.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List cashiers under current admin's tenant
exports.listCashiers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const rows = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.contact_number, u.created_at
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE u.tenant_id = $1 AND (lower(ut.user_type_name) = 'cashier' OR lower(u.role) = 'cashier')
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register business and create user account
exports.registerBusiness = async (req, res) => {
  const {
    email,
    username,
    businessName,
    businessType,
    country,
    businessAddress,
    houseNumber,
    mobile,
    password
  } = req.body;

  // Validate required fields
  if (!email || !username || !businessName || !businessType || !country || !businessAddress || !mobile || !password) {
    return res.status(400).json({ 
      error: 'All required fields must be provided' 
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user already exists (by email or username)
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get user_type_id for 'admin'
    const adminTypeRes = await client.query('SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1', ['admin']);
    const adminTypeId = adminTypeRes.rows[0]?.user_type_id || null;

    // Create user account with user_type_id
    const userResult = await client.query(`
      INSERT INTO users (username, email, password_hash, role, contact_number, user_type_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING user_id, username, email, role
    `, [username, email, passwordHash, 'business_owner', mobile, adminTypeId]);

    const userId = userResult.rows[0].user_id;

    // Create business profile
    const businessResult = await client.query(`
      INSERT INTO business (
        user_id, business_name, business_type, country, 
        business_address, house_number, mobile, email, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING business_id, business_name
    `, [userId, businessName, businessType, country, businessAddress, houseNumber, mobile, email]);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId, 
        email: email, 
        role: 'business_owner' 
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Business registration successful',
      user: {
        id: userId,
        username: username,
        email: email,
        role: 'business_owner'
      },
      business: {
        id: businessResult.rows[0].business_id,
        name: businessResult.rows[0].business_name
      },
      token: token
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Business registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register business. Please try again.' 
    });
  } finally {
    client.release();
  }
};

// Get business profile
exports.getBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        b.business_id,
        b.business_name,
        b.business_type,
        b.country,
        b.business_address,
        b.house_number,
        b.mobile,
        b.email,
        b.created_at,
        b.updated_at
      FROM business b
      WHERE b.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Business profile not found' 
      });
    }

    res.json({
      business: result.rows[0]
    });

  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get business profile' 
    });
  }
};

// Update business profile
exports.updateBusinessProfile = async (req, res) => {
  const {
    businessName,
    businessType,
    country,
    businessAddress,
    houseNumber,
    mobile
  } = req.body;

  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      UPDATE business 
      SET 
        business_name = COALESCE($1, business_name),
        business_type = COALESCE($2, business_type),
        country = COALESCE($3, country),
        business_address = COALESCE($4, business_address),
        house_number = COALESCE($5, house_number),
        mobile = COALESCE($6, mobile),
        updated_at = NOW()
      WHERE user_id = $7
      RETURNING *
    `, [businessName, businessType, country, businessAddress, houseNumber, mobile, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Business profile not found' 
      });
    }

    res.json({
      message: 'Business profile updated successfully',
      business: result.rows[0]
    });

  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update business profile' 
    });
  }
};
