const express = require('express');
const router = express.Router();
const { 
  getAllStores, 
  getStoreById, 
  approveStore, 
  rejectStore 
} = require('../controllers/superAdminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All SuperAdmin routes require authentication and superadmin role
router.use(authenticate);
router.use(authorize(['superadmin']));

// Store management routes
router.get('/stores', getAllStores);
router.get('/stores/:id', getStoreById);
router.post('/stores/:id/approve', approveStore);
router.post('/stores/:id/reject', rejectStore);

module.exports = router;
