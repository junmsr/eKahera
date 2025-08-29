const pool = require('../config/database');
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

exports.register = async (req, res) => {
  const { name, email, password, role, business_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Map requested role to user_type_id (admin/cashier/customer). Default to customer
    const desiredRole = (role || 'customer').toLowerCase();
    const roleRes = await pool.query('SELECT user_type_id, user_type_name FROM user_type WHERE lower(user_type_name) = $1', [desiredRole]);
    const userTypeId = roleRes.rowCount ? roleRes.rows[0].user_type_id : null;

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, user_type_id, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, email, role, user_type_id, business_id',
      [name, email, hashedPassword, desiredRole, userTypeId, business_id || null]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  console.log('Login attempt:', req.body); // Log incoming request data
  const { email, password } = req.body; // email field can contain either email or username
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Username and password are required' });
  }

  try {
    // Try to find user by email or username
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.role, u.contact_number,
              u.user_type_id, u.business_id, ut.user_type_name,
              b.business_name AS store_name
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       LEFT JOIN business b ON b.user_id = u.user_id
       WHERE u.email = $1 OR u.username = $1`,
      [email]
    );

    console.log('User query result:', result);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if password_hash exists and verify it
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Prefer normalized role from user_type
    const roleName = (user.user_type_name || user.role || 'customer').toLowerCase();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: roleName,
        username: user.username,
        email: user.email,
        businessId: user.business_id || null
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: roleName,
        contact_number: user.contact_number,
        businessId: user.business_id || null,
        store_name: user.store_name || null
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};
