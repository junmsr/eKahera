const pool = require('../config/database');
const { logAction } = require('../utils/logger');
const { sendVerificationStatusNotification } = require('../utils/emailService');
const bcrypt = require('bcryptjs');

const normalizeStatus = (status) => (status === 'repass' ? 'rejected' : status);

// Get all stores/businesses for SuperAdmin
exports.getAllStores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.business_id as id,
        b.business_name as name,
        b.email,
        b.business_type,
        b.country,
        b.business_address,
        b.house_number,
        b.mobile,
        b.created_at,
        b.updated_at,
        b.verification_status as status,
        COUNT(u.user_id) as user_count
      FROM business b
      LEFT JOIN users u ON u.business_id = b.business_id
      GROUP BY b.business_id, b.business_name, b.email, b.business_type,
               b.country, b.business_address, b.house_number, b.mobile,
               b.created_at, b.updated_at, b.verification_status
      ORDER BY b.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get all stores error:', err);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

// Get store details by ID
exports.getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get business details
    const businessResult = await pool.query(`
      SELECT 
        business_id as id,
        business_name as name,
        business_name as storeName,
        email,
        business_type,
        country,
        business_address as location,
        house_number,
        mobile as phone,
        created_at,
        updated_at,
        verification_status,
        EXTRACT(YEAR FROM created_at) as established
      FROM business 
      WHERE business_id = $1
    `, [id]);
    
    if (businessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const business = businessResult.rows[0];
    
    // Get business owner details
    const ownerResult = await pool.query(`
      SELECT 
        username,
        first_name,
        last_name,
        email,
        contact_number,
        created_at,
        role
      FROM users 
      WHERE business_id = $1 AND (role = 'business_owner' OR role = 'admin')
      ORDER BY created_at ASC
      LIMIT 1
    `, [id]);
    
    const owner = ownerResult.rows[0];
    
    // Get all users for this business
    const usersResult = await pool.query(`
      SELECT 
        user_id,
        username,
        email,
        role,
        contact_number,
        created_at
      FROM users 
      WHERE business_id = $1
      ORDER BY created_at ASC
    `, [id]);
    
    const fullAddress = [
      business.house_number,
      business.location,
      business.country,
    ]
      .filter(Boolean)
      .join(", ");

    // Get documents for this business
    const documentsResult = await pool.query(
      `SELECT document_id, document_type, document_name, file_path, verification_status, verification_notes, uploaded_at
       FROM business_documents
       WHERE business_id = $1
       ORDER BY uploaded_at DESC`,
      [id]
    );

    const formattedDocuments = documentsResult.rows.map((doc) => ({
      documentId: doc.document_id,
      documentType: doc.document_type,
      name: doc.document_name,
      url: doc.file_path,
      verificationStatus: normalizeStatus(doc.verification_status || 'pending'),
      verificationNotes: doc.verification_notes,
      uploadedAt: doc.uploaded_at,
    }));

    const approvedDocuments = formattedDocuments.filter(
      (doc) => doc.verificationStatus === 'approved'
    );

    // Format response similar to what frontend expects
    const storeDetails = {
      id: business.id,
      name: owner?.first_name && owner?.last_name 
        ? `${owner.first_name} ${owner.last_name}` 
        : owner?.username || business.name,
      firstName: owner?.first_name || owner?.username?.split(' ')[0] || business.name,
      lastName: owner?.last_name || owner?.username?.split(' ').slice(1).join(' ') || '',
      email: business.email,
      phone: business.phone,
      storeName: business.storeName,
      business_type: business.business_type,
      location: fullAddress,
      established: business.established?.toString(),
      verificationStatus: normalizeStatus(business.verification_status) || 'pending',
      documents: formattedDocuments,
      verifiedDocuments: approvedDocuments,
      account: {
        username: owner?.username || 'N/A',
        passwordHint: '******** (Secure)',
        lastLogin: 'N/A',
        createdAt: business.created_at,
        lastPasswordChange: 'N/A',
        loginAttemptsToday: 0,
        storeAddress: fullAddress,
        status: normalizeStatus(business.verification_status || 'pending'),
        sessionTimeout: '30 minutes'
      },
      users: usersResult.rows,
      totalUsers: usersResult.rows.length
    };
    
    res.json(storeDetails);
  } catch (err) {
    console.error('Get store by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
};

exports.approveStore = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if store exists
    const storeResult = await pool.query(
      'SELECT business_id, business_name FROM business WHERE business_id = $1',
      [id]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = storeResult.rows[0];

    // Update verification_status to 'approved' and set review columns
    await pool.query(
      `UPDATE business SET
        verification_status = $1,
        verification_reviewed_at = NOW(),
        verification_reviewed_by = $2,
        verification_rejection_reason = NULL,
        verification_resubmission_notes = NULL,
        updated_at = NOW()
      WHERE business_id = $3`,
      ['approved', req.user.userId, id]
    );

    // Fetch updated business data to send email
    const updatedBusinessResult = await pool.query(
      `SELECT business_id, business_name, email FROM business WHERE business_id = $1`,
      [id]
    );
    const updatedBusiness = updatedBusinessResult.rows[0];

    // Send approval email notification
    try {
      await sendVerificationStatusNotification(updatedBusiness, 'approved');
      console.log(`Approval email sent to ${updatedBusiness.email}`);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    // Log the approval action
    logAction({
      userId: req.user.userId,
      businessId: null,
      action: `Approved store: ${store.business_name} (ID: ${id})`
    });

    console.log(`SuperAdmin ${req.user.email} approved store ${store.business_name}`);

    res.json({
      message: 'Store approved successfully',
      store: {
        id: store.business_id,
        name: store.business_name,
        status: 'approved'
      }
    });
  } catch (err) {
    console.error('Approve store error:', err);
    res.status(500).json({ error: 'Failed to approve store' });
  }
};

// Reject a store
exports.rejectStore = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { rejection_reason } = req.body;

    console.log(`Rejecting store ${id} with reason:`, rejection_reason);

    // Check if store exists
    const storeResult = await client.query(
      'SELECT business_id, business_name, verification_status FROM business WHERE business_id = $1 FOR UPDATE',
      [id]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = storeResult.rows[0];
    console.log(`Current store status before update: ${store.verification_status}`);

    // Update verification_status to 'rejected' and set review columns
    const updateResult = await client.query(
      `UPDATE business SET
        verification_status = 'rejected',
        verification_reviewed_at = NOW(),
        verification_reviewed_by = $1,
        verification_rejection_reason = $2,
        verification_resubmission_notes = NULL,
        updated_at = NOW()
      WHERE business_id = $3
      RETURNING *`,
      [req.user.userId, rejection_reason, id]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update business status');
    }

    const updatedBusiness = updateResult.rows[0];
    console.log('Successfully updated business status to:', updatedBusiness.verification_status);

    // Verify the update
    const verifyResult = await client.query(
      'SELECT verification_status FROM business WHERE business_id = $1',
      [id]
    );
    
    console.log('Database verification - current status:', verifyResult.rows[0]?.verification_status);
    
    // Commit the transaction
    await client.query('COMMIT');

    // Send rejection email notification
    try {
      await sendVerificationStatusNotification(updatedBusiness, 'rejected', rejection_reason);
      console.log(`Rejection email sent to ${updatedBusiness.email}`);
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request if email fails
    }

    // Log the rejection action
    logAction({
      userId: req.user.userId,
      businessId: id,
      action: `Rejected store: ${store.business_name} (ID: ${id}) - Reason: ${rejection_reason}`
    });

    console.log(`SuperAdmin ${req.user.email} rejected store ${store.business_name}`);

    res.json({
      success: true,
      message: 'Store rejected successfully',
      store: {
        id: store.business_id,
        name: store.business_name,
        status: 'rejected',
        verification_status: 'rejected'
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in rejectStore:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reject store',
      details: err.message 
    });
  } finally {
    client.release();
  }
};

// Delete a store (with password verification)
exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required for deletion' });
    }

    // Verify superadmin password
    const superAdminResult = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1 AND role = $2',
      [req.user.userId, 'superadmin']
    );

    if (superAdminResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: SuperAdmin access required' });
    }

    const isPasswordValid = await bcrypt.compare(password, superAdminResult.rows[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'The password you entered is incorrect. Please try again.' });
    }

    // Check if store exists
    const storeResult = await pool.query(
      'SELECT business_id, business_name FROM business WHERE business_id = $1',
      [id]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = storeResult.rows[0];

    // Start transaction for cascading delete
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete related data in order (to handle foreign key constraints)
      // Delete logs
      await client.query('DELETE FROM logs WHERE business_id = $1', [id]);

      // Delete transactions (this will cascade to transaction_items, transaction_payment, returns, returned_items)
      await client.query('DELETE FROM transactions WHERE business_id = $1', [id]);

      // Delete inventory
      await client.query('DELETE FROM inventory WHERE business_id = $1', [id]);

      // Delete products
      await client.query('DELETE FROM products WHERE business_id = $1', [id]);

      // Delete business documents
      await client.query('DELETE FROM business_documents WHERE business_id = $1', [id]);

      // Delete email notifications
      await client.query('DELETE FROM email_notifications WHERE business_id = $1', [id]);

      // Delete users (this will cascade to related tables)
      await client.query('DELETE FROM users WHERE business_id = $1', [id]);

      // Finally delete the business
      await client.query('DELETE FROM business WHERE business_id = $1', [id]);

      await client.query('COMMIT');

      // Log the deletion action
      logAction({
        userId: req.user.userId,
        businessId: null,
        action: `Deleted store: ${store.business_name} (ID: ${id})`
      });

      console.log(`SuperAdmin ${req.user.email} deleted store ${store.business_name}`);

      res.json({
        message: 'Store deleted successfully',
        store: {
          id: store.business_id,
          name: store.business_name
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Delete store error:', err);
    res.status(500).json({ error: 'Failed to delete store' });
  }
};

// Update SuperAdmin credentials
exports.updateSuperAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!username && !email && !password) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Build update query
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (username) {
      updateFields.push(`username = $${paramIndex++}`);
      queryParams.push(username);
    }
    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      queryParams.push(email);
    }
    if (hashedPassword) {
      updateFields.push(`password_hash = $${paramIndex++}`);
      queryParams.push(hashedPassword);
    }

    queryParams.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE user_id = $${paramIndex} AND role = 'superadmin'
      RETURNING user_id, username, email, updated_at
    `;

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'SuperAdmin not found' });
    }

    const updatedSuperAdmin = result.rows[0];

    logAction({
      userId: userId,
      action: 'Updated SuperAdmin credentials'
    });

    console.log(`SuperAdmin ${req.user.email} updated their credentials`);

    res.json({
      message: 'SuperAdmin credentials updated successfully',
      user: {
        id: updatedSuperAdmin.user_id,
        username: updatedSuperAdmin.username,
        email: updatedSuperAdmin.email,
        updatedAt: updatedSuperAdmin.updated_at
      }
    });
  } catch (err) {
    console.error('Update SuperAdmin error:', err);
    res.status(500).json({ error: 'Failed to update SuperAdmin credentials' });
  }
};
