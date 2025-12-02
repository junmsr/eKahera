const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { sendApplicationSubmittedNotification } = require('../utils/emailService');
const { logAction } = require('../utils/logger');
const supabaseStorage = require('../utils/supabaseStorage');
const BusinessDocument = require('../models/BusinessDocument');
const BusinessVerification = require('../models/BusinessVerification');
const multer = require('multer');
const axios = require('axios');

// Use environment variables directly, no manual config.env reading
const config = process.env;

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

    const newCashier = ins.rows[0];
    logAction({
      userId: adminUserId,
      businessId: adminBusinessId,
      action: `Created cashier: ${newCashier.username}`,
    });

    res.status(201).json({
      message: 'Cashier created',
      cashier: newCashier,
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
    regionName,
    provinceName,
    cityName,
    barangayName,
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
    const businessAddress = `${houseNumber}, ${barangayName}, ${cityName}, ${provinceName}, Philippines`;
    const businessResult = await client.query(`
      INSERT INTO business (
        business_name, business_type, country, 
        business_address, house_number, mobile, email, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING business_id, business_name
    `, [businessName, businessType, 'Philippines', businessAddress, houseNumber, mobile, email]);

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
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );


    await client.query('COMMIT');

    logAction({
      userId: userId,
      businessId: businessResult.rows[0].business_id,
      action: `Registered business: ${businessResult.rows[0].business_name}`,
    });

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

    const business = result.rows[0];

    // Decode PSGC codes in business_address if present
    if (business.business_address) {
      business.business_address = await decodePSGCAddress(business.business_address);
    }

    res.json({
      business: business
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

    const updatedBusiness = result.rows[0];
    logAction({
      userId: req.user.userId,
      businessId: businessId,
      action: `Updated business profile for: ${updatedBusiness.business_name}`,
    });

    res.json({
      message: 'Business profile updated successfully',
      business: updatedBusiness,
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Register business with documents in one transaction
exports.registerBusinessWithDocuments = [
  upload.array('documents', 10),
  async (req, res) => {
    const {
      email,
      username,
      businessName,
      businessType,
      country,
      province,
      city,
      barangay,
      regionName,
      provinceName,
      cityName,
      barangayName,
      houseNumber,
      mobile,
      password,
      document_types
    } = req.body;

    const files = req.files;

    // Validate required fields
    if (!email || !username || !businessName || !businessType || !country || !province || !city || !barangay || !houseNumber || !mobile || !password) {
      return res.status(400).json({
        error: 'All required fields must be provided'
      });
    }

    // Validate documents
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    // Parse document types if it's a string
    let parsedDocumentTypes;
    try {
      parsedDocumentTypes = typeof document_types === 'string'
        ? JSON.parse(document_types)
        : document_types;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid document types format' });
    }

    if (!parsedDocumentTypes || parsedDocumentTypes.length !== files.length) {
      return res.status(400).json({ error: 'Document types must match the number of uploaded files' });
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
      const businessAddress = `${barangayName}, ${cityName}, ${provinceName}`;
      const businessResult = await client.query(`
        INSERT INTO business (
          business_name, business_type, country,
          business_address, house_number, mobile, email,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING business_id, business_name
      `, [businessName, businessType, country, businessAddress, houseNumber, mobile, email]);

      const businessId = businessResult.rows[0].business_id;

      // Update user with business_id
      await client.query('UPDATE users SET business_id = $1 WHERE user_id = $2', [businessId, userId]);

      // Upload documents to Supabase and save to database
      const uploadedDocuments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const documentType = parsedDocumentTypes[i];

        // Read file buffer
        const fileBuffer = fs.readFileSync(file.path);

        // Upload to Supabase Storage
        const uploadResult = await supabaseStorage.uploadFile(
          fileBuffer,
          file.originalname,
          file.mimetype,
          businessId
        );

        if (!uploadResult.success) {
          console.error('Failed to upload to Supabase:', uploadResult.error);
          await client.query('ROLLBACK');
          return res.status(500).json({ error: 'Failed to upload document to storage' });
        }

        // Insert document using transaction client to maintain consistency
        const documentResult = await client.query(`
          INSERT INTO business_documents (
            business_id, document_type, document_name, file_path, file_size, mime_type, uploaded_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING document_id, business_id, document_type, document_name, file_path, file_size, mime_type, uploaded_at, updated_at
        `, [
          businessId,
          documentType,
          file.originalname,
          uploadResult.url, // Store Supabase URL
          file.size,
          file.mimetype
        ]);

        uploadedDocuments.push(documentResult.rows[0]);

        // Clean up local file
        fs.unlinkSync(file.path);
      }

      // Create business verification record
      await BusinessVerification.create(businessId);

      // Check if all required documents are uploaded
      const documentStatus = await hasRequiredDocuments(businessId);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: userId,
          email: email,
          role: 'business_owner',
          businessId: businessId
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Only send notifications and update status if all required documents are uploaded
      if (documentStatus.hasAllRequired) {
                // Get SuperAdmin emails for notification
                const superAdminResult = await client.query(
                  'SELECT email FROM users WHERE role = $1',
                  ['superadmin']
                );
        
                if (superAdminResult.rows.length > 0) {
                  const superAdminEmails = superAdminResult.rows.map(row => row.email);
                  // Send notification to super admin about new application
                  await sendNewApplicationNotification(businessResult.rows[0], superAdminEmails);
                }

        // Send application submitted confirmation to the business
        await sendApplicationSubmittedNotification(businessResult.rows[0]).catch(error => {
          console.error('Failed to send application submitted notification:', error);
        });

        // Update business verification status to submitted
        await client.query(
          'UPDATE business SET verification_status = $1, verification_submitted_at = COALESCE(verification_submitted_at, NOW()), updated_at = NOW() WHERE business_id = $2',
          ['pending', businessId]
        );
      }

      await client.query('COMMIT');

      logAction({
        userId: userId,
        businessId: businessId,
        action: `Registered business with documents: ${businessResult.rows[0].business_name}`,
      });

      res.status(201).json({
        message: documentStatus.hasAllRequired
          ? 'Business account created successfully. Your application has been submitted for verification.'
          : `Business account created successfully. Please upload the remaining required documents: ${documentStatus.missingTypes.join(', ')}`,
        user: {
          id: userId,
          username: username,
          email: email,
          role: 'business_owner'
        },
        business: {
          id: businessId,
          name: businessResult.rows[0].business_name
        },
        token: token,
        documents: uploadedDocuments,
        documentStatus: documentStatus,
        allRequiredUploaded: documentStatus.hasAllRequired
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Business registration with documents error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Duplicate value violates unique constraint' });
      }
      res.status(500).json({
        error: 'Failed to register business with documents. Please try again.'
      });
    } finally {
      client.release();
      // Clean up any remaining local files
      if (files) {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }
  }
];

// Utility function to decode PSGC codes to readable location names
const decodePSGCAddress = async (psgcString) => {
  try {
    // Check if the string contains PSGC codes (numeric strings separated by commas)
    const parts = psgcString.split(',').map(part => part.trim());
    const isPSGC = parts.every(part => /^\d+$/.test(part));

    if (!isPSGC) {
      // Return as-is if not PSGC codes
      return psgcString;
    }

    // PSGC codes are typically: barangay, city/municipality, province
    const [barangayCode, cityCode, provinceCode] = parts;

    const locationNames = [];

    // Fetch barangay name
    if (barangayCode) {
      try {
        const barangayResponse = await axios.get(`https://psgc.cloud/api/barangays/${barangayCode}`);
        if (barangayResponse.data && barangayResponse.data.name) {
          locationNames.push(barangayResponse.data.name);
        }
      } catch (error) {
        console.warn(`Failed to fetch barangay name for code ${barangayCode}:`, error.message);
      }
    }

    // Fetch city/municipality name
    if (cityCode) {
      try {
        const cityResponse = await axios.get(`https://psgc.cloud/api/cities-municipalities/${cityCode}`);
        if (cityResponse.data && cityResponse.data.name) {
          locationNames.push(cityResponse.data.name);
        }
      } catch (error) {
        console.warn(`Failed to fetch city name for code ${cityCode}:`, error.message);
      }
    }

    // Fetch province name
    if (provinceCode) {
      try {
        const provinceResponse = await axios.get(`https://psgc.cloud/api/provinces/${provinceCode}`);
        if (provinceResponse.data && provinceResponse.data.name) {
          locationNames.push(provinceResponse.data.name);
        }
      } catch (error) {
        console.warn(`Failed to fetch province name for code ${provinceCode}:`, error.message);
      }
    }

    // Return decoded address or original if decoding failed
    if (locationNames.length > 0) {
      return `${locationNames.join(', ')}, Philippines`;
    } else {
      return psgcString; // Fallback to original if all API calls failed
    }

  } catch (error) {
    console.error('Error decoding PSGC address:', error);
    return psgcString; // Return original string on error
  }
};

// Export the hasRequiredDocuments function for use in other modules
exports.getBusinessPublic = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    const result = await pool.query(
      "SELECT business_name FROM business WHERE business_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get public business info error:", error);
    res.status(500).json({ error: "Failed to get business information" });
  }
};
module.exports.hasRequiredDocuments = hasRequiredDocuments;
