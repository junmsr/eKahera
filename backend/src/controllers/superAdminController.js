const pool = require('../config/database');
const { logAction } = require('../utils/logger');

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
        CASE 
          WHEN b.business_id IS NOT NULL THEN 'approved'
          ELSE 'pending'
        END as status,
        COUNT(u.user_id) as user_count
      FROM business b
      LEFT JOIN users u ON u.business_id = b.business_id
      GROUP BY b.business_id, b.business_name, b.email, b.business_type, 
               b.country, b.business_address, b.house_number, b.mobile, 
               b.created_at, b.updated_at
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
    
    // Format response similar to what frontend expects
    const storeDetails = {
      id: business.id,
      name: owner?.username || business.name,
      firstName: owner?.username?.split(' ')[0] || business.name,
      lastName: owner?.username?.split(' ')[1] || '',
      email: business.email,
      phone: business.phone,
      storeName: business.storeName,
      location: business.location,
      established: business.established?.toString(),
      documents: [
        { name: 'Business Registration.pdf', url: '#' },
        { name: 'Tax Certificate.pdf', url: '#' }
      ],
      verifiedDocuments: [
        { name: 'ID Verification.pdf', url: '#' },
        { name: 'Address Proof.pdf', url: '#' }
      ],
      account: {
        username: owner?.username || 'N/A',
        passwordHint: '******** (Secure)',
        lastLogin: 'N/A',
        createdAt: business.created_at,
        lastPasswordChange: 'N/A',
        loginAttemptsToday: 0,
        storeAddress: business.location,
        status: 'Active',
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

// Approve a store
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
    
    // Log the approval action
    logAction({
      userId: req.user.userId,
      businessId: null,
      action: `Approved store: ${store.business_name} (ID: ${id})`
    });
    
    // In a real implementation, you might update a status field
    // For now, we'll just log the action
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
    
    // Log the rejection action
    logAction({
      userId: req.user.userId,
      businessId: null,
      action: `Rejected store: ${store.business_name} (ID: ${id})`
    });
    
    // In a real implementation, you might update a status field or delete the store
    // For now, we'll just log the action
    console.log(`SuperAdmin ${req.user.email} rejected store ${store.business_name}`);
    
    res.json({
      message: 'Store rejected successfully',
      store: {
        id: store.business_id,
        name: store.business_name,
        status: 'rejected'
      }
    });
  } catch (err) {
    console.error('Reject store error:', err);
    res.status(500).json({ error: 'Failed to reject store' });
  }
};
