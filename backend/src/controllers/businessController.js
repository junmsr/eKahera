const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { sendApplicationSubmittedNotification } = require('../utils/emailService');

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

// Required document types for business verification (canonical labels)
const REQUIRED_DOCUMENT_TYPES = [
  'Business Registration Certificate',
  'Mayor\'s Permit',
  'BIR Certificate of Registration'
];

// Acceptable matchers for each required document (handles synonyms and punctuation variants)
const REQUIRED_DOCUMENT_MATCHERS = [
  {
    label: 'Business Registration Certificate',
    tests: [
      /business.*registration.*cert/i,
      /\b(dti|sec|cda)\b/i
    ]
  },
  {
    label: 'Mayor\'s Permit',
    tests: [
      /mayor.*permit/i,
      /business.*permit/i
    ]
  },
  {
    label: 'BIR Certificate of Registration',
    tests: [
      /bir.*certificate.*registration/i,
      /form.*2303/i
    ]
  }
];

// Check if business has uploaded all required documents
const hasRequiredDocuments = async (businessId) => {
  try {
    const documentsQuery = `
      SELECT DISTINCT document_type
      FROM business_documents
      WHERE business_id = $1
    `;
    const result = await pool.query(documentsQuery, [businessId]);
    const uploadedTypes = result.rows.map(row => row.document_type);

    // Canonicalize uploaded labels
    const canonicalize = (s) => String(s || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9]+/gi, ' ') // non-alphanum to space
      .trim();

    const matchedByLabel = new Map();
    REQUIRED_DOCUMENT_MATCHERS.forEach(({ label }) => matchedByLabel.set(label, false));

    uploadedTypes.forEach(uploadedRaw => {
      const uploadedCanon = canonicalize(uploadedRaw);
      REQUIRED_DOCUMENT_MATCHERS.forEach(({ label, tests }) => {
        if (matchedByLabel.get(label)) return;
        const isMatch = tests.some((re) => re.test(uploadedCanon));
        if (isMatch) matchedByLabel.set(label, true);
      });
    });

    const hasAllRequired = Array.from(matchedByLabel.values()).every(Boolean);
    const missingTypes = REQUIRED_DOCUMENT_MATCHERS
      .filter(({ label }) => !matchedByLabel.get(label))
      .map(({ label }) => label);

    return {
      hasAllRequired,
      uploadedCount: uploadedTypes.length,
      requiredCount: REQUIRED_DOCUMENT_TYPES.length,
      uploadedTypes,
      missingTypes
    };
  } catch (error) {
    console.error('Error checking required documents:', error);
    return {
      hasAllRequired: false,
      uploadedCount: 0,
      requiredCount: REQUIRED_DOCUMENT_TYPES.length,
      uploadedTypes: [],
      missingTypes: REQUIRED_DOCUMENT_TYPES
    };
  }
};

// Helper function to retry database operations
const retryDbOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`DB operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt === maxRetries) throw error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Admin creates a cashier user under their business
exports.createCashier = async (req, res) => {
  let client;
  try {
    const adminUserId = req.user.userId;
    // Fetch the business_id directly from the database to ensure accuracy
    const userQuery = await pool.query(
      'SELECT business_id FROM users WHERE user_id = $1',
      [adminUserId]
    );
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const adminBusinessId = userQuery.rows[0].business_id;
    if (!adminBusinessId) {
      return res.status(400).json({ error: 'Admin is not associated with a business' });
    }

    const { username, password, contact_number, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    // Get a client from the pool for transaction with timeout and retry
    client = await retryDbOperation(async () => {
      const client = await pool.connect();
      await client.query('SET statement_timeout = 20000'); // increased timeout to 20 seconds
      return client;
    });

    // Check duplicates with retry
    const exists = await retryDbOperation(async () =>
      await client.query('SELECT 1 FROM users WHERE username = $1 OR email = $2', [username, email || null])
    );
    if (exists.rowCount > 0) {
      client.release();
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get cashier type with retry
    const roleRes = await retryDbOperation(async () =>
      await client.query('SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1', ['cashier'])
    );
    const cashierTypeId = roleRes.rows[0]?.user_type_id || null;

    // Insert cashier with retry
    const ins = await retryDbOperation(async () =>
      await client.query(
        `INSERT INTO users (username, email, password_hash, contact_number, user_type_id, role, business_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'cashier', $6, NOW(), NOW())
         RETURNING user_id, username, business_id`,
        [username, email || null, passwordHash, contact_number || null, cashierTypeId, adminBusinessId]
      )
    );

    client.release();

    res.status(201).json({
      message: 'Cashier created',
      cashier: ins.rows[0]
    });
  } catch (err) {
    if (client) {
      try {
        client.release();
      } catch (releaseErr) {
        console.error('Error releasing client:', releaseErr);
      }
    }
    console.error('Create cashier error:', err);
    res.status(500).json({ error: err.message });
  }
};

// List cashiers under current admin's business
exports.listCashiers = async (req, res) => {
  try {
    // Fetch the business_id directly from the database to ensure accuracy
    const userQuery = await pool.query(
      'SELECT business_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const businessId = userQuery.rows[0].business_id;
    if (!businessId) {
      return res.status(400).json({ error: 'User is not associated with a business' });
    }

    const rows = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.contact_number, u.created_at
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE u.business_id = $1 AND (lower(ut.user_type_name) = 'cashier' OR lower(u.role) = 'cashier')
       ORDER BY u.created_at DESC`,
      [businessId]
    );

    // Check login status for each cashier (active if logged in within last 24 hours)
    const cashiersWithStatus = await Promise.all(rows.rows.map(async (cashier) => {
      const loginCheck = await pool.query(
        `SELECT 1 FROM logs
         WHERE user_id = $1 AND action = 'Login' AND date_time > NOW() - INTERVAL '24 hours'
         ORDER BY date_time DESC LIMIT 1`,
        [cashier.user_id]
      );

      return {
        ...cashier,
        status: loginCheck.rows.length > 0 ? 'ACTIVE' : 'INACTIVE'
      };
    }));

    res.json(cashiersWithStatus);
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
    province,
    city,
    barangay,
    houseNumber,
    mobile,
    password
  } = req.body;

  // Validate required fields
  if (!email || !username || !businessName || !businessType || !country || !province || !city || !barangay || !houseNumber || !mobile || !password) {
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

    // Check if business with email already exists
    const existingBiz = await client.query('SELECT business_id FROM business WHERE email = $1 LIMIT 1', [email]);
    if (existingBiz.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'A business with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get user_type_id for 'admin'
    const adminTypeRes = await client.query('SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1', ['admin']);
    const adminTypeId = adminTypeRes.rows[0]?.user_type_id || null;
    if (!adminTypeId) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Admin user type not configured' });
    }

    // Create user account with user_type_id
    const userResult = await client.query(`
      INSERT INTO users (username, email, password_hash, role, contact_number, user_type_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING user_id, username, email, role
    `, [username, email, passwordHash, 'business_owner', mobile, adminTypeId]);

    const userId = userResult.rows[0].user_id;

    // Create business profile - combine address components into business_address
    const businessAddress = `${barangay}, ${city}, ${province}`;
    const businessResult = await client.query(`
      INSERT INTO business (
        business_name, business_type, country, 
        business_address, house_number, mobile, email, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING business_id, business_name
    `, [businessName, businessType, country, businessAddress, houseNumber, mobile, email]);

    // Update user with business_id (users table has business_id column per ekahera.sql)
    await client.query('UPDATE users SET business_id = $1 WHERE user_id = $2', [businessResult.rows[0].business_id, userId]);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId, 
        email: email, 
        role: 'business_owner',
        businessId: businessResult.rows[0].business_id
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Business account created successfully. Please upload required documents to complete verification.',
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
      token: token,
      requiresDocuments: true,
      documentsUploaded: false
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Business registration error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Duplicate value violates unique constraint' });
    }
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
    // Fetch the business_id directly from the database to ensure accuracy
    const userQuery = await pool.query(
      'SELECT business_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const businessId = userQuery.rows[0].business_id;
    if (!businessId) {
      return res.status(400).json({ error: 'User is not associated with a business' });
    }

    const result = await pool.query(`
      SELECT
        business_id,
        business_name,
        business_type,
        country,
        business_address,
        house_number,
        mobile,
        email,
        created_at,
        updated_at
      FROM business
      WHERE business_id = $1
    `, [businessId]);

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
    // Fetch the business_id directly from the database to ensure accuracy
    const userQuery = await pool.query(
      'SELECT business_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const businessId = userQuery.rows[0].business_id;
    if (!businessId) {
      return res.status(400).json({ error: 'User is not associated with a business' });
    }

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
      WHERE business_id = $7
      RETURNING *
    `, [businessName, businessType, country, businessAddress, houseNumber, mobile, businessId]);

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

// Check document upload status for a business
exports.checkDocumentStatus = async (req, res) => {
  try {
    // Fetch the business_id directly from the database to ensure accuracy
    const userQuery = await pool.query(
      'SELECT business_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const businessId = userQuery.rows[0].business_id;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID not found for user' });
    }

    const documentStatus = await hasRequiredDocuments(businessId);

    res.json({
      businessId,
      documentsRequired: REQUIRED_DOCUMENT_TYPES,
      documentStatus
    });

  } catch (error) {
    console.error('Check document status error:', error);
    res.status(500).json({
      error: 'Failed to check document status'
    });
  }
};

// Verify business can access system (has required documents)
exports.verifyBusinessAccess = async (req, res) => {
  try {
    // Fetch the business_id directly from the database to ensure accuracy
    const userQuery = await pool.query(
      'SELECT business_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        canAccess: false
      });
    }

    const businessId = userQuery.rows[0].business_id;
    if (!businessId) {
      return res.status(400).json({
        error: 'Business ID not found for user',
        canAccess: false
      });
    }

    const documentStatus = await hasRequiredDocuments(businessId);

    if (!documentStatus.hasAllRequired) {
      return res.status(403).json({
        error: 'Document verification required',
        canAccess: false,
        requiresDocuments: true,
        documentStatus,
        message: `Please upload the following required documents: ${documentStatus.missingTypes.join(', ')}`
      });
    }

    // Check if business is approved
    const businessQuery = `
      SELECT verification_status
      FROM business
      WHERE business_id = $1
    `;
    const businessResult = await pool.query(businessQuery, [businessId]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Business not found',
        canAccess: false
      });
    }

    const verificationStatus = businessResult.rows[0].verification_status;

    // Check if business is approved
    if (verificationStatus !== 'approved') {
      return res.status(403).json({
        error: 'Business not approved',
        canAccess: false,
        documentsUploaded: true,
        verificationStatus,
        documentStatus,
        message: 'Your business has not been approved by the superadmin yet.'
      });
    }

    res.json({
      canAccess: true,
      documentsUploaded: true,
      verificationStatus,
      documentStatus
    });

  } catch (error) {
    console.error('Verify business access error:', error);
    res.status(500).json({
      error: 'Failed to verify business access',
      canAccess: false
    });
  }
};

// Export the hasRequiredDocuments function for use in other modules
module.exports.hasRequiredDocuments = hasRequiredDocuments;
