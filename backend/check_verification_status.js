const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ekahera_db',
  user: 'postgres',
  password: '11300330',
});

async function checkVerificationStatus() {
  try {
    console.log('Checking verification status for businesses with documents...\n');

    // Get businesses with documents and their verification status
    const query = `
      SELECT
        b.business_id,
        b.business_name,
        b.email,
        b.verification_status,
        b.verification_submitted_at,
        COUNT(bd.document_id) as document_count,
        STRING_AGG(bd.document_type, ', ') as document_types
      FROM business b
      LEFT JOIN business_documents bd ON b.business_id = bd.business_id
      WHERE bd.document_id IS NOT NULL
      GROUP BY b.business_id, b.business_name, b.email, b.verification_status, b.verification_submitted_at
      ORDER BY b.business_id;
    `;

    const result = await pool.query(query);

    console.log('Businesses with documents:');
    console.log('='.repeat(80));

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Business ID: ${row.business_id}`);
      console.log(`   Name: ${row.business_name}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Verification Status: ${row.verification_status || 'NULL'}`);
      console.log(`   Submitted At: ${row.verification_submitted_at || 'NULL'}`);
      console.log(`   Document Count: ${row.document_count}`);
      console.log(`   Document Types: ${row.document_types}`);
      console.log('');
    });

    // Check what the pending verifications query would return
    console.log('What would be returned by getPendingVerifications():');
    console.log('='.repeat(50));

    const pendingQuery = `
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
      ORDER BY b.verification_submitted_at ASC;
    `;

    const pendingResult = await pool.query(pendingQuery);

    if (pendingResult.rows.length === 0) {
      console.log('No pending verifications found.');
    } else {
      pendingResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.business_name} (${row.business_id}) - ${row.total_documents} documents`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationStatus();
