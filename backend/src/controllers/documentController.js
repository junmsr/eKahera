const BusinessDocument = require('../models/BusinessDocument');
const BusinessVerification = require('../models/BusinessVerification');
const { sendNewApplicationNotification, sendVerificationStatusNotification, sendApplicationSubmittedNotification } = require('../utils/emailService');
const { hasRequiredDocuments } = require('./businessController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const supabaseStorage = require('../utils/supabaseStorage');

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
    cb(null, `${req.body.business_id || 'unknown'}-${uniqueSuffix}${ext}`);
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

// Upload business documents
exports.uploadDocuments = upload.array('documents', 10);

exports.handleDocumentUpload = async (req, res) => {
  try {
    const { business_id, document_types } = req.body;
    const files = req.files;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

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

    // Verify business exists
    const businessResult = await pool.query('SELECT * FROM business WHERE business_id = $1', [business_id]);
    if (businessResult.rowCount === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessResult.rows[0];
    const uploadedDocuments = [];

    // Upload each document to Supabase Storage and save to database
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = parsedDocumentTypes[i];

      // Read file buffer
      const fileBuffer = fs.readFileSync(file.path);

      // Upload to Supabase Storage
      const uploadResult = await supabaseStorage.uploadFile(
        fileBuffer,
        file.originalname,
        file.mimetype,
        business_id
      );

      if (!uploadResult.success) {
        console.error('Failed to upload to Supabase:', uploadResult.error);
        return res.status(500).json({ error: 'Failed to upload document to storage' });
      }

      const documentData = {
        business_id: business_id,
        document_type: documentType,
        document_name: file.originalname,
        file_path: uploadResult.url, // Store Supabase URL
        file_size: file.size,
        mime_type: file.mimetype
      };

      const savedDocument = await BusinessDocument.create(documentData);
      uploadedDocuments.push(savedDocument);

      // Clean up local file
      fs.unlinkSync(file.path);
    }

    // Create or update business verification record
    await BusinessVerification.create(business_id);

    // Check if all required documents are now uploaded
    const documentStatus = await hasRequiredDocuments(business_id);

    // Only send notifications and update status if all required documents are uploaded
    if (documentStatus.hasAllRequired) {
      // Get SuperAdmin email for notification
      const superAdminResult = await pool.query(
        'SELECT email FROM users WHERE role = $1 LIMIT 1',
        ['superadmin']
      );

      if (superAdminResult.rowCount > 0) {
        const superAdminEmail = superAdminResult.rows[0].email;
        // Send notification to super admin about new application
        await sendNewApplicationNotification(businessData, superAdminEmail);
      }

      // Send application submitted confirmation to the business
      await sendApplicationSubmittedNotification(businessData).catch(error => {
        console.error('Failed to send application submitted notification:', error);
      });

      // Update business verification status to submitted
      await pool.query(
        'UPDATE business SET verification_status = $1, verification_submitted_at = COALESCE(verification_submitted_at, NOW()), updated_at = NOW() WHERE business_id = $2',
        ['pending', business_id]
      );
    }

    res.status(201).json({
      message: documentStatus.hasAllRequired
        ? 'All required documents uploaded successfully. Your application has been submitted for verification.'
        : `Documents uploaded successfully. Please upload the remaining required documents: ${documentStatus.missingTypes.join(', ')}`,
      documents: uploadedDocuments,
      business_id: business_id,
      documentStatus: documentStatus,
      allRequiredUploaded: documentStatus.hasAllRequired
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// Get documents for a business
exports.getBusinessDocuments = async (req, res) => {
  try {
    const { business_id } = req.params;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const documents = await BusinessDocument.findByBusinessId(business_id);
    const verification = await BusinessVerification.findByBusinessId(business_id);

    res.json({
      documents,
      verification: verification || { verification_status: 'not_submitted' }
    });

  } catch (error) {
    console.error('Get business documents error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
};

// Get all pending verifications (SuperAdmin only)
exports.getPendingVerifications = async (req, res) => {
  try {
    // Ensure businesses with documents are set to pending status
    await BusinessVerification.updatePendingStatusForBusinessesWithDocuments();

    const verifications = await BusinessVerification.getAllBusinessesForVerification();
    res.json(verifications);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve pending verifications' });
  }
};

// Get business details with documents for verification (SuperAdmin only)
exports.getBusinessForVerification = async (req, res) => {
  try {
    const { business_id } = req.params;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const businessData = await BusinessVerification.getBusinessWithDocuments(business_id);

    if (!businessData) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(businessData);

  } catch (error) {
    console.error('Get business for verification error:', error);
    res.status(500).json({ error: 'Failed to retrieve business data' });
  }
};

// Verify individual document (SuperAdmin only)
exports.verifyDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { status, notes } = req.body;
    const verifiedBy = req.user.userId;

    if (!document_id) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    if (!status || !['approved', 'rejected', 'repass'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (approved, rejected, repass)' });
    }

    const updatedDocument = await BusinessDocument.updateVerificationStatus(
      document_id, status, notes, verifiedBy
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      message: 'Document verification updated successfully',
      document: updatedDocument
    });

  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
};

// Complete business verification (SuperAdmin only)
exports.completeBusinessVerification = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { status, rejection_reason, resubmission_notes } = req.body;
    const reviewedBy = req.user.userId;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    if (!status || !['approved', 'rejected', 'repass'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (approved, rejected, repass)' });
    }

    // Update business verification status
    const updatedVerification = await BusinessVerification.updateStatus(
      business_id, status, reviewedBy, rejection_reason, resubmission_notes
    );

    if (!updatedVerification) {
      return res.status(404).json({ error: 'Business verification not found' });
    }

    // Get business data for email notification
    const businessResult = await pool.query('SELECT * FROM business WHERE business_id = $1', [business_id]);
    if (businessResult.rowCount > 0) {
      const businessData = businessResult.rows[0];
      await sendVerificationStatusNotification(businessData, status, rejection_reason, resubmission_notes);
    }

    res.json({
      message: 'Business verification completed successfully',
      verification: updatedVerification
    });

  } catch (error) {
    console.error('Complete business verification error:', error);
    res.status(500).json({ error: 'Failed to complete business verification' });
  }
};

// Get verification statistics (SuperAdmin only)
exports.getVerificationStats = async (req, res) => {
  try {
    const stats = await BusinessVerification.getVerificationStats();

    // Format stats for easier consumption
    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      repass: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat.verification_status] = parseInt(stat.count);
      formattedStats.total += parseInt(stat.count);
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve verification statistics' });
  }
};

// Upload documents via URLs (from Supabase)
exports.uploadDocumentsViaUrls = async (req, res) => {
  try {
    const { business_id, documents } = req.body;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'No documents provided' });
    }

    // Verify business exists
    const businessResult = await pool.query('SELECT * FROM business WHERE business_id = $1', [business_id]);
    if (businessResult.rowCount === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessResult.rows[0];
    const uploadedDocuments = [];

    // Save each document URL to database
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      const documentData = {
        business_id: business_id,
        document_type: doc.documentType,
        document_name: doc.fileName,
        file_path: doc.url, // Store URL as file_path
        file_size: doc.fileSize,
        mime_type: doc.mimeType
      };

      const savedDocument = await BusinessDocument.create(documentData);
      uploadedDocuments.push(savedDocument);
    }

    // Create or update business verification record
    await BusinessVerification.create(business_id);

    // Check if all required documents are now uploaded
    const documentStatus = await hasRequiredDocuments(business_id);

    // Only send notifications and update status if all required documents are uploaded
    if (documentStatus.hasAllRequired) {
      // Get SuperAdmin email for notification
      const superAdminResult = await pool.query(
        'SELECT email FROM users WHERE role = $1 LIMIT 1',
        ['superadmin']
      );

      if (superAdminResult.rowCount > 0) {
        const superAdminEmail = superAdminResult.rows[0].email;
        // Send notification to super admin about new application
        await sendNewApplicationNotification(businessData, superAdminEmail);
      }

      // Send application submitted confirmation to the business
      await sendApplicationSubmittedNotification(businessData).catch(error => {
        console.error('Failed to send application submitted notification:', error);
      });

      // Update business verification status to submitted
      await pool.query(
        'UPDATE business SET verification_status = $1, verification_submitted_at = COALESCE(verification_submitted_at, NOW()), updated_at = NOW() WHERE business_id = $2',
        ['pending', business_id]
      );
    }

    res.status(201).json({
      message: documentStatus.hasAllRequired
        ? 'All required documents uploaded successfully. Your application has been submitted for verification.'
        : `Documents uploaded successfully. Please upload the remaining required documents: ${documentStatus.missingTypes.join(', ')}`,
      documents: uploadedDocuments,
      business_id: business_id,
      documentStatus: documentStatus,
      allRequiredUploaded: documentStatus.hasAllRequired
    });

  } catch (error) {
    console.error('Document upload via URLs error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// Download document file (SuperAdmin only) - now handles URLs
exports.downloadDocument = async (req, res) => {
  try {
    const { document_id } = req.params;

    if (!document_id) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const document = await BusinessDocument.findById(document_id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = document.file_path;

    // Check if it's a URL (Supabase) or local path
    if (filePath.startsWith('http')) {
      // Redirect to Supabase URL
      res.redirect(filePath);
    } else {
      // Local file
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }
      res.download(filePath, document.document_name);
    }

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

// All exports are already defined above with exports.functionName
