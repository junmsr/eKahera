const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { sendApplicationSubmittedNotification, sendNewApplicationNotification } = require('../utils/emailService');
const { logAction } = require('../utils/logger');
const supabaseStorage = require('../utils/supabaseStorage');
const BusinessDocument = require('../models/BusinessDocument');
const BusinessVerification = require('../models/BusinessVerification');
const multer = require('multer');
const axios = require('axios');
const {
  createDeletionRequest,
  cancelDeletionRequest,
  getLatestDeletionRequest,
  exportTransactions,
  DEFAULT_GRACE_DAYS
} = require('../utils/storeDeletionService');

// Use environment variables directly, no manual config.env reading
const config = process.env;

// Required document types for business verification (canonical labels)
const REQUIRED_DOCUMENT_TYPES = [
  'Business Registration Certificate',
  'Mayor\'s Permit',
];

// Acceptable matchers for each required document (handles synonyms and punctuation variants)
const REQUIRED_DOCUMENT_MATCHERS = [
  {
    label: 'Business Registration Certificate (DTI/SEC/CDA)',
    tests: [
      /business.*registration.*certificate.*\(dti\/sec\/cda\)/i,
      /business.*regis/i,
      /dti/i,
      /sec/i,
      /cda/i,
      /certificate.*incorp/i,
      /business.*doc/i
    ]
  },
  {
    label: "Mayor's Permit / Business Permit",
    tests: [
      /mayor.*permit.*business.*permit/i,
      /mayor.*permit/i,
      /business.*permit/i,
      /municipal.*licen/i,
      /permit/i
    ]
  },
  {
    label: 'BIR Certificate of Registration (Form 2303)',
    tests: [
      /bir.*certificate.*registration.*\(form\s*2303\)/i,
      /bir.*2303/i,
      /form.*2303/i,
      /bir.*cert/i,
      /tax.*cert/i,
      /registration.*cert/i,
      /bir.*doc/i
    ]
  }
];

// Check if business has uploaded all required documents
const hasRequiredDocuments = async (businessId) => {
  try {
    console.log(`Checking required documents for business ID: ${businessId}`);
    const documentsQuery = `
      SELECT DISTINCT document_type
      FROM business_documents
      WHERE business_id = $1
    `;
    const result = await pool.query(documentsQuery, [businessId]);
    const uploadedTypes = result.rows.map(row => row.document_type);
    console.log('Uploaded document types from DB:', uploadedTypes);

    // Canonicalize uploaded labels - preserve special characters for exact matching
    const canonicalize = (s) => {
      if (!s) return '';
      // First try exact match with original string
      const exactMatch = REQUIRED_DOCUMENT_MATCHERS.find(doc => 
        doc.label.toLowerCase() === s.toLowerCase()
      );
      if (exactMatch) {
        console.log(`Exact match found for '${s}'`);
        return exactMatch.label.toLowerCase();
      }
      
      // If no exact match, try pattern matching
      const result = String(s)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9\s()\/\-]+/gi, ' ') // keep spaces, parentheses, slashes, and hyphens
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim()
        .toLowerCase();
      console.log(`Canonicalized '${s}' to '${result}'`);
      return result;
    };

    const matchedByLabel = new Map();
    REQUIRED_DOCUMENT_MATCHERS.forEach(({ label }) => matchedByLabel.set(label, false));

    console.log('Checking document type matches...');
    uploadedTypes.forEach(uploadedRaw => {
      const uploadedCanon = canonicalize(uploadedRaw);
      console.log(`Matching document type: ${uploadedRaw} (canonical: ${uploadedCanon})`);
      
      REQUIRED_DOCUMENT_MATCHERS.forEach(({ label, tests }) => {
        if (matchedByLabel.get(label)) return;
        
        console.log(`  Checking against matcher: ${label}`);
        tests.forEach((re, i) => {
          const isMatch = re.test(uploadedCanon);
          console.log(`    Test ${i + 1} (${re}): ${isMatch ? 'MATCH' : 'no match'}`);
          if (isMatch) {
            console.log(`    ✓ Document type '${uploadedRaw}' matches '${label}'`);
            matchedByLabel.set(label, true);
          }
        });
      });
    });

    const hasAllRequired = Array.from(matchedByLabel.values()).every(Boolean);
    const missingTypes = REQUIRED_DOCUMENT_MATCHERS
      .filter(({ label }) => !matchedByLabel.get(label))
      .map(({ label }) => label);
      
    console.log('Matched document types:', Object.fromEntries(matchedByLabel));
    console.log('Missing document types:', missingTypes);

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

    const { username, password, contact_number, email, first_name, last_name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    // Validate first_name and last_name are provided
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ error: 'first_name is required' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ error: 'last_name is required' });
    }

    // Trim first_name and last_name
    const trimmedFirstName = first_name.trim();
    const trimmedLastName = last_name.trim();
    
    console.log('Creating cashier - received:', { 
      username, 
      first_name: req.body.first_name, 
      last_name: req.body.last_name,
      first_name_type: typeof req.body.first_name,
      last_name_type: typeof req.body.last_name
    });
    console.log('Creating cashier - processed:', { trimmedFirstName, trimmedLastName });

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
        `INSERT INTO users (username, email, password_hash, contact_number, user_type_id, role, business_id, first_name, last_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'cashier', $6, $7, $8, NOW(), NOW())
         RETURNING user_id, username, business_id, first_name, last_name`,
        [username, email || null, passwordHash, contact_number || null, cashierTypeId, adminBusinessId, trimmedFirstName, trimmedLastName]
      )
    );

    client.release();

    const newCashier = ins.rows[0];
    console.log('Created cashier result:', newCashier);
    
    logAction({
      userId: adminUserId,
      businessId: adminBusinessId,
      action: `Created cashier: ${newCashier.username}`,
    });

    res.status(201).json({
      message: 'Cashier created',
      cashier: {
        user_id: newCashier.user_id,
        username: newCashier.username,
        business_id: newCashier.business_id,
        first_name: newCashier.first_name,
        last_name: newCashier.last_name,
      },
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

// Update a cashier under current admin's business
exports.updateCashier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { username, first_name, last_name, contact_number, email } = req.body;

    // Verify the cashier belongs to the admin's business
    const cashierCheck = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND business_id = $2 AND role = $3',
      [id, businessId, 'cashier']
    );

    if (cashierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cashier not found or not authorized' });
    }

    // Validate required fields
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ error: 'first_name is required' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ error: 'last_name is required' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'username is required' });
    }

    // Check if username or email is already taken by another user
    if (username) {
      const usernameCheck = await client.query(
        'SELECT user_id FROM users WHERE username = $1 AND user_id != $2',
        [username.trim(), id]
      );
      if (usernameCheck.rowCount > 0) {
        return res.status(409).json({ error: 'Username is already in use by another account' });
      }
    }

    if (email) {
      const emailCheck = await client.query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
        [email.trim(), id]
      );
      if (emailCheck.rowCount > 0) {
        return res.status(409).json({ error: 'Email is already in use by another account' });
      }
    }

    // Begin transaction
    await client.query('BEGIN');

    // Build update query dynamically
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      queryParams.push(username.trim());
    }
    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      queryParams.push(first_name.trim());
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      queryParams.push(last_name.trim());
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      queryParams.push(email ? email.trim() : null);
    }
    if (contact_number !== undefined) {
      updateFields.push(`contact_number = $${paramIndex++}`);
      queryParams.push(contact_number ? contact_number.trim() : null);
    }

    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    queryParams.push(id);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, username, first_name, last_name, email, contact_number, updated_at
    `;

    const result = await client.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cashier not found' });
    }

    // Log the action
    await logAction({
      userId: userId,
      businessId: businessId,
      action: 'UPDATE_CASHIER',
      details: { cashierId: id },
      client
    });

    await client.query('COMMIT');
    
    const updatedCashier = result.rows[0];
    res.status(200).json({
      message: 'Cashier updated successfully',
      cashier: updatedCashier
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating cashier:', error);
    res.status(500).json({ error: 'Failed to update cashier' });
  } finally {
    client.release();
  }
};

// List cashiers under current admin's business
// Delete a cashier from the business
exports.deleteCashier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    // Verify the cashier belongs to the admin's business
    const cashierCheck = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND business_id = $2 AND role = $3',
      [id, businessId, 'cashier']
    );

    if (cashierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cashier not found or not authorized' });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Delete the cashier
    await client.query('DELETE FROM users WHERE user_id = $1', [id]);

    // Log the action
    await logAction({
      userId: userId,
      businessId: businessId,
      action: 'DELETE_CASHIER',
      details: { cashierId: id },
      client
    });

    await client.query('COMMIT');
    
    res.status(200).json({ message: 'Cashier deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting cashier:', error);
    res.status(500).json({ error: 'Failed to delete cashier' });
  } finally {
    client.release();
  }
};

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
      `SELECT u.user_id, u.username, u.email, u.contact_number, u.created_at, u.first_name, u.last_name
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

exports.registerBusiness = async (req, res) => {
  console.log('\n🚀 registerBusiness function called with request body:', JSON.stringify({
    username: req.body.username,
    email: req.body.email,
    businessName: req.body.businessName,
    businessType: req.body.businessType,
    region: req.body.region,
    province: req.body.province,
    city: req.body.city,
    barangay: req.body.barangay,
    houseNumber: req.body.houseNumber,
    mobile: req.body.mobile,
    password: req.body.password
  }, null, 2));

  const {
    email,
    username,
    businessName,
    businessType,
    region,
    regionName,
    province,
    city,
    barangay,
    provinceName,
    cityName,
    barangayName,
    houseNumber,
    mobile,
    password
  } = req.body;

  // Validate required fields
  if (!email || !username || !businessName || !businessType || !region || !province || !city || !barangay || !houseNumber || !mobile || !password) {
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
    const businessAddress = `${houseNumber}, ${barangayName}, ${cityName}, ${provinceName}`;
    const businessResult = await client.query(`
      INSERT INTO business (
        business_name, business_type, region, 
        business_address, house_number, mobile, email, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING business_id, business_name
    `, [businessName, businessType, regionName || region, businessAddress, houseNumber, mobile, email]);

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

    // Send application submitted email notification
    console.log('\n=== STARTING EMAIL NOTIFICATION PROCESS ===');
    console.log('Attempting to send application confirmation email to:', email);
    console.log('RESEND_API_KEY available:', !!process.env.RESEND_API_KEY);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    
    try {
      const businessData = {
        email: email,
        business_name: businessName,
        business_id: businessResult.rows[0].business_id,
        created_at: new Date().toISOString()
      };
      
      console.log('\n--- Business Data for Email ---');
      console.log(JSON.stringify(businessData, null, 2));
      
      // Send confirmation email to the business
      console.log('\n--- Sending Confirmation Email to Business ---');
      const result = await sendApplicationSubmittedNotification(businessData);
      console.log('Business confirmation email send result:', result);
      
      // Send notification to all super admins about new registration
      console.log('\n--- STARTING SUPERADMIN NOTIFICATION PROCESS ---');
      console.log('Fetching superadmin emails from database...');
      
      try {
        // Check if pool is connected
        console.log('Database pool connection status:', pool ? 'Connected' : 'Not connected');
        
        const superAdminResult = await pool.query(
          'SELECT user_id, email, role FROM users WHERE role = $1',
          ['superadmin']
        );
        
        console.log('\n--- SUPERADMIN QUERY RESULTS ---');
        console.log(`Found ${superAdminResult.rowCount} superadmin(s) in database`);
        console.log('Superadmin records:', JSON.stringify(superAdminResult.rows, null, 2));

        if (superAdminResult.rowCount > 0) {
          const superAdminEmails = superAdminResult.rows.map(row => row.email).filter(Boolean);
          console.log('\n--- PROCESSING SUPERADMIN EMAILS ---');
          console.log(`Found ${superAdminEmails.length} valid superadmin email(s):`, superAdminEmails);
          
          if (superAdminEmails.length > 0) {
            console.log('\n--- SENDING NOTIFICATIONS TO SUPERADMINS ---');
            console.log('Calling sendNewApplicationNotification with:', {
              businessData: { 
                email: businessData.email, 
                business_name: businessData.business_name,
                business_id: businessData.business_id
              },
              superAdminEmails: superAdminEmails
            });
            
            const notificationResult = await sendNewApplicationNotification(businessData, superAdminEmails);
            
            console.log('\n--- NOTIFICATION SEND RESULTS ---');
            console.log('sendNewApplicationNotification result:', notificationResult);
            
            if (notificationResult) {
              console.log('✅ Successfully sent notifications to all superadmins');
            } else {
              console.warn('⚠️ Failed to send notifications to some or all superadmins');
            }
          } else {
            console.warn('⚠️ No valid superadmin emails found after filtering');
          }
        } else {
          console.warn('⚠️ No superadmins found in the database with role = "superadmin"');
          console.warn('This could indicate a problem with the database or user roles');
        }
      } catch (error) {
        console.error('\n❌ ERROR IN SUPERADMIN NOTIFICATION PROCESS:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
          name: error.name,
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          position: error.position,
          internalPosition: error.internalPosition,
          internalQuery: error.internalQuery,
          where: error.where,
          schema: error.schema,
          table: error.table,
          column: error.column,
          dataType: error.dataType,
          constraint: error.constraint,
          file: error.file,
          line: error.line,
          routine: error.routine
        });
      }
    } catch (emailError) {
      console.error('Failed to send email notifications:', {
        error: emailError.message,
        stack: emailError.stack,
        email: email,
        businessName: businessName,
        businessId: businessResult.rows[0].business_id
      });
      // Don't fail the registration if email sending fails
    }

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
        region,
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
    email,
    region,
    province,
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

    // Build update query dynamically - only update business_address if it's provided
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (businessName !== undefined) {
      updateFields.push(`business_name = $${paramIndex++}`);
      queryParams.push(businessName);
    }
    if (businessType !== undefined) {
      updateFields.push(`business_type = $${paramIndex++}`);
      queryParams.push(businessType);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      queryParams.push(email);
    }
    if (region !== undefined) {
      updateFields.push(`region = $${paramIndex++}`);
      queryParams.push(region);
    }
    // Only update business_address if it's explicitly provided (when location fields change)
    if (businessAddress !== undefined) {
      updateFields.push(`business_address = $${paramIndex++}`);
      queryParams.push(businessAddress);
    }
    if (houseNumber !== undefined) {
      updateFields.push(`house_number = $${paramIndex++}`);
      queryParams.push(houseNumber);
    }
    if (mobile !== undefined) {
      updateFields.push(`mobile = $${paramIndex++}`);
      queryParams.push(mobile);
    }

    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    queryParams.push(businessId);

    const updateQuery = `
      UPDATE business
      SET ${updateFields.join(', ')}
      WHERE business_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, queryParams);

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
      region,
      regionName,
      province,
      city,
      barangay,
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
    if (!email || !username || !businessName || !businessType || !region || !province || !city || !barangay || !houseNumber || !mobile || !password) {
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
      const firstName = req.body.firstName || 'N/A';
      const lastName = req.body.lastName || req.body.fullName || 'N/A';
      
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, role, contact_number, user_type_id, first_name, last_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING user_id, username, email, role, first_name, last_name
      `, [username, email, passwordHash, 'business_owner', mobile, adminTypeId, firstName, lastName]);

      const userId = userResult.rows[0].user_id;

      // Create business profile - combine address components into business_address
      // Format: houseNumber, barangayName, cityName, provinceName
      const businessAddress = `${houseNumber}, ${barangayName}, ${cityName}, ${provinceName}`;
      const businessResult = await client.query(`
        INSERT INTO business (
          business_name, business_type, region,
          business_address, house_number, mobile, email,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING business_id, business_name
      `, [businessName, businessType, regionName || region, businessAddress, houseNumber, mobile, email]);

      const business = businessResult.rows[0];
      const businessId = business.business_id;

      // Update user with business_id
      await client.query('UPDATE users SET business_id = $1 WHERE user_id = $2', [businessId, userId]);
      
      // We'll send the registration confirmation email after the transaction is committed

      // Upload documents to Supabase and save to database
      const uploadedDocuments = [];
      console.log('Processing document uploads...');
      console.log('Files to process:', files.map(f => f.originalname));
      console.log('Document types:', parsedDocumentTypes);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const documentType = parsedDocumentTypes[i];
        console.log(`Processing document ${i+1}:`, file.originalname, 'as type:', documentType);

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
      console.log('Checking for required documents...');
      const documentStatus = await hasRequiredDocuments(businessId);
      console.log('Document status after upload:', JSON.stringify(documentStatus, null, 2));

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

      // Log document status for debugging
      console.log('Document status object:', JSON.stringify(documentStatus, null, 2));
      
      // Prepare business data for notifications
      const businessData = {
        ...businessResult.rows[0],
        email: email,
        business_name: businessName,
        business_id: businessId,
        created_at: new Date().toISOString(),
        business_address: `${houseNumber || ''}, ${barangayName || ''}, ${cityName || ''}, ${provinceName || ''}`.trim(),
        mobile: mobile,
        business_type: businessType
      };

      // Get superadmin emails for notification (but don't send yet)
      console.log('Preparing to notify superadmins after commit...');
      const superAdminResult = await client.query(
        'SELECT email FROM users WHERE role = $1',
        ['superadmin']
      );
      
      console.log('Superadmin query result:', {
        rowCount: superAdminResult.rowCount,
        rows: superAdminResult.rows
      });

      // Prepare business data for notifications
      const notificationBusinessData = {
        ...businessData,
        business_id: businessId, // Ensure we have the correct business_id
        email: email,
        business_name: businessName,
        created_at: new Date().toISOString(),
        business_address: `${houseNumber || ''}, ${barangayName || ''}, ${cityName || ''}, ${provinceName || ''}`.trim(),
        mobile: mobile,
        business_type: businessType
      };

      console.log('Business data prepared for notifications:', JSON.stringify(notificationBusinessData, null, 2));

      // Update business verification status to submitted
      await client.query(
        'UPDATE business SET verification_status = $1, verification_submitted_at = COALESCE(verification_submitted_at, NOW()), updated_at = NOW() WHERE business_id = $2',
        ['pending', businessId]
      );

      // Commit the transaction first
      await client.query('COMMIT');
      console.log('Transaction committed successfully');

      // Now that the transaction is committed, we can safely send notifications
      let notificationPromises = [];

      // 1. Send application submitted notification to the business
      notificationPromises.push((async () => {
        try {
          await sendApplicationSubmittedNotification({
            email: email,
            business_name: business.business_name,
            business_id: business.business_id,
            user_id: userId
          });
          console.log(`Registration confirmation email sent to ${email}`);
          return { success: true };
        } catch (emailError) {
          console.error(`Failed to send registration confirmation to ${email}:`, emailError);
          return { success: false, error: emailError };
        }
      })());

      // 2. Send new application notifications to superadmins
      if (superAdminResult?.rows?.length > 0) {
        const superAdminEmails = superAdminResult.rows.map(row => row.email).filter(email => email);
        if (superAdminEmails.length > 0) {
          notificationPromises.push((async () => {
            try {
              console.log('Sending new application notification to superadmins:', superAdminEmails);
              const notificationResult = await sendNewApplicationNotification(businessData, superAdminEmails);
              console.log('Superadmin notification result:', notificationResult);
              return { success: notificationResult, type: 'superadmin' };
            } catch (error) {
              console.error('Error sending superadmin notifications:', error);
              return { success: false, error, type: 'superadmin' };
            }
          })());
        }
      }

      // Wait for all notifications to complete, but don't fail the request if they fail
      await Promise.allSettled(notificationPromises);

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

// --- Store deletion lifecycle (admin-side) ---
const toDeletionDto = (request) => {
  if (!request) {
    return { status: 'none' };
  }
  return {
    status: request.status,
    requestedAt: request.requested_at,
    scheduledFor: request.scheduled_for,
    exportReadyAt: request.export_ready_at,
    exportType: request.export_type,
    exportSizeBytes: request.export_size_bytes,
    recoveredAt: request.recovered_at,
    deletedAt: request.deleted_at,
  };
};

exports.getStoreDeletionStatus = async (req, res) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Business not found for user' });
    }
    const latest = await getLatestDeletionRequest(businessId);
    res.json({
      message: latest ? 'Found deletion request' : 'No deletion request',
      graceDays: DEFAULT_GRACE_DAYS,
      deletion: toDeletionDto(latest),
    });
  } catch (err) {
    console.error('Get store deletion status error:', err);
    res.status(500).json({ error: 'Failed to load deletion status' });
  }
};

exports.requestStoreDeletion = async (req, res) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Business not found for user' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to confirm deletion' });
    }

    // Verify user's password before proceeding
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [req.user?.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'The password you entered is incorrect. Please try again.' });
    }

    const { request, alreadyExists } = await createDeletionRequest({
      businessId,
      userId: req.user?.userId,
    });

    res.json({
      message: alreadyExists
        ? 'A deletion request is already pending.'
        : `Store deletion scheduled after a ${DEFAULT_GRACE_DAYS}-day grace period.`,
      graceDays: DEFAULT_GRACE_DAYS,
      deletion: toDeletionDto(request),
    });
  } catch (err) {
    console.error('Request store deletion error:', err);
    res.status(500).json({ error: 'Failed to request store deletion' });
  }
};

exports.cancelStoreDeletion = async (req, res) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Business not found for user' });
    }

    const cancelled = await cancelDeletionRequest({
      businessId,
      userId: req.user?.userId,
    });

    if (!cancelled) {
      return res.status(404).json({ error: 'No pending deletion request to cancel' });
    }

    res.json({
      message: 'Deletion request cancelled. Your store remains active.',
      deletion: toDeletionDto(cancelled),
    });
  } catch (err) {
    console.error('Cancel store deletion error:', err);
    res.status(500).json({ error: 'Failed to cancel deletion request' });
  }
};

exports.downloadStoreDeletionExport = async (req, res) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Business not found for user' });
    }

    const latest = await getLatestDeletionRequest(businessId);
    if (!latest?.export_path) {
      return res.status(404).json({ error: 'No export available for this business' });
    }

    const filePath = path.isAbsolute(latest.export_path)
      ? latest.export_path
      : path.join(__dirname, '..', '..', latest.export_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Export file not found on server' });
    }

    const fileName = path.basename(filePath);
    const isGzip = latest.export_type === 'gzip';
    const isCsv = latest.export_type === 'csv';
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      isGzip ? 'application/gzip' : isCsv ? 'text/csv' : 'application/json'
    );

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Stream error for deletion export:', err);
      res.status(500).end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error('Download store deletion export error:', err);
    res.status(500).json({ error: 'Failed to download export' });
  }
};
module.exports.hasRequiredDocuments = hasRequiredDocuments;
