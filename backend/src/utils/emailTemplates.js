const getApprovalEmailTemplate = (businessName, documents) => {
  const documentList = documents.map(doc => 
    `<li>${doc.document_type}: <strong>${doc.verification_status === 'approved' ? '✅ Approved' : '❌ Rejected'}</strong></li>`
  ).join('\n');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="background-color: #2563eb; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Application Approved! 🎉</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hello ${businessName},</p>
        
        <p>We're excited to inform you that your business application has been reviewed and approved by our verification team.</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin-top: 0; color: #111827;">Document Status:</h3>
          <ul style="padding-left: 20px; margin: 8px 0;">
            ${documentList}
          </ul>
        </div>
        
        <p>You can now proceed to access all the features of eKahera.</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL}" 
             style="display: inline-block; background-color: #2563eb; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                    font-weight: 600; font-size: 16px;">
            Get Started with eKahera
          </a>
        </div>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <p>Best regards,<br>The eKahera Team</p>
      </div>
    </div>
  `;
};

const getRejectionEmailTemplate = (businessName, documents, rejectionReason) => {
  const documentList = documents.map(doc => {
    const status = doc.verification_status === 'approved' 
      ? '✅ Approved' 
      : '❌ Rejected';
    return `<li>${doc.document_type}: <strong>${status}</strong></li>`;
  }).join('\n');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="background-color: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Application Not Approved</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hello ${businessName},</p>
        
        <p>We've reviewed your business application, and unfortunately, we are unable to approve it at this time.</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin-top: 0; color: #111827;">Document Status:</h3>
          <ul style="padding-left: 20px; margin: 8px 0;">
            ${documentList}
          </ul>
          
          <h3 style="margin: 16px 0 8px 0; color: #111827;">Reason for Rejection:</h3>
          <p style="background-color: #fef2f2; padding: 12px; border-left: 4px solid #ef4444; margin: 0;">
            ${rejectionReason || 'No specific reason provided.'}
          </p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>Important:</strong> To proceed with verification, you will need to submit a new application with the required documents. Please ensure all documents are complete and meet our requirements before resubmitting.</p>
        </div>
        
        <p>If you have any questions about the rejection or need clarification on the requirements, please contact our support team.</p>
        
        <p>Best regards,<br>The eKahera Team</p>
      </div>
    </div>
  `;
};

module.exports = {
  getApprovalEmailTemplate,
  getRejectionEmailTemplate: (businessName, documents, rejectionReason) => 
    getRejectionEmailTemplate(businessName, documents, rejectionReason)
};
