const pool = require('../config/database');

class BusinessVerification {
  static async create(businessId) {
    // Since verification is tracked in the business table, 
    // we just need to ensure the business exists and update the submission timestamp
    const query = `
      UPDATE business 
      SET verification_submitted_at = COALESCE(verification_submitted_at, NOW()),
          updated_at = NOW()
      WHERE business_id = $1
      RETURNING business_id, verification_status, verification_submitted_at, 
              verification_reviewed_at, verification_reviewed_by, 
              verification_rejection_reason, verification_resubmission_notes
    `;

    const result = await pool.query(query, [businessId]);
    return result.rows[0];
  }

  static async findByBusinessId(businessId) {
    const query = `
      SELECT b.business_id, b.business_name, b.email as business_email,
             b.verification_status, b.verification_submitted_at,
             b.verification_reviewed_at, b.verification_reviewed_by,
             b.verification_rejection_reason, b.verification_resubmission_notes,
             u.username as reviewed_by_username
      FROM business b
      LEFT JOIN users u ON b.verification_reviewed_by = u.user_id
      WHERE b.business_id = $1
    `;
    
    const result = await pool.query(query, [businessId]);
    return result.rows[0];
  }

  static async updateStatus(businessId, status, reviewedBy, rejectionReason = null, resubmissionNotes = null) {
    const query = `
      UPDATE business 
      SET verification_status = $1,
          verification_reviewed_by = $2,
          verification_reviewed_at = NOW(),
          verification_rejection_reason = $3,
          verification_resubmission_notes = $4,
          updated_at = NOW()
      WHERE business_id = $5
      RETURNING business_id, verification_status, verification_submitted_at,
              verification_reviewed_at, verification_reviewed_by,
              verification_rejection_reason, verification_resubmission_notes
    `;

    const result = await pool.query(query, [
      status, reviewedBy, rejectionReason, resubmissionNotes, businessId
    ]);
    return result.rows[0];
  }

  static async getAllPendingVerifications() {
    const query = `
      SELECT b.business_id, b.business_name, b.email as business_email, b.business_type,
             b.business_address, b.mobile, b.created_at as business_created_at,
             b.verification_status, b.verification_submitted_at, b.verification_reviewed_at,
             b.verification_reviewed_by, b.verification_rejection_reason, b.verification_resubmission_notes,
             COUNT(bd.document_id) as total_documents,
             COUNT(CASE WHEN bd.verification_status = 'approved' THEN 1 END) as approved_documents,
             COUNT(CASE WHEN bd.verification_status = 'rejected' THEN 1 END) as rejected_documents,
             COUNT(CASE WHEN bd.verification_status = 'pending' THEN 1 END) as pending_documents
      FROM business b
      LEFT JOIN business_documents bd ON b.business_id = bd.business_id
      WHERE b.verification_status = 'pending'
      GROUP BY b.business_id, b.business_name, b.email, b.business_type, 
               b.business_address, b.mobile, b.created_at, b.verification_status,
               b.verification_submitted_at, b.verification_reviewed_at,
               b.verification_reviewed_by, b.verification_rejection_reason, 
               b.verification_resubmission_notes
      ORDER BY b.verification_submitted_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async getVerificationStats() {
    const query = `
      SELECT 
        verification_status,
        COUNT(*) as count
      FROM business
      GROUP BY verification_status
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async getBusinessWithDocuments(businessId) {
    const businessQuery = `
      SELECT b.business_id, b.business_name, b.email as business_email, b.business_type,
             b.business_address, b.house_number, b.mobile, b.country,
             b.created_at as business_created_at, b.verification_status,
             b.verification_submitted_at, b.verification_reviewed_at,
             b.verification_reviewed_by, b.verification_rejection_reason,
             b.verification_resubmission_notes
      FROM business b
      WHERE b.business_id = $1
    `;

    const documentsQuery = `
      SELECT * FROM business_documents 
      WHERE business_id = $1 
      ORDER BY uploaded_at DESC
    `;

    const businessResult = await pool.query(businessQuery, [businessId]);
    const documentsResult = await pool.query(documentsQuery, [businessId]);

    if (businessResult.rows.length === 0) {
      return null;
    }

    return {
      ...businessResult.rows[0],
      documents: documentsResult.rows
    };
  }
}

module.exports = BusinessVerification;
