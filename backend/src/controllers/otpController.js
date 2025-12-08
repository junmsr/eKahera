const otpGenerator = require('otp-generator');
const { sendOTPNotification, sendPasswordResetOTP } = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

// File-based storage for OTPs (persists across server restarts)
const otpStorageFile = path.join(__dirname, '../../otp-storage.json');
const DEFAULT_PURPOSE = 'general';
const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const OTP_ATTEMPT_LIMIT = 5;

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const buildKey = (email, purpose = DEFAULT_PURPOSE) => `${purpose}:${normalizeEmail(email)}`;
// Support legacy keys that did not include a purpose
const buildLegacyKey = (email) => normalizeEmail(email);

// Helper function to load OTP storage from file
const loadOTPStorage = () => {
  try {
    if (fs.existsSync(otpStorageFile)) {
      const data = fs.readFileSync(otpStorageFile, 'utf8');
      const parsed = JSON.parse(data);
      // Convert back to Map (expirationTime stored as number/timestamp)
      const map = new Map();
      for (const [key, value] of Object.entries(parsed)) {
        map.set(key, {
          ...value,
          expirationTime: value.expirationTime, // Keep as number
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
        expirationTime: value.expirationTime, // Save as number/timestamp
      };
    }
    fs.writeFileSync(otpStorageFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving OTP storage:', error);
  }
};

const otpStorage = loadOTPStorage();

const getEmailSender = (purpose = DEFAULT_PURPOSE) =>
  purpose === 'password_reset' ? sendPasswordResetOTP : sendOTPNotification;

const persistOTP = (key, data) => {
  otpStorage.set(key, data);
  saveOTPStorage(otpStorage);
};

const deleteOTP = (key) => {
  otpStorage.delete(key);
  saveOTPStorage(otpStorage);
};

const createOTPEntry = (email, purpose = DEFAULT_PURPOSE) => {
  const key = buildKey(email, purpose);
  const otp = otpGenerator.generate(4, {
    digits: true,
    alphabets: true,
    upperCase: true,
    specialChars: false,
  });
  const expirationTime = Date.now() + OTP_EXPIRATION_MS;

  // Remove any legacy entry for this email to avoid conflicts
  otpStorage.delete(buildLegacyKey(email));

  persistOTP(key, {
    otp,
    expirationTime,
    attempts: 0,
    purpose,
  });

  return { key, otp, expirationTime };
};

const findStoredOTP = (email, purpose = DEFAULT_PURPOSE) => {
  const key = buildKey(email, purpose);
  const legacyKey = buildLegacyKey(email);
  return {
    key,
    legacyKey,
    value: otpStorage.get(key) || otpStorage.get(legacyKey),
  };
};

const verifyOTPCode = (email, otp, purpose = DEFAULT_PURPOSE) => {
  const normalizedEmail = normalizeEmail(email);
  const { key, legacyKey, value } = findStoredOTP(normalizedEmail, purpose);

  if (!value) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  const isExpired = Date.now() > value.expirationTime;
  if (isExpired) {
    deleteOTP(key);
    deleteOTP(legacyKey);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (value.attempts >= OTP_ATTEMPT_LIMIT) {
    deleteOTP(key);
    deleteOTP(legacyKey);
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  if (value.otp.toUpperCase() !== otp.toUpperCase()) {
    value.attempts += 1;
    persistOTP(key, value);
    return {
      valid: false,
      message: 'Invalid OTP. Please try again.',
      attemptsLeft: OTP_ATTEMPT_LIMIT - value.attempts,
    };
  }

  // Successful verification - clean up
  deleteOTP(key);
  deleteOTP(legacyKey);
  return { valid: true };
};

const generateAndSendOTP = async (email, purpose = DEFAULT_PURPOSE) => {
  const normalizedEmail = normalizeEmail(email);
  const { key, otp, expirationTime } = createOTPEntry(normalizedEmail, purpose);

  const emailSender = getEmailSender(purpose);
  const emailSent = await emailSender(email, otp);

  if (!emailSent) {
    deleteOTP(key);
    throw new Error('Failed to send OTP email');
  }

  return { otp, expirationTime };
};

// Generate and send OTP via API
exports.sendOTP = async (req, res) => {
  const { email, purpose = DEFAULT_PURPOSE } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    await generateAndSendOTP(email, purpose || DEFAULT_PURPOSE);
    res.json({
      message: 'OTP sent successfully',
      email,
      purpose: purpose || DEFAULT_PURPOSE,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP via API
exports.verifyOTP = async (req, res) => {
  const { email, otp, purpose = DEFAULT_PURPOSE } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const result = verifyOTPCode(email, otp, purpose || DEFAULT_PURPOSE);
    if (!result.valid) {
      return res.status(400).json({
        error: result.message,
        attemptsLeft: result.attemptsLeft,
      });
    }

    res.json({
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};

// Resend OTP via API
exports.resendOTP = async (req, res) => {
  const { email, purpose = DEFAULT_PURPOSE } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Remove any existing OTP before generating a new one
    const { key, legacyKey } = findStoredOTP(email, purpose || DEFAULT_PURPOSE);
    deleteOTP(key);
    deleteOTP(legacyKey);

    await generateAndSendOTP(email, purpose || DEFAULT_PURPOSE);

    res.json({
      message: 'New OTP sent successfully',
      email,
      purpose: purpose || DEFAULT_PURPOSE,
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to send new OTP. Please try again.' });
  }
};

// Helper exports for other controllers
exports.generateOTPForPurpose = generateAndSendOTP;
exports.validateOTPForPurpose = verifyOTPCode;
