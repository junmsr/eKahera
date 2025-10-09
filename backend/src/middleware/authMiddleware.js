const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { hasRequiredDocuments } = require('../controllers/businessController');

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

exports.authenticate = (req, res, next) => {
  console.log('Authentication middleware called for:', req.method, req.path);
  const authHeader = req.headers['authorization'] || '';
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    console.log('Token verified successfully, payload:', payload);
    req.user = payload;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

exports.authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = (req.user?.role || '').toLowerCase();
    if (!allowedRoles.map(r => r.toLowerCase()).includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Middleware to require document verification for business users
exports.requireDocuments = async (req, res, next) => {
  try {
    const user = req.user;
    const role = (user?.role || '').toLowerCase();
    
    // Only apply document verification to business owners
    if (role === 'admin' || role === 'business_owner') {
      if (!user.businessId) {
        return res.status(400).json({ 
          error: 'Business ID not found for user',
          requiresDocuments: true 
        });
      }

      const documentStatus = await hasRequiredDocuments(user.businessId);
      
      if (!documentStatus.hasAllRequired) {
        return res.status(403).json({
          error: 'Document verification required to access this feature',
          requiresDocuments: true,
          documentStatus,
          message: `Please upload the following required documents: ${documentStatus.missingTypes.join(', ')}`
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Document verification middleware error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify document status',
      requiresDocuments: true 
    });
  }
};