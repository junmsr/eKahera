const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      [name, email, hashedPassword, role || 'user']
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body; // "email" may actually be username in legacy schema
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Username and password are required' });
  }
  try {
    // Path 1: New schema (email + password_hash)
    try {
      const result = await pool.query(
        'SELECT user_id, name, email, password_hash, role FROM users WHERE email = $1',
        [email]
      );
      if (result.rowCount > 0) {
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign(
          { userId: user.user_id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role } });
      }
    } catch (_) {
      // Fallthrough to legacy schema
    }

    // Path 2: Legacy schema from dump (username + password plaintext)
    const legacy = await pool.query(
      'SELECT user_id, username, password, user_type_id FROM users WHERE username = $1',
      [email]
    );
    if (legacy.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const legacyUser = legacy.rows[0];
    if (password !== legacyUser.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const roleMap = { 1: 'super_admin', 2: 'admin', 3: 'cashier' };
    const role = roleMap[legacyUser.user_type_id] || 'user';
    const token = jwt.sign(
      { userId: legacyUser.user_id, role, roleId: legacyUser.user_type_id, username: legacyUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: { user_id: legacyUser.user_id, username: legacyUser.username, roleId: legacyUser.user_type_id, role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
