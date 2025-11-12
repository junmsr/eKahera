const otpGenerator = require('otp-generator');
const { sendOTPNotification } = require('../utils/emailService');

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

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

    // Send email using the new email service
    const emailSent = await sendOTPNotification(email, otp);

    if (!emailSent) {
      throw new Error('Failed to send OTP email');
    }

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

    // Send email using the new email service
    const emailSent = await sendOTPNotification(email, otp);

    if (!emailSent) {
      throw new Error('Failed to send new OTP email');
    }

    res.json({ 
      message: 'New OTP sent successfully',
      email: email
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to send new OTP. Please try again.' });
  }
};
