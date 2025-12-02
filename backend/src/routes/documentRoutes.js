const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
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
      cb(null, `resubmit-${uniqueSuffix}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Public routes (for document resubmission without authentication)
router.get('/:documentId/info', documentController.getDocumentInfo);

router.post('/resubmit',
  upload.single('document'),
  documentController.resubmitDocument
);

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
