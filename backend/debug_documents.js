const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ekahera_db',
  user: 'postgres',
  password: '11300330',
});

async function checkDocuments() {
  try {
    // Get the most recent business
    const businessQuery = 'SELECT business_id, business_name, email FROM business ORDER BY created_at DESC LIMIT 1';
    const businessResult = await pool.query(businessQuery);
    
    if (businessResult.rows.length === 0) {
      console.log('No businesses found');
      return;
    }
    
    const business = businessResult.rows[0];
    console.log('Checking documents for business:', business);
    
    // Get documents for this business
    const documentsQuery = `
      SELECT document_id, document_type, document_name, uploaded_at 
      FROM business_documents 
      WHERE business_id = $1
      ORDER BY uploaded_at DESC
    `;
    const documentsResult = await pool.query(documentsQuery, [business.business_id]);
    
    console.log('\nUploaded documents:');
    documentsResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. Type: "${doc.document_type}"`);
      console.log(`   Name: ${doc.document_name}`);
      console.log(`   Uploaded: ${doc.uploaded_at}`);
      console.log('');
    });
    
    // Check validation logic
    const requiredTypes = [
      'Business Registration Certificate',
      'Mayor\'s Permit', 
      'BIR Certificate of Registration'
    ];
    
    const uploadedTypes = documentsResult.rows.map(row => row.document_type);
    
    console.log('Required document types:', requiredTypes);
    console.log('Uploaded document types:', uploadedTypes);
    console.log('');
    
    // Test the validation logic
    requiredTypes.forEach(requiredType => {
      const found = uploadedTypes.some(uploadedType => {
        const normalizedRequired = requiredType.replace(/['\s]/g, '').toLowerCase();
        const normalizedUploaded = uploadedType.replace(/['\s]/g, '').toLowerCase();
        const matches = normalizedUploaded.includes(normalizedRequired) || normalizedRequired.includes(normalizedUploaded);
        
        console.log(`Checking "${requiredType}" vs "${uploadedType}"`);
        console.log(`Normalized: "${normalizedRequired}" vs "${normalizedUploaded}" = ${matches}`);
        
        return matches;
      });
      
      console.log(`✅ Required document "${requiredType}" found: ${found}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDocuments();
