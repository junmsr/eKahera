const express = require('express');
const router = express.Router();
const { 
  registerBusiness, 
  getBusinessProfile, 
  updateBusinessProfile,
  createCashier,
  listCashiers
} = require('../controllers/businessController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public route for business registration
router.post('/register', registerBusiness);

// Protected routes (require authentication)
router.get('/profile', authenticate, getBusinessProfile);
router.put('/profile', authenticate, updateBusinessProfile);

// Admin-only cashier management
router.post('/cashiers', authenticate, authorize(['admin','superadmin']), createCashier);
router.get('/cashiers', authenticate, authorize(['admin','superadmin']), listCashiers);

module.exports = router;
