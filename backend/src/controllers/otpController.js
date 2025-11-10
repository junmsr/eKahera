const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
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

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: true, // use 'true' for port 465, 'false' for all other ports
    auth: {
      user: config.EMAIL_USER || 'your-email@gmail.com',
      pass: config.EMAIL_PASSWORD || 'your-app-password'
    },
  });
};

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Generate 4-character alphanumeric OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      alphabets: true,
      upperCase: true,
      specialChars: false
    });

    // Store OTP with expiration (5 minutes)
    const expirationTime = Date.now() + (5 * 60 * 1000); // 5 minutes
    otpStorage.set(email, {
      otp,
      expirationTime,
      attempts: 0
    });

    // Create email transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: config.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'eKahera - Email Verification OTP',
      html: `
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
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'OTP sent successfully',
      email: email
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const storedOTPData = otpStorage.get(email);

    if (!storedOTPData) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTPData.expirationTime) {
      otpStorage.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check if too many attempts
    if (storedOTPData.attempts >= 3) {
      otpStorage.delete(email);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedOTPData.otp === otp) {
      // OTP is correct - remove it from storage
      otpStorage.delete(email);
      
      res.json({ 
        message: 'OTP verified successfully',
        verified: true
      });
    } else {
      // Increment attempts
      storedOTPData.attempts += 1;
      otpStorage.set(email, storedOTPData);

      res.status(400).json({ 
        error: 'Invalid OTP. Please try again.',
        attemptsLeft: 3 - storedOTPData.attempts
      });
    }

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Remove existing OTP if any
    otpStorage.delete(email);

    // Generate new 4-character alphanumeric OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      alphabets: true,
      upperCase: true,
      specialChars: false
    });

    // Store new OTP with expiration (5 minutes)
    const expirationTime = Date.now() + (5 * 60 * 1000);
    otpStorage.set(email, {
      otp,
      expirationTime,
      attempts: 0
    });

    // Create email transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: config.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'eKahera - New Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">eKahera</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; text-align: center;">New Verification Code</h2>
            <p style="color: #666; text-align: center; font-size: 16px;">
              Your new 4-character verification code is:
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
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'New OTP sent successfully',
      email: email
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to send new OTP. Please try again.' });
  }
};
