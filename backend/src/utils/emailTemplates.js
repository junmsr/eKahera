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
          <a href="${process.env.FRONTEND_URL}/congratulations" 
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
        <h1 style="color: white; margin: 0;">Application Requires Updates</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hello ${businessName},</p>
        
        <p>We've reviewed your business application, and some of your documents require updates before we can proceed with verification.</p>
        
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
        
        <p>Please review the feedback and contact our support team if you have any questions.</p>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        
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
