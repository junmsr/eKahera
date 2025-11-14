const express = require('express');
const router = express.Router();
const {
  registerBusiness,
  registerBusinessWithDocuments,
  getBusinessProfile,
  updateBusinessProfile,
  createCashier,
  listCashiers,
  checkDocumentStatus,
  verifyBusinessAccess
} = require('../controllers/businessController');
const { authenticate, authorize, requireDocuments } = require('../middleware/authMiddleware');

// Public route for business registration
router.post('/register', registerBusiness);

// Public route for business registration with documents
router.post('/register-with-documents', ...registerBusinessWithDocuments);

// Protected routes (require authentication)
router.get('/profile', authenticate, getBusinessProfile);
router.put('/profile', authenticate, updateBusinessProfile);

// Admin-only cashier management (requires documents)
router.post('/cashiers', authenticate, requireDocuments, authorize(['admin','superadmin']), createCashier);
router.get('/cashiers', authenticate, requireDocuments, authorize(['admin','superadmin']), listCashiers);

// Document validation routes
router.get('/document-status', authenticate, checkDocumentStatus);
router.get('/verify-access', authenticate, verifyBusinessAccess);

module.exports = router;
