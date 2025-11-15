const otpGenerator = require('otp-generator');
const { sendOTPNotification } = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

// File-based storage for OTPs (persists across server restarts)
const otpStorageFile = path.join(__dirname, '../../otp-storage.json');

// Helper function to load OTP storage from file
const loadOTPStorage = () => {
  try {
    if (fs.existsSync(otpStorageFile)) {
      const data = fs.readFileSync(otpStorageFile, 'utf8');
      const parsed = JSON.parse(data);
      // Convert back to Map and restore Date objects
      const map = new Map();
      for (const [key, value] of Object.entries(parsed)) {
        map.set(key, {
          ...value,
          expirationTime: new Date(value.expirationTime)
        });
      }
      return map;
    }
  } catch (error) {
    console.error('Error loading OTP storage:', error);
  }
  return new Map();
};

// Helper function to save OTP storage to file
const saveOTPStorage = (storage) => {
  try {
    const data = {};
    for (const [key, value] of storage.entries()) {
      data[key] = {
        ...value,
        expirationTime: value.expirationTime.toISOString()
      };
    }
    fs.writeFileSync(otpStorageFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving OTP storage:', error);
  }
};

// Load initial storage
const otpStorage = loadOTPStorage();

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Generate 4-character alphanumeric OTP
    console.log(`[sendOTP] Generating OTP for email: ${normalizedEmail}`);
    const otp = otpGenerator.generate(4, {
      digits: true,
      alphabets: true,
      upperCase: true,
      specialChars: false
    });
    console.log(`[sendOTP] Generated OTP: ${otp}`);

    // Store OTP with expiration (5 minutes)
    const expirationTime = Date.now() + (5 * 60 * 1000); // 5 minutes
    otpStorage.set(normalizedEmail, {
      otp,
      expirationTime,
      attempts: 0
    });
    saveOTPStorage(otpStorage); // Persist to file
    console.log(`[sendOTP] Stored OTP for ${normalizedEmail}: ${otpStorage.get(normalizedEmail).otp}, expires: ${new Date(expirationTime).toLocaleTimeString()}`);

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
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[verifyOTP] Received verification request for email: ${normalizedEmail}, OTP: ${otp}`);

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const storedOTPData = otpStorage.get(normalizedEmail);
    console.log(`[verifyOTP] Stored OTP data for ${normalizedEmail}:`, storedOTPData ? storedOTPData.otp : 'Not found');

    if (!storedOTPData) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTPData.expirationTime) {
      console.log(`[verifyOTP] OTP for ${normalizedEmail} expired. Current time: ${new Date().toLocaleTimeString()}, Expiration time: ${new Date(storedOTPData.expirationTime).toLocaleTimeString()}`);
      otpStorage.delete(normalizedEmail);
      saveOTPStorage(otpStorage); // Persist changes
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check if too many attempts
    if (storedOTPData.attempts >= 5) {
      console.log(`[verifyOTP] Too many failed attempts for ${normalizedEmail}.`);
      otpStorage.delete(normalizedEmail);
      saveOTPStorage(otpStorage); // Persist changes
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedOTPData.otp === otp) {
      console.log(`[verifyOTP] OTP for ${normalizedEmail} matched!`);
      // OTP is correct - remove it from storage
      otpStorage.delete(normalizedEmail);
      saveOTPStorage(otpStorage); // Persist changes

      res.json({
        message: 'OTP verified successfully',
        verified: true
      });
    } else {
      console.log(`[verifyOTP] OTP for ${normalizedEmail} did NOT match. Stored: ${storedOTPData.otp}, Received: ${otp}`);
      // Increment attempts
      storedOTPData.attempts += 1;
      otpStorage.set(normalizedEmail, storedOTPData);
      saveOTPStorage(otpStorage); // Persist changes

      res.status(400).json({
        error: 'Invalid OTP. Please try again.',
        attemptsLeft: 5 - storedOTPData.attempts
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

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Remove existing OTP if any
    otpStorage.delete(normalizedEmail);
    saveOTPStorage(otpStorage); // Persist deletion

    // Generate new 4-character alphanumeric OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      alphabets: true,
      upperCase: true,
      specialChars: false
    });

    // Store new OTP with expiration (5 minutes)
    const expirationTime = Date.now() + (5 * 60 * 1000);
    otpStorage.set(normalizedEmail, {
      otp,
      expirationTime,
      attempts: 0
    });
    saveOTPStorage(otpStorage); // Persist new OTP

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
