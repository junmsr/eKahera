const pool = require('../config/database');

class BusinessDocument {
  static async create(documentData) {
    const {
      business_id,
      document_type,
      document_name,
      file_path,
      file_size,
      mime_type
    } = documentData;

    const query = `
      INSERT INTO business_documents (
        business_id, document_type, document_name, 
        file_path, file_size, mime_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      business_id, document_type, document_name,
      file_path, file_size, mime_type
    ]);

    return result.rows[0];
  }

  static async findByBusinessId(businessId) {
    const query = `
      SELECT * FROM business_documents 
      WHERE business_id = $1 
      ORDER BY uploaded_at DESC
    `;
    
    const result = await pool.query(query, [businessId]);
    return result.rows;
  }

  static async findById(documentId) {
    const query = `
      SELECT bd.*, b.business_name, b.email as business_email
      FROM business_documents bd
      JOIN business b ON bd.business_id = b.business_id
      WHERE bd.document_id = $1
    `;
    
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }

  static async updateVerificationStatus(documentId, status, notes, verifiedBy) {
    const query = `
      UPDATE business_documents 
      SET verification_status = $1, 
          verification_notes = $2, 
          verified_by = $3,
          verified_at = NOW(),
          updated_at = NOW()
      WHERE document_id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [status, notes, verifiedBy, documentId]);
    return result.rows[0];
  }

  static async getAllPendingDocuments() {
    const query = `
      SELECT bd.*, b.business_name, b.email as business_email,
             u.username as uploaded_by_username
      FROM business_documents bd
      JOIN business b ON bd.business_id = b.business_id
      LEFT JOIN users u ON b.business_id = u.business_id AND u.role = 'business_owner'
      WHERE bd.verification_status = 'pending'
      ORDER BY bd.uploaded_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async getDocumentsByStatus(status) {
    const query = `
      SELECT bd.*, b.business_name, b.email as business_email
      FROM business_documents bd
      JOIN business b ON bd.business_id = b.business_id
      WHERE bd.verification_status = $1
      ORDER BY bd.uploaded_at DESC
    `;
    
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  static async deleteById(documentId) {
    const query = 'DELETE FROM business_documents WHERE document_id = $1 RETURNING *';
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }
}

module.exports = BusinessDocument;
