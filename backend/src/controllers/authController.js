const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { logAction } = require('../utils/logger');
const { hasRequiredDocuments } = require('./businessController');
const { sendOTP } = require('./otpController');
const { sendApplicationSubmittedNotification } = require('../utils/emailService');

const config = {
  JWT_SECRET: process.env.JWT_SECRET
};

exports.register = async (req, res) => {
  const { username, first_name, last_name, email, password, role, business_id } = req.body;
  if (!username || !first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'Username, first name, last name, email and password are required' });
  }

  // Strong password validation
  if (password.length < 12) {
    return res.status(400).json({
      error: 'Password must be at least 12 characters long'
    });
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    });
  }

  try {
    // Check if email or username already exists
    const existingEmail = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existingEmail.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const existingUsername = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (existingUsername.rowCount > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    // Map requested role to user_type_id (admin/cashier/customer). Default to customer
    const desiredRole = (role || 'customer').toLowerCase();
    const roleRes = await pool.query('SELECT user_type_id, user_type_name FROM user_type WHERE lower(user_type_name) = $1', [desiredRole]);
    const userTypeId = roleRes.rowCount ? roleRes.rows[0].user_type_id : null;

    const result = await pool.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role, user_type_id, business_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING user_id, username, first_name, last_name, email, role, user_type_id, business_id`,
      [username, first_name, last_name, email, hashedPassword, desiredRole, userTypeId, business_id || null]
    );
    const newUser = result.rows[0];
    logAction({
      userId: newUser.user_id,
      businessId: newUser.business_id,
      action: `User registered: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`,
    });

    // Send OTP email
    try {
      const mockReq = { body: { email: newUser.email } };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`OTP email sent to ${newUser.email} with status ${code} and data:`, data);
          }
        })
      };
      await sendOTP(mockReq, mockRes);
    } catch (otpError) {
      console.error(`Failed to send OTP to ${newUser.email}:`, otpError);
      // We don't want to fail the registration if the OTP fails to send
    }

    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check if username or email already exists
exports.checkExistingUser = async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email && !username) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    let exists = false;
    let field = null;
    let message = '';

    // Check if email exists in users or business tables
    if (email) {
      const existingUser = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
      const existingBusiness = await pool.query('SELECT 1 FROM business WHERE lower(email) = lower($1)', [email]);
      
      if (existingUser.rowCount > 0 || existingBusiness.rowCount > 0) {
        exists = true;
        field = 'email';
        message = 'This email is already registered';
      }
    }

    // Check if username exists (only if email wasn't found)
    if (!exists && username) {
      const existingUsername = await pool.query('SELECT 1 FROM users WHERE lower(username) = lower($1)', [username]);
      
      if (existingUsername.rowCount > 0) {
        exists = true;
        field = 'username';
        message = 'This username is already taken';
      }
    }

    res.status(200).json({ 
      exists,
      field,
      message: exists ? message : 'No existing user found'
    });
  } catch (err) {
    console.error('Check existing user error:', err);
    res.status(500).json({ 
      error: 'Failed to check user availability',
      details: err.message 
    });
  }
};

// Check username availability
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if username already exists
    const existing = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    
    res.json({ 
      available: existing.rowCount === 0,
      message: existing.rowCount > 0 ? 'Username already exists' : 'Username is available'
    });
  } catch (err) {
    console.error('Check username error:', err);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
};

// Check email availability
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists in users or business tables
    const existingUser = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    const existingBusiness = await pool.query('SELECT 1 FROM business WHERE email = $1', [email]);
    
    const isAvailable = existingUser.rowCount === 0 && existingBusiness.rowCount === 0;
    
    res.json({ 
      available: isAvailable,
      message: !isAvailable ? 'Email already exists' : 'Email is available'
    });
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ error: 'Failed to check email availability' });
  }
};

exports.login = async (req, res) => {
  console.log('Login attempt:', req.body); // Log incoming request data
  const { email, password } = req.body; // email field can contain either email or username
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Username and password are required' });
  }

  try {
    // Try to find user by email, username, or business name
    // When matching by business name, prioritize admin users
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.contact_number,
              u.user_type_id,
              u.business_id AS business_id,
              ut.user_type_name,
              b.business_name AS store_name
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       LEFT JOIN business b ON b.business_id = u.business_id
       WHERE lower(u.email) = lower($1) OR lower(u.username) = lower($1) OR lower(b.business_name) = lower($1)
       ORDER BY
         CASE
           WHEN lower(u.username) = lower($1) THEN 1
           WHEN lower(u.email) = lower($1) THEN 2
           WHEN lower(b.business_name) = lower($1) AND lower(ut.user_type_name) = 'admin' THEN 3
           WHEN lower(b.business_name) = lower($1) AND lower(ut.user_type_name) = 'business_owner' THEN 4
           WHEN lower(b.business_name) = lower($1) THEN 5
           ELSE 6
         END`,
      [email]
    );

    console.log('User query result:', result);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';

    // Check business verification status if user belongs to a business
    if (user.business_id) {
      const businessResult = await pool.query(
        'SELECT verification_status FROM business WHERE business_id = $1',
        [user.business_id]
      );

      if (businessResult.rows.length > 0) {
        const businessStatus = businessResult.rows[0].verification_status;
        if (businessStatus !== 'approved') {
          return res.status(403).json({
            error: 'Your business application is still under review. Please wait for approval before logging in.'
          });
        }
      }
    }

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
    const tokenPayload = {
      userId: user.user_id,
      role: roleName,
      username: user.username,
      email: user.email,
      businessId: user.business_id ? parseInt(user.business_id, 10) : null
    };
    
    console.log('Creating JWT token with payload:', tokenPayload);
    
    const token = jwt.sign(
      tokenPayload,
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        role: roleName,
        contact_number: user.contact_number,
        businessId: user.business_id || null,
        store_name: user.store_name || null
      }
    };

    // Log login action (best effort)
    logAction({ userId: user.user_id, businessId: user.business_id || null, action: 'Login' });

    return res.json(response);

  } catch (err) {
    console.error('Login error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// Check if initial setup is needed (no superadmin exists)
exports.checkSetupStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 1 FROM users u
       JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE lower(ut.user_type_name) = 'superadmin' LIMIT 1`
    );
    
    const needsSetup = result.rowCount === 0;
    res.json({ needsSetup });
  } catch (err) {
    console.error('Setup status check error:', err);
    res.status(500).json({ error: 'Failed to check setup status' });
  }
};

// Create initial superadmin (only if no superadmin exists)
exports.createInitialSuperAdmin = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  
  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ 
      error: 'Name, email, password, and password confirmation are required' 
    });
  }
  
  // Split name into first_name and last_name (or use name as first_name if no space)
  const nameParts = name.trim().split(/\s+/);
  const first_name = nameParts[0] || name;
  const last_name = nameParts.slice(1).join(' ') || name;
  const username = name.toLowerCase().replace(/\s+/g, '') || `superadmin_${Date.now()}`;
  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  
  // Strong password validation
  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({ 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
    });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await pool.query(
      `SELECT 1 FROM users u
       JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE lower(ut.user_type_name) = 'superadmin' LIMIT 1`
    );
    
    if (existingSuperAdmin.rowCount > 0) {
      return res.status(403).json({ 
        error: 'Initial setup has already been completed. SuperAdmin already exists.' 
      });
    }
    
    // Check if email is already taken
    const existingUser = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ error: 'Email address is already registered' });
    }
    
    // Hash password with high salt rounds for superadmin
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Get superadmin user_type_id
    const superAdminTypeRes = await pool.query(
      'SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1',
      ['superadmin']
    );
    
    const superAdminTypeId = superAdminTypeRes.rows[0]?.user_type_id || 1; // Default to 1 if not found
    
    // Create superadmin user
    const result = await pool.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role, user_type_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'superadmin', $6, NOW(), NOW())
       RETURNING user_id, username, first_name, last_name, email, role, created_at`,
      [username, first_name, last_name, email, hashedPassword, superAdminTypeId]
    );
    
    const newSuperAdmin = result.rows[0];
    
    // Log the creation
    logAction({ 
      userId: newSuperAdmin.user_id, 
      businessId: null, 
      action: 'Initial SuperAdmin Created' 
    });
    
    console.log('Initial SuperAdmin created:', {
      user_id: newSuperAdmin.user_id,
      email: newSuperAdmin.email,
      username: newSuperAdmin.username,
      first_name: newSuperAdmin.first_name,
      last_name: newSuperAdmin.last_name
    });
    
    res.status(201).json({
      message: 'Initial SuperAdmin created successfully',
      user: {
        user_id: newSuperAdmin.user_id,
        username: newSuperAdmin.username,
        first_name: newSuperAdmin.first_name,
        last_name: newSuperAdmin.last_name,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
        created_at: newSuperAdmin.created_at
      }
    });
    
  } catch (err) {
    console.error('SuperAdmin creation error:', err);
    res.status(500).json({ error: 'Failed to create SuperAdmin. Please try again.' });
  }
};

// Create superadmin invitation (only existing superadmins can do this)
exports.inviteSuperAdmin = async (req, res) => {
  const { email, name } = req.body;
  
  // Validation
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  try {
    // Check if email is already registered
    const existingUser = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ error: 'Email address is already registered' });
    }
    
    // Generate a secure invitation token
    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store invitation in database (you might want to create an invitations table)
    // For now, we'll create a temporary user record with a special status
    const tempPassword = require('crypto').randomBytes(16).toString('hex');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);
    
    const superAdminTypeRes = await pool.query(
      'SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1',
      ['superadmin']
    );
    const superAdminTypeId = superAdminTypeRes.rows[0]?.user_type_id || 1;
    
    // Create pending superadmin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, user_type_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'superadmin_pending', $4, NOW(), NOW())
       RETURNING user_id, username, email`,
      [`pending_${Date.now()}`, email, hashedTempPassword, superAdminTypeId]
    );
    
    const pendingUser = result.rows[0];
    
    // Log the invitation
    logAction({ 
      userId: req.user.userId, 
      businessId: null, 
      action: `SuperAdmin invitation sent to ${email}` 
    });
    
    // In a real application, you would send an email here
    console.log('SuperAdmin invitation created:', {
      invitedBy: req.user.email,
      invitedUser: email,
      invitationToken,
      expiresAt
    });
    
    res.status(201).json({
      message: 'SuperAdmin invitation created successfully',
      invitation: {
        email: pendingUser.email,
        username: pendingUser.username,
        token: invitationToken,
        expiresAt,
        setupUrl: `${req.protocol}://${req.get('host')}/setup/invite?token=${invitationToken}`
      }
    });
    
  } catch (err) {
    console.error('SuperAdmin invitation error:', err);
    res.status(500).json({ error: 'Failed to create invitation. Please try again.' });
  }
};

// Get user profile with business information
exports.getProfile = async (req, res) => {
  try {
    console.log('Profile request received for user:', req.user);
    const userId = req.user.userId;
    console.log('Fetching profile for userId:', userId);

    // Get user information with business details
    const userResult = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.role, u.contact_number,
              u.created_at, u.updated_at, u.business_id,
              ut.user_type_name
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE u.user_id = $1`,
      [userId]
    );

    console.log('User query result:', userResult.rows);
    
    if (userResult.rowCount === 0) {
      console.log('No user found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];
    const firstName = userData.first_name || '';
    const lastName = userData.last_name || '';

    console.log('User data found:', userData);
    let businessData = null;
    let businessUsers = [];

    // If user has a business, get complete business information
    if (userData.business_id) {
      console.log('Fetching business data for business_id:', userData.business_id);
      // Get business details
      const businessResult = await pool.query(
        `SELECT business_id, business_name, business_type, country,
                business_address, house_number, mobile, email,
                created_at, updated_at
         FROM business 
         WHERE business_id = $1`,
        [userData.business_id]
      );

      console.log('Business query result:', businessResult.rows);

      if (businessResult.rowCount > 0) {
        businessData = businessResult.rows[0];
        console.log('Business data found:', businessData);

        // Get all users associated with this business
        const usersResult = await pool.query(
          `SELECT u.user_id, u.username, u.email, u.role, u.contact_number,
                  u.created_at, ut.user_type_name
           FROM users u
           LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
           WHERE u.business_id = $1
           ORDER BY u.created_at`,
          [userData.business_id]
        );

        businessUsers = usersResult.rows;
      }
    }

    const response = {
      user: {
        user_id: userData.user_id,
        username: userData.username,
        first_name: firstName,
        last_name: lastName,
        email: userData.email,
        role: userData.user_type_name || userData.role,
        contact_number: userData.contact_number,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        business_id: userData.business_id
      },
      business: businessData ? {
        business_id: businessData.business_id,
        business_name: businessData.business_name,
        business_type: businessData.business_type,
        country: businessData.country,
        business_address: businessData.business_address,
        house_number: businessData.house_number,
        mobile: businessData.mobile,
        email: businessData.email,
        created_at: businessData.created_at,
        updated_at: businessData.updated_at,
        total_users: businessUsers.length,
        users: businessUsers
      } : null
    };

    console.log('Sending profile response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile information' });
  }
};