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
  verifyBusinessAccess,
  getBusinessPublic,
  requestStoreDeletion,
  cancelStoreDeletion,
  getStoreDeletionStatus,
  downloadStoreDeletionExport
} = require('../controllers/businessController');
const { authenticate, authorize, requireDocuments } = require('../middleware/authMiddleware');

// Public route for business registration
router.post('/register', registerBusiness);

// Public route for business registration with documents
router.post('/register-with-documents', ...registerBusinessWithDocuments);

router.get('/public/:id', getBusinessPublic);

// Protected routes (require authentication)
router.get('/profile', authenticate, getBusinessProfile);
router.put('/profile', authenticate, updateBusinessProfile);

// Admin-only cashier management (requires documents)
router.post('/cashiers', authenticate, requireDocuments, authorize(['admin','superadmin']), createCashier);
router.get('/cashiers', authenticate, requireDocuments, authorize(['admin','superadmin']), listCashiers);

// Document validation routes
router.get('/document-status', authenticate, checkDocumentStatus);
router.get('/verify-access', authenticate, verifyBusinessAccess);

// Store deletion lifecycle (admin)
router.get('/delete-request', authenticate, authorize(['admin','superadmin','business_owner']), getStoreDeletionStatus);
router.post('/delete-request', authenticate, authorize(['admin','superadmin','business_owner']), requestStoreDeletion);
router.post('/delete-request/cancel', authenticate, authorize(['admin','superadmin','business_owner']), cancelStoreDeletion);
router.get('/delete-request/export', authenticate, authorize(['admin','superadmin','business_owner']), downloadStoreDeletionExport);

module.exports = router;
