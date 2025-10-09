const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public routes (for business registration)
router.post('/upload',
  documentController.uploadDocuments,
  documentController.handleDocumentUpload
);

// Upload documents via URLs (from Supabase)
router.post('/upload-urls',
  documentController.uploadDocumentsViaUrls
);

// Protected routes (require authentication)
router.get('/business/:business_id', 
  authenticate, 
  documentController.getBusinessDocuments
);

// SuperAdmin only routes
router.get('/pending', 
  authenticate, 
  authorize(['superadmin']), 
  documentController.getPendingVerifications
);

router.get('/business/:business_id/verification', 
  authenticate, 
  authorize(['superadmin']), 
  documentController.getBusinessForVerification
);

router.put('/document/:document_id/verify', 
  authenticate, 
  authorize(['superadmin']), 
  documentController.verifyDocument
);

router.put('/business/:business_id/complete', 
  authenticate, 
  authorize(['superadmin']), 
  documentController.completeBusinessVerification
);

router.get('/stats', 
  authenticate, 
  authorize(['superadmin']), 
  documentController.getVerificationStats
);

router.get('/download/:document_id', 
  authenticate, 
  authorize(['superadmin']), 
  documentController.downloadDocument
);

module.exports = router;
