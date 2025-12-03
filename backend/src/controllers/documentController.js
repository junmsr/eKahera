const BusinessDocument = require('../models/BusinessDocument');
const BusinessVerification = require('../models/BusinessVerification');
const { 
  sendNewApplicationNotification, 
  sendVerificationStatusNotification, 
  sendApplicationSubmittedNotification,
  sendVerificationApprovalEmail,
  sendVerificationRejectionEmail 
} = require('../utils/emailService');
const { hasRequiredDocuments } = require('./businessController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const pool = require('../config/database');
const supabaseStorage = require('../utils/supabaseStorage');
const { logAction } = require('../utils/logger');

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

    logAction({
      userId: req.user?.userId,
      businessId: business_id,
      action: `Uploaded ${files.length} documents for business ${businessData.business_name}`,
    });

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
      // Get all SuperAdmin emails for notification
      const superAdminResult = await pool.query(
        'SELECT email FROM users WHERE role = $1',
        ['superadmin']
      );

      if (superAdminResult.rowCount > 0) {
        const superAdminEmails = superAdminResult.rows.map(row => row.email);
        // Send notification to all super admins about new application
        await sendNewApplicationNotification(businessData, superAdminEmails);
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

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (approved, rejected)' });
    }

    const updatedDocument = await BusinessDocument.updateVerificationStatus(
      document_id, status, notes, verifiedBy
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    logAction({
      userId: req.user.userId,
      businessId: updatedDocument.business_id,
      action: `Verified document: ${updatedDocument.document_name} with status: ${status}`,
    });

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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const { business_id } = req.params;
    const { status, rejection_reason } = req.body;
    const reviewedBy = req.user.userId;

    if (!business_id) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Business ID is required' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Valid status is required (approved, rejected)' });
    }

    // Get business data and documents first
    const businessResult = await client.query(
      `SELECT b.*, u.user_id 
       FROM business b 
       JOIN users u ON LOWER(b.email) = LOWER(u.email) 
       WHERE b.business_id = $1`, 
      [business_id]
    );
    
    if (businessResult.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessResult.rows[0];
    
    // Get all documents for this business with their current status
    const documentsResult = await client.query(`
      SELECT 
        document_id,
        document_type,
        verification_status,
        verification_notes,
        file_path,
        file_size,
        mime_type,
        verified_at,
        verified_by
      FROM business_documents 
      WHERE business_id = $1
    `, [business_id]);
    
    const documents = documentsResult.rows;

    // Update business verification status
    const updatedVerification = await BusinessVerification.updateStatus(
      business_id, 
      status, 
      reviewedBy, 
      rejection_reason,
      null,
      client  // Pass the client to use the same connection
    );

    if (!updatedVerification) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Business verification not found' });
    }

    console.log('Sending email to:', businessData.email);
    console.log('Email status:', status);
    
    // Prepare documents data for email with only necessary fields
    const emailDocuments = documents.map(doc => ({
      document_type: doc.document_type,
      verification_status: doc.verification_status,
      verification_notes: doc.verification_notes
    }));

    console.log('Documents to include in email:', JSON.stringify(emailDocuments, null, 2));
    
    // Send appropriate email notification
    let emailSent = false;
    try {
      if (status === 'approved') {
        console.log('Sending approval email...');
        emailSent = await sendVerificationApprovalEmail({
          ...businessData,
          user_id: businessData.user_id
        }, emailDocuments);
      } else {
        console.log('Sending rejection email with reason:', rejection_reason);
        emailSent = await sendVerificationRejectionEmail({
          ...businessData,
          user_id: businessData.user_id
        }, emailDocuments, rejection_reason || 'No specific reason provided.');
      }
      console.log('Email sent successfully:', emailSent);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the whole operation if email fails
      emailSent = false;
    }

    logAction({
      userId: req.user.userId,
      businessId: business_id,
      action: `Completed business verification for ${businessData.business_name} with status: ${status}`,
    });

    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `Business verification ${status} successfully`,
      verification: updatedVerification
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete business verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete business verification',
      details: error.message 
    });
  } finally {
    client.release();
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
      total: 0
    };

    stats.forEach(stat => {
      const key = stat.verification_status === 'repass' ? 'rejected' : stat.verification_status;
      const count = parseInt(stat.count, 10);
      if (formattedStats[key] !== undefined) {
        formattedStats[key] += count;
        formattedStats.total += count;
      }
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
      // Get all SuperAdmin emails for notification
      const superAdminResult = await pool.query(
        'SELECT email FROM users WHERE role = $1',
        ['superadmin']
      );

      if (superAdminResult.rowCount > 0) {
        const superAdminEmails = superAdminResult.rows.map(row => row.email);
        // Send notification to all super admins about new application
        await sendNewApplicationNotification(businessData, superAdminEmails);
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

    const filePath = document.file_path || '';
    const storageEndpoint = (process.env.SUPABASE_STORAGE_ENDPOINT || '').replace(/\/$/, '');
    const bucketPrefix = storageEndpoint && supabaseStorage.bucketName
      ? `${storageEndpoint}/${supabaseStorage.bucketName}/`
      : null;

    // Check if it's a URL (Supabase) or local path
    if (filePath.startsWith('http') && bucketPrefix && filePath.startsWith(bucketPrefix)) {
      const storageKey = filePath.substring(bucketPrefix.length);
      try {
        const downloadResult = await supabaseStorage.downloadFile(storageKey);

        if (!downloadResult.success || !downloadResult.buffer) {
          console.error('Supabase storage download failed:', downloadResult.error);
          return res.status(502).json({ error: 'Failed to fetch document from storage' });
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Type', downloadResult.contentType || document.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.document_name)}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        
        // Handle different types of responses
        if (Buffer.isBuffer(downloadResult.buffer)) {
          // If it's a buffer, send it directly
          return res.send(downloadResult.buffer);
        } else if (typeof downloadResult.buffer === 'string') {
          // If it's a string, convert to buffer and send
          return res.send(Buffer.from(downloadResult.buffer));
        } else if (downloadResult.buffer && typeof downloadResult.buffer.pipe === 'function') {
          // If it's a stream, pipe it
          return downloadResult.buffer.pipe(res);
        } else {
          // Fallback to JSON response if we can't determine the type
          return res.status(500).json({ error: 'Unsupported file type' });
        }
      } catch (storageError) {
        console.error('Supabase storage fetch threw error:', storageError);
        return res.status(502).json({ error: 'Failed to fetch document from storage' });
      }
    } else if (filePath.startsWith('http')) {
      try {
        // Extract the path from the full URL
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/');
        // The path in the bucket is everything after the bucket name
        const bucketIndex = pathParts.indexOf('eKahera');
        if (bucketIndex === -1) {
          throw new Error('Invalid file path format');
        }
        const filePathInBucket = pathParts.slice(bucketIndex + 1).join('/');
        
        // Download the file using the Supabase client
        const { data, error } = await supabaseStorage.downloadFile(filePathInBucket);
        
        if (error) {
          console.error('Supabase download error:', error);
          throw new Error('Failed to download file from storage');
        }
        
        // Set appropriate headers for file download
        res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.document_name)}"`);
        
        // Send the file data
        return res.send(data);
        
      } catch (error) {
        console.error('Error downloading file from Supabase:', error);
        return res.status(500).json({ error: 'Failed to download file: ' + error.message });
      }
    } else {
      // Local file
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }
      
      // Set headers for local file download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.document_name)}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      return res.download(filePath, document.document_name);
    }
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

// Get document info by ID (public endpoint for resubmission)
exports.getDocumentInfo = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const document = await BusinessDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only return necessary fields
    res.json({
      document_id: document.document_id,
      business_id: document.business_id,
      document_type: document.document_type,
      document_name: document.document_name,
      verification_status: document.verification_status,
      verification_notes: document.verification_notes,
      uploaded_at: document.uploaded_at
    });

  } catch (error) {
    console.error('Get document info error:', error);
    res.status(500).json({ error: 'Failed to retrieve document information' });
  }
};

// Resubmit a rejected document
exports.resubmitDocument = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { document_id } = req.body;
    const file = req.file;
    
    if (!document_id) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the document to verify it exists and is rejected
    const document = await BusinessDocument.findById(document_id, client);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (document.verification_status !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected documents can be resubmitted' });
    }

    await client.query('BEGIN');

    // Upload the new file to Supabase
    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await supabaseStorage.uploadFile(
      fileBuffer,
      file.originalname,
      file.mimetype,
      document.business_id,
      document.document_type // Include document type in the path for better organization
    );

    if (!uploadResult.success) {
      throw new Error('Failed to upload document to storage');
    }

    // Update the document record with the new file
    const updatedDocument = await BusinessDocument.update(
      document_id,
      {
        document_name: file.originalname,
        file_path: uploadResult.url,
        file_size: file.size,
        mime_type: file.mimetype,
        verification_status: 'pending',
        verification_notes: null,
        verified_at: null,
        verified_by: null
      },
      client
    );

    // Clean up the uploaded file
    fs.unlinkSync(file.path);
    
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Document resubmitted successfully',
      document: updatedDocument
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Document resubmission error:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error cleaning up uploaded file:', e);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to resubmit document',
      details: error.message
    });
  } finally {
    client.release();
  }
};

// All exports are already defined above with exports.functionName
