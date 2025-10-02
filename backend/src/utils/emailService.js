const nodemailer = require('nodemailer');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Load config from config.env file
const configPath = path.join(__dirname, '..', '..', 'config.env');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = {};

configContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    config[key.trim()] = value.trim();
  }
});

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: config.EMAIL_USER || 'your-email@gmail.com',
      pass: config.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Log email notification to database
const logEmailNotification = async (recipientEmail, subject, message, type, businessId = null, userId = null) => {
  try {
    const query = `
      INSERT INTO email_notifications 
      (recipient_email, subject, message, notification_type, business_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING notification_id
    `;
    
    const result = await pool.query(query, [
      recipientEmail, subject, message, type, businessId, userId
    ]);
    
    return result.rows[0].notification_id;
  } catch (error) {
    console.error('Error logging email notification:', error);
    return null;
  }
};

// Send email notification for new business application
const sendNewApplicationNotification = async (businessData, superAdminEmail) => {
  const transporter = createTransporter();
  
  const subject = 'New Business Application - eKahera Verification Required';
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Business Application Received</h2>
      
      <p>A new business has submitted their application for verification on eKahera.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Business Details:</h3>
        <p><strong>Business Name:</strong> ${businessData.business_name}</p>
        <p><strong>Business Type:</strong> ${businessData.business_type}</p>
        <p><strong>Email:</strong> ${businessData.email}</p>
        <p><strong>Address:</strong> ${businessData.business_address}, ${businessData.country}</p>
        <p><strong>Mobile:</strong> ${businessData.mobile}</p>
        <p><strong>Application Date:</strong> ${new Date(businessData.created_at).toLocaleDateString()}</p>
      </div>
      
      <p>Please log in to the SuperAdmin panel to review the submitted documents and verify the business.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/superadmin" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review Application
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated notification from eKahera. Please do not reply to this email.
      </p>
    </div>
  `;

  const mailOptions = {
    from: config.EMAIL_USER || 'noreply@ekahera.com',
    to: superAdminEmail,
    subject: subject,
    html: message
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmailNotification(superAdminEmail, subject, message, 'new_application', businessData.business_id);
    console.log('New application notification sent to SuperAdmin:', superAdminEmail);
    return true;
  } catch (error) {
    console.error('Error sending new application notification:', error);
    return false;
  }
};

// Send verification status notification to business
const sendVerificationStatusNotification = async (businessData, status, rejectionReason = null, resubmissionNotes = null) => {
  const transporter = createTransporter();
  
  let subject, message;
  
  if (status === 'approved') {
    subject = '🎉 Congratulations! Your Business Has Been Verified - eKahera';
    message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin-bottom: 10px;">🎉 Congratulations!</h1>
          <h2 style="color: #374151;">Your Business Has Been Verified</h2>
        </div>
        
        <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #065f46; font-size: 16px; margin: 0;">
            <strong>${businessData.business_name}</strong> has been successfully verified and approved!
          </p>
        </div>
        
        <p>Your business documents have been reviewed and approved by our verification team. You can now access all features of the eKahera system.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
          <ul style="color: #6b7280;">
            <li>Complete your business setup</li>
            <li>Add your products and inventory</li>
            <li>Set up your POS system</li>
            <li>Invite your team members</li>
          </ul>
        </div>
        
        <p>Welcome to eKahera! We're excited to help you grow your business.</p>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    `;
  } else if (status === 'rejected') {
    subject = 'Business Verification Update - Additional Information Required';
    message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Business Verification Update</h2>
        
        <p>Thank you for submitting your business application for <strong>${businessData.business_name}</strong>.</p>
        
        <div style="background-color: #fef2f2; border: 2px solid #f87171; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; margin: 0;">
            <strong>Additional Information Required</strong>
          </p>
        </div>
        
        <p>After reviewing your submitted documents, we need additional information or clarification before we can approve your business.</p>
        
        ${rejectionReason ? `
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Reason for Request:</h3>
            <p style="color: #6b7280;">${rejectionReason}</p>
          </div>
        ` : ''}
        
        <p>Please review the feedback and resubmit your documents with the necessary corrections or additional information.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Application
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions about this feedback, please contact our support team.
        </p>
      </div>
    `;
  } else if (status === 'repass') {
    subject = 'Business Verification - Document Resubmission Required';
    message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Document Resubmission Required</h2>
        
        <p>Thank you for your business application for <strong>${businessData.business_name}</strong>.</p>
        
        <div style="background-color: #fffbeb; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;">
            <strong>Document Quality Issue Detected</strong>
          </p>
        </div>
        
        <p>Some of your submitted documents appear to be unclear or blurry, making it difficult for our verification team to review them properly.</p>
        
        ${resubmissionNotes ? `
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Specific Issues:</h3>
            <p style="color: #6b7280;">${resubmissionNotes}</p>
          </div>
        ` : ''}
        
        <p>Please resubmit clear, high-quality images or scans of the requested documents to continue with the verification process.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Resubmit Documents
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Please ensure documents are clear, well-lit, and all text is readable before resubmitting.
        </p>
      </div>
    `;
  }

  const mailOptions = {
    from: config.EMAIL_USER || 'noreply@ekahera.com',
    to: businessData.email,
    subject: subject,
    html: message
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmailNotification(businessData.email, subject, message, `verification_${status}`, businessData.business_id);
    console.log(`Verification ${status} notification sent to:`, businessData.email);
    return true;
  } catch (error) {
    console.error('Error sending verification status notification:', error);
    return false;
  }
};

// Send application submitted confirmation to business
const sendApplicationSubmittedNotification = async (businessData) => {
  const transporter = createTransporter();
  
  const subject = 'Application Submitted Successfully - eKahera Verification in Progress';
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Application Submitted Successfully</h2>
      
      <p>Thank you for submitting your business application to eKahera!</p>
      
      <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #1e40af; margin: 0;">
          <strong>Your application for "${businessData.business_name}" has been received and is under review.</strong>
        </p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">What happens next?</h3>
        <ul style="color: #6b7280;">
          <li>Our verification team will review your submitted documents</li>
          <li>The verification process typically takes <strong>1-3 business days</strong></li>
          <li>You will receive an email notification once the review is complete</li>
          <li>If approved, you'll gain full access to all eKahera features</li>
        </ul>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>Important:</strong> Please wait 1-3 business days for verification. You will be notified via email once the process is complete.
        </p>
      </div>
      
      <p>In the meantime, please ensure you have access to this email address as we'll send all updates here.</p>
      
      <p style="color: #6b7280; font-size: 14px;">
        If you have any questions about the verification process, please contact our support team.
      </p>
      
      <p>Thank you for choosing eKahera!</p>
    </div>
  `;

  const mailOptions = {
    from: config.EMAIL_USER || 'noreply@ekahera.com',
    to: businessData.email,
    subject: subject,
    html: message
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmailNotification(businessData.email, subject, message, 'application_submitted', businessData.business_id);
    console.log('Application submitted notification sent to:', businessData.email);
    return true;
  } catch (error) {
    console.error('Error sending application submitted notification:', error);
    return false;
  }
};

module.exports = {
  sendNewApplicationNotification,
  sendVerificationStatusNotification,
  sendApplicationSubmittedNotification,
  logEmailNotification
};
