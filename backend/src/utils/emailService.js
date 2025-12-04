const { Resend } = require('resend');
const pool = require('../config/database');
const { getApprovalEmailTemplate, getRejectionEmailTemplate } = require('./emailTemplates');

let resend;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('WARNING: RESEND_API_KEY not found in environment variables. Email sending will be disabled.');
}

// Rate limiting configuration for Resend API
const RATE_LIMIT = {
  MAX_REQUESTS: 2,      // Resend's rate limit: 2 requests per second
  INTERVAL_MS: 1000,    // 1 second interval
  MAX_RETRIES: 3,       // Maximum number of retry attempts
  INITIAL_RETRY_DELAY: 1000, // Initial retry delay in ms
  MAX_RETRY_DELAY: 30000,    // Maximum retry delay in ms
  JITTER_FACTOR: 0.2,   // Add randomness to retry delays
  CONCURRENT_REQUESTS: 2 // Maximum concurrent requests (matches rate limit)
};

// Queue for managing email sends with concurrency control
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    this.activeRequests = 0;
    this.maxConcurrent = RATE_LIMIT.CONCURRENT_REQUESTS; // Match concurrency with rate limit
  }

  async add(emailData) {
    return new Promise((resolve, reject) => {
      this.queue.push({ emailData, resolve, reject, retryCount: 0 });
      this.process();
    });
  }

  calculateBackoff(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = Math.min(
      RATE_LIMIT.INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
      RATE_LIMIT.MAX_RETRY_DELAY
    );
    const jitter = baseDelay * RATE_LIMIT.JITTER_FACTOR * (Math.random() * 2 - 1);
    return Math.max(100, baseDelay + jitter);
  }

  async process() {
    if (this.processing || this.queue.length === 0 || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;
    
    try {
      while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minRequestInterval = RATE_LIMIT.INTERVAL_MS / RATE_LIMIT.MAX_REQUESTS;
        
        // Rate limiting
        if (timeSinceLastRequest < minRequestInterval) {
          const waitTime = minRequestInterval - timeSinceLastRequest;
          await delay(waitTime);
        }
        
        const item = this.queue.shift();
        if (!item) continue;
        
        this.activeRequests++;
        this.lastRequestTime = Date.now();
        
        // Process the email in the background
        this.processEmail(item).finally(() => {
          this.activeRequests--;
          // Continue processing the queue after a short delay
          setTimeout(() => this.process(), 10);
        });
      }
    } finally {
      this.processing = false;
    }
  }

  async processEmail({ emailData, resolve, reject, retryCount }) {
    try {
      const response = await resend.emails.send(emailData);
      resolve(response);
    } catch (error) {
      if (error.statusCode === 429 || (error.statusCode >= 500 && error.statusCode < 600)) {
        // Retry on rate limits or server errors
        if (retryCount < RATE_LIMIT.MAX_RETRIES) {
          const backoff = this.calculateBackoff(retryCount);
          console.warn(`Email send failed (attempt ${retryCount + 1}/${RATE_LIMIT.MAX_RETRIES}), retrying in ${backoff}ms`);
          
          // Re-add to queue with incremented retry count
          setTimeout(() => {
            this.queue.unshift({
              emailData,
              resolve,
              reject,
              retryCount: retryCount + 1
            });
            this.process();
          }, backoff);
          return;
        }
      }
      
      // If we get here, all retries failed or it's a non-retryable error
      console.error('Email send failed after retries:', error);
      reject(error);
    }
  }
}

// Initialize the queue
const emailQueue = new EmailQueue();

// Add email to queue and process
const sendEmailWithRateLimit = (emailData) => {
  if (!resend) {
    return Promise.reject(new Error('Email service not configured - missing RESEND_API_KEY'));
  }
  return emailQueue.add(emailData);
};

// Helper function to add delay between operations
const delay = ms => new Promise(resolve => {
  if (ms <= 0) {
    resolve();
    return;
  }
  setTimeout(resolve, ms);
});


// Log email notification to database
const logEmailNotification = async (recipientEmail, subject, message, type, businessId = null, userId = null) => {
  try {
    // Only include business_id in the query if it's provided and not null
    const includeBusinessId = businessId !== null && businessId !== undefined;
    const query = `
      INSERT INTO email_notifications 
      (recipient_email, subject, message, notification_type, ${includeBusinessId ? 'business_id, ' : ''} user_id)
      VALUES ($1, $2, $3, $4, ${includeBusinessId ? '$5, ' : ''} ${includeBusinessId ? '$6' : '$5'})
      RETURNING notification_id
    `;
    
    const params = [recipientEmail, subject, message, type];
    if (includeBusinessId) {
      params.push(businessId);
    }
    if (userId) {
      params.push(userId);
    } else {
      params.push(null);
    }
    
    const result = await pool.query(query, params);
    return result.rows[0]?.notification_id || null;
  } catch (error) {
    console.error('Error logging email notification:', error);
    return null;
  }
};

// Send email notification for new business application
// Helper function to send a single email with retry logic (private)
const _sendSingleEmail = async (email, subject, html, businessData, retryCount = 0) => {
  const maxRetries = 2;
  const baseDelay = 1000; // 1 second base delay
  
  try {
    await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>',
      to: email,
      subject: subject,
      html: html,
    });
    
    await logEmailNotification(
      email, 
      subject, 
      `New business application notification sent for ${businessData.business_name}`,
      'new_application',
      businessData.business_id
    );
    
    console.log('Email sent successfully to:', email);
    return { success: true, email };
  } catch (error) {
    if (error.statusCode === 429 && retryCount < maxRetries) {
      // Calculate exponential backoff with jitter
      const delayMs = Math.min(
        baseDelay * Math.pow(2, retryCount) + Math.random() * 1000,
        10000 // Max 10 seconds
      );
      
      console.warn(`Rate limited. Retrying ${email} in ${Math.round(delayMs)}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await delay(delayMs);
      return _sendSingleEmail(email, subject, html, businessData, retryCount + 1);
    }
    
    console.error(`Failed to send email to ${email} after ${retryCount} retries:`, error.message);
    return { success: false, email, error: error.message };
  }
};

const sendNewApplicationNotification = async (businessData, superAdminEmails) => {
  console.log('sendNewApplicationNotification called with:', { businessData, superAdminEmails });
  
  if (!resend) {
    const errorMsg = 'Email sending is disabled. Cannot send new application notification.';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  // Ensure superAdminEmails is an array and remove duplicates
  if (!Array.isArray(superAdminEmails)) {
    superAdminEmails = [superAdminEmails];
  }
  superAdminEmails = [...new Set(superAdminEmails)]; // Remove duplicates
  
  console.log(`Preparing to send notifications to ${superAdminEmails.length} superadmins`);

  const subject = 'New Business Application - eKahera Verification Required';
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin-bottom: 5px;">eKahera</h1>
        <div style="height: 3px; background: linear-gradient(90deg, #2563eb, #7c3aed); margin: 10px 0;"></div>
      </div>
      
      <h2 style="color: #1e40af; margin-top: 30px;">New Business Application Received</h2>
      
      <p>Hello eKahera Admin,</p>
      
      <p>A new business has submitted their application for verification on eKahera. Here are the details:</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="color: #1e40af; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Business Details</h3>
        <p><strong>Business Name:</strong> ${businessData.business_name || 'N/A'}</p>
        <p><strong>Business Type:</strong> ${businessData.business_type || 'N/A'}</p>
        <p><strong>Email:</strong> ${businessData.email || 'N/A'}</p>
        ${businessData.contact_number ? `<p><strong>Contact Number:</strong> ${businessData.contact_number}</p>` : ''}
        ${businessData.mobile ? `<p><strong>Mobile:</strong> ${businessData.mobile}</p>` : ''}
        ${businessData.business_address ? `<p><strong>Address:</strong> ${businessData.business_address}${businessData.country ? `, ${businessData.country}` : ''}</p>` : ''}
        <p><strong>Application Date:</strong> ${new Date(businessData.created_at || new Date()).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
      </div>
      
      <p>Please log in to the SuperAdmin panel to review the submitted documents and verify the business at your earliest convenience.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://www.ekahera.online'}/superadmin/dashboard" 
           style="background: linear-gradient(90deg, #2563eb, #4f46e5); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          Review Application
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
        <p>This is an automated notification from eKahera. Please do not reply to this email.</p>
        <p>If you believe you received this email in error, please contact our support team.</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} eKahera. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    console.log(`Starting to send email notifications to ${superAdminEmails.length} superadmins`);
    const results = [];
    
    // Process emails sequentially with delay
    for (let i = 0; i < superAdminEmails.length; i++) {
      const email = superAdminEmails[i];
      console.log(`Processing email ${i + 1} of ${superAdminEmails.length}: ${email}`);
      
      // Add delay between emails (minimum 1 second)
      if (i > 0) {
        const delayMs = 1000 + Math.random() * 500; // 1-1.5 seconds between emails
        await delay(delayMs);
      }
      
      try {
        const result = await _sendSingleEmail(email, subject, message, businessData);
        results.push(result);
      } catch (error) {
        console.error(`Error processing email ${email}:`, error);
        results.push({ success: false, email, error: error.message });
      }
    }
    
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('Email sending completed:', {
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      failedEmails: failed.map(f => f.email)
    });
    
    return {
      success: failed.length === 0,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      failedEmails: failed.map(f => f.email)
    };
  } catch (error) {
    console.error('Unexpected error in sendNewApplicationNotification:', error);
    return {
      success: false,
      error: error.message,
      total: superAdminEmails.length,
      succeeded: 0,
      failed: superAdminEmails.length,
      failedEmails: superAdminEmails
    };
  }
};

// Send verification status notification to business
// Send verification status notification to business
const sendVerificationApprovalEmail = async (businessData, documents) => {
  if (!resend) {
    console.error('Email sending is disabled. Cannot send approval notification.');
    return false;
  }

  try {
    const subject = '🎉 Your eKahera Application Has Been Approved!';
    const htmlContent = getApprovalEmailTemplate(businessData.business_name, documents);
    
    const { data, error } = await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>', // Update with your verified sender
      to: businessData.email,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending approval email:', error);
      return false;
    }

    // Log the email notification
    await logEmailNotification(
      businessData.email,
      subject,
      `Approval notification sent to ${businessData.business_name}`,
      'verification_approval',
      businessData.business_id,
      businessData.user_id
    );

    return true;
  } catch (error) {
    console.error('Error in sendVerificationApprovalEmail:', error);
    return false;
  }
};

// Send rejection email with resubmission instructions
const sendVerificationRejectionEmail = async (businessData, documents, rejectionReason) => {
  if (!resend) {
    console.error('Email sending is disabled. Cannot send rejection notification.');
    return false;
  }

  try {
    const subject = '🔄 Action Required: Update Your eKahera Application';
    const htmlContent = getRejectionEmailTemplate(
      businessData.business_name, 
      documents,
      rejectionReason,
      businessData.email
    );
    
    const { data, error } = await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>', // Update with your verified sender
      to: businessData.email,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending rejection email:', error);
      return false;
    }

    // Log the email notification
    await logEmailNotification(
      businessData.email,
      subject,
      `Rejection notification sent to ${businessData.business_name} with reason: ${rejectionReason}`,
      'verification_rejection',
      businessData.business_id,
      businessData.user_id
    );

    return true;
  } catch (error) {
    console.error('Error in sendVerificationRejectionEmail:', error);
    return false;
  }
};

const sendVerificationStatusNotification = async (businessData, status, rejectionReason = null) => {
  if (!resend) {
    console.error('Email sending is disabled. Cannot send verification status notification.');
    return false;
  }

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
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
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
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Application
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions about this feedback, please contact our support team.
        </p>
      </div>
    `;
  }

  try {
    // Send to business owner first
    await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>',
      to: businessData.email,
      subject: subject,
      html: message,
    });

    await logEmailNotification(
      businessData.email,
      subject,
      `Verification ${status} notification sent to business owner`,
      `verification_${status}`,
      businessData.business_id
    );

    console.log(`Verification ${status} notification sent to business:`, businessData.email);

    // Add delay before sending to admins
    await delay(1000);

    // Get all super admin emails
    const superAdmins = await pool.query(
      `SELECT email FROM users WHERE role = 'super_admin' AND email_verified = true`
    );

    // Send to each super admin with delay
    for (const admin of superAdmins.rows) {
      try {
        const adminSubject = `[Admin] Business ${status.charAt(0).toUpperCase() + status.slice(1)}: ${businessData.business_name}`;
        const adminMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Business ${status === 'approved' ? 'Approval' : 'Rejection'} Notification</h2>
            <p>The following business has been ${status}:</p>
            <p><strong>Business Name:</strong> ${businessData.business_name}</p>
            <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason || 'No reason provided'}</p>` : ''}
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `;

        await resend.emails.send({
          from: 'eKahera <noreply@ekahera.online>',
          to: admin.email,
          subject: adminSubject,
          html: adminMessage,
        });

        await logEmailNotification(
          admin.email,
          adminSubject,
          `Notification sent to admin about ${businessData.business_name} ${status}`,
          `admin_notification_${status}`,
          businessData.business_id
        );

        console.log(`Notification sent to admin:`, admin.email);
        
        // Add delay between admin emails
        await delay(1000);
      } catch (adminError) {
        console.error(`Error sending email to admin ${admin.email}:`, adminError);
        // Continue with next admin even if one fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error in sendVerificationStatusNotification:', error);
    return false;
  }
};

// Send application submitted confirmation to business
const sendApplicationSubmittedNotification = async (businessData) => {
  if (!resend) {
    const errorMsg = 'Email sending is disabled. RESEND_API_KEY is missing or invalid.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  if (!businessData || !businessData.email) {
    const errorMsg = 'Cannot send application submitted notification: Missing business email';
    console.error(errorMsg, { businessData });
    throw new Error(errorMsg);
  }
  
  console.log('Attempting to send application submitted notification to:', businessData.email);
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

  try {
    await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>',
      to: businessData.email,
      subject: subject,
      html: message,
    });
    const logId = await logEmailNotification(businessData.email, subject, message, 'application_submitted', businessData.business_id);
    console.log('Application submitted notification sent successfully', {
      email: businessData.email,
      businessId: businessData.business_id,
      logId: logId
    });
    return true;
  } catch (error) {
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      businessEmail: businessData?.email,
      businessId: businessData?.business_id,
      timestamp: new Date().toISOString()
    };
    console.error('Error sending application submitted notification:', errorDetails);
    throw error; // Re-throw to allow calling code to handle the error
  }
};

const sendLowStockEmail = async (recipientEmail, lowStockProducts) => {
  if (!resend) {
    console.error('Email sending is disabled. Cannot send low stock alert.');
    return false;
  }
  const subject = 'Low Stock Alert - eKahera';
  const productList = lowStockProducts.map(p => `<li>${p.product_name} (Stock: ${p.quantity_in_stock})</li>`).join('');
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Low Stock Alert</h2>
      <p>The following products are running low on stock:</p>
      <ul>
        ${productList}
      </ul>
      <p>Please update your inventory as soon as possible.</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>',
      to: recipientEmail,
      subject: subject,
      html: message,
    });
    await logEmailNotification(recipientEmail, subject, message, 'low_stock_alert');
    console.log('Low stock alert sent to:', recipientEmail);
    return true;
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    return false;
  }
};

const sendOTPNotification = async (recipientEmail, otp) => {
  if (!resend) {
    console.error('Email sending is disabled. Cannot send OTP.');
    return false;
  }
  
  const subject = 'eKahera - Email Verification OTP';
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">eKahera</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #666; text-align: center; font-size: 16px;">
          Your 4-character verification code is:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 10px; border: 2px solid #667eea;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
          </div>
        </div>
        <p style="color: #666; text-align: center; font-size: 14px;">
          This code will expire in 5 minutes.<br>
          If you didn't request this code, please ignore this email.
        </p>
      </div>
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: white; margin: 0; font-size: 12px;">
          © 2024 eKahera. All rights reserved.
        </p>
      </div>
    </div>`;

  try {
    await resend.emails.send({
      from: 'eKahera <noreply@ekahera.online>',
      to: recipientEmail,
      subject: subject,
      html: message,
    });
    
    console.log(`OTP sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    if (error.statusCode === 429) {
      console.log('Rate limited, retrying after delay...');
      await delay(1000);
      return sendOTPNotification(recipientEmail, otp);
    }
    return false;
  }
};

// ... (rest of the code remains the same)

module.exports = {
  sendNewApplicationNotification,
  sendVerificationStatusNotification,
  sendApplicationSubmittedNotification,
  sendVerificationApprovalEmail,
  sendVerificationRejectionEmail,
  sendLowStockEmail,
  logEmailNotification,
  sendOTPNotification
};
