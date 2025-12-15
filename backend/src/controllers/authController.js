const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { logAction } = require('../utils/logger');
const { hasRequiredDocuments } = require('./businessController');
const { sendOTP, generateOTPForPurpose, validateOTPForPurpose } = require('./otpController');
const { sendApplicationSubmittedNotification } = require('../utils/emailService');

const config = {
  JWT_SECRET: process.env.JWT_SECRET,
};

const validatePasswordStrength = (password) => {
  if (!password || password.length < 12) {
    return 'Password must be at least 12 characters long';
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }

  return null;
};

exports.register = async (req, res) => {
  const {
    username,
    first_name,
    last_name,
    email,
    password,
    role,
    business_id,
  } = req.body;
  if (!username || !first_name || !last_name || !email || !password) {
    return res
      .status(400)
      .json({
        error:
          "Username, first name, last name, email and password are required",
      });
  }

  // Strong password validation
  if (password.length < 12) {
    return res.status(400).json({
      error: "Password must be at least 12 characters long",
    });
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    });
  }

  try {
    // Check if email or username already exists
    const existingEmail = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (existingEmail.rowCount > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const existingUsername = await pool.query(
      "SELECT 1 FROM users WHERE username = $1",
      [username]
    );
    if (existingUsername.rowCount > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    // Map requested role to user_type_id (admin/cashier/customer). Default to customer
    const desiredRole = (role || "customer").toLowerCase();
    const roleRes = await pool.query(
      "SELECT user_type_id, user_type_name FROM user_type WHERE lower(user_type_name) = $1",
      [desiredRole]
    );
    const userTypeId = roleRes.rowCount ? roleRes.rows[0].user_type_id : null;

    const result = await pool.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role, user_type_id, business_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING user_id, username, first_name, last_name, email, role, user_type_id, business_id`,
      [
        username,
        first_name,
        last_name,
        email,
        hashedPassword,
        desiredRole,
        userTypeId,
        business_id || null,
      ]
    );
    const newUser = result.rows[0];
    logAction({
      userId: newUser.user_id,
      businessId: newUser.business_id,
      action: `User registered: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`,
    });

    // Send OTP email
    try {
      const mockReq = { body: { email: newUser.email } };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(
              `OTP email sent to ${newUser.email} with status ${code} and data:`,
              data
            );
          },
        }),
      };
      await sendOTP(mockReq, mockRes);
    } catch (otpError) {
      console.error(`Failed to send OTP to ${newUser.email}:`, otpError);
      // We don't want to fail the registration if the OTP fails to send
    }

    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check if username or email already exists
exports.checkExistingUser = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({ error: "Email or username is required" });
    }

    let exists = false;
    let field = null;
    let message = "";

    // Check if email exists in users or business tables
    if (email) {
      const existingUser = await pool.query(
        "SELECT 1 FROM users WHERE lower(email) = lower($1)",
        [email]
      );
      const existingBusiness = await pool.query(
        "SELECT 1 FROM business WHERE lower(email) = lower($1)",
        [email]
      );

      if (existingUser.rowCount > 0 || existingBusiness.rowCount > 0) {
        exists = true;
        field = "email";
        message = "This email is already registered";
      }
    }

    // Check if username exists (only if email wasn't found)
    if (!exists && username) {
      const existingUsername = await pool.query(
        "SELECT 1 FROM users WHERE lower(username) = lower($1)",
        [username]
      );

      if (existingUsername.rowCount > 0) {
        exists = true;
        field = "username";
        message = "This username is already taken";
      }
    }

    res.status(200).json({
      exists,
      field,
      message: exists ? message : "No existing user found",
    });
  } catch (err) {
    console.error("Check existing user error:", err);
    res.status(500).json({
      error: "Failed to check user availability",
      details: err.message,
    });
  }
};

// Check username availability
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username already exists
    const existing = await pool.query(
      "SELECT 1 FROM users WHERE username = $1",
      [username]
    );

    res.json({
      available: existing.rowCount === 0,
      message:
        existing.rowCount > 0
          ? "Username already exists"
          : "Username is available",
    });
  } catch (err) {
    console.error("Check username error:", err);
    res.status(500).json({ error: "Failed to check username availability" });
  }
};

// Check email availability
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email already exists in users or business tables
    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    const existingBusiness = await pool.query(
      "SELECT 1 FROM business WHERE email = $1",
      [email]
    );

    const isAvailable =
      existingUser.rowCount === 0 && existingBusiness.rowCount === 0;

    res.json({
      available: isAvailable,
      message: !isAvailable ? "Email already exists" : "Email is available",
    });
  } catch (err) {
    console.error("Check email error:", err);
    res.status(500).json({ error: "Failed to check email availability" });
  }
};

exports.login = async (req, res) => {
  // Only log in development to avoid performance impact in production
  if (process.env.NODE_ENV !== 'production') {
    console.log("Login attempt:", req.body);
  }
  const { email, password } = req.body; // email field can contain either email or username
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email/Username and password are required" });
  }

  try {
    // Normalize input for case-insensitive search
    const normalizedEmail = email.trim().toLowerCase();
    
    // Optimized query: Try to find user by email or username first (most common cases)
    // This avoids the expensive business_name search unless needed
    let result = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.contact_number,
              u.user_type_id,
              u.business_id AS business_id,
              ut.user_type_name,
              b.business_name AS store_name,
              b.verification_status
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       LEFT JOIN business b ON b.business_id = u.business_id
       WHERE lower(u.email) = $1 OR lower(u.username) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    // If not found by email/username, try business name (less common, more expensive)
    if (result.rowCount === 0) {
      result = await pool.query(
        `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.contact_number,
                u.user_type_id,
                u.business_id AS business_id,
                ut.user_type_name,
                b.business_name AS store_name,
                b.verification_status
         FROM users u
         LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
         LEFT JOIN business b ON b.business_id = u.business_id
         WHERE lower(b.business_name) = $1
         ORDER BY
           CASE
             WHEN lower(ut.user_type_name) = 'admin' THEN 1
             WHEN lower(ut.user_type_name) = 'business_owner' THEN 2
             ELSE 3
           END
         LIMIT 1`,
        [normalizedEmail]
      );
    }

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";

    // Check business verification status if user belongs to a business
    // (verification_status is now included in the query above, so no extra query needed)
    if (user.business_id && user.verification_status && user.verification_status !== "approved") {
      return res.status(403).json({
        error:
          "Your business application is still under review. Please wait for approval before logging in.",
      });
    }

    // Check if password_hash exists and verify it
    if (!user.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Prefer normalized role from user_type
    const roleName = (
      user.user_type_name ||
      user.role ||
      "customer"
    ).toLowerCase();

    // Generate JWT token
    const tokenPayload = {
      userId: user.user_id,
      role: roleName,
      username: user.username,
      email: user.email,
      businessId: user.business_id ? parseInt(user.business_id, 10) : null,
    };

    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log("Creating JWT token with payload:", tokenPayload);
    }

    const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    const response = {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        role: roleName,
        contact_number: user.contact_number,
        businessId: user.business_id || null,
        store_name: user.store_name || null,
      },
    };

    // Return response immediately, log action asynchronously (non-blocking)
    res.json(response);
    
    // Log login action asynchronously (fire-and-forget, doesn't block response)
    logAction({
      userId: user.user_id,
      businessId: user.business_id || null,
      action: "Login",
    }).catch(err => {
      // Silently fail logging - don't affect user experience
      console.error('Failed to log login action:', err);
    });
  } catch (err) {
    console.error("Login error:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// Check if email exists for password reset (explicit validation)
exports.checkPasswordResetEmail = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await pool.query(
      'SELECT user_id FROM users WHERE lower(email) = lower($1)',
      [normalizedEmail]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    return res.json({ exists: true });
  } catch (err) {
    console.error('Password reset email check error:', err);
    return res.status(500).json({ error: 'Failed to check email.' });
  }
};

// Request password reset - requires prior existence check
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userResult = await pool.query(
      'SELECT user_id, business_id FROM users WHERE lower(email) = lower($1)',
      [normalizedEmail]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    await generateOTPForPurpose(email, 'password_reset');
    logAction({
      userId: userResult.rows[0].user_id,
      businessId: userResult.rows[0].business_id || null,
      action: 'Password reset requested',
    });

    return res.json({
      message: 'Reset code sent to the email.',
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

// Reset password using OTP
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body || {};

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userResult = await pool.query(
      'SELECT user_id, business_id FROM users WHERE lower(email) = lower($1)',
      [normalizedEmail]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid reset request. Please request a new code.' });
    }

    const otpResult = validateOTPForPurpose(email, otp, 'password_reset');
    if (!otpResult.valid) {
      return res.status(400).json({
        error: otpResult.message || 'Invalid or expired OTP.',
        attemptsLeft: otpResult.attemptsLeft,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
      [hashedPassword, userResult.rows[0].user_id]
    );

    logAction({
      userId: userResult.rows[0].user_id,
      businessId: userResult.rows[0].business_id || null,
      action: 'Password reset successful',
    });

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

// Check if initial setup is needed (no superadmin exists)
exports.checkSetupStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 1 FROM users u
       JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE lower(ut.user_type_name) = 'superadmin' LIMIT 1`
    );

    const needsSetup = result.rowCount === 0;
    res.json({ needsSetup });
  } catch (err) {
    console.error("Setup status check error:", err);
    res.status(500).json({ error: "Failed to check setup status" });
  }
};

// Create initial superadmin (only if no superadmin exists)
exports.createInitialSuperAdmin = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      error: "Name, email, password, and password confirmation are required",
    });
  }

  // Split name into first_name and last_name (or use name as first_name if no space)
  const nameParts = name.trim().split(/\s+/);
  const first_name = nameParts[0] || name;
  const last_name = nameParts.slice(1).join(" ") || name;
  const username =
    name.toLowerCase().replace(/\s+/g, "") || `superadmin_${Date.now()}`;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  // Strong password validation
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long",
    });
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address" });
  }

  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await pool.query(
      `SELECT 1 FROM users u
       JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE lower(ut.user_type_name) = 'superadmin' LIMIT 1`
    );

    if (existingSuperAdmin.rowCount > 0) {
      return res.status(403).json({
        error:
          "Initial setup has already been completed. SuperAdmin already exists.",
      });
    }

    // Check if email is already taken
    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Email address is already registered" });
    }

    // Hash password with high salt rounds for superadmin
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get superadmin user_type_id
    const superAdminTypeRes = await pool.query(
      "SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1",
      ["superadmin"]
    );

    const superAdminTypeId = superAdminTypeRes.rows[0]?.user_type_id || 1; // Default to 1 if not found

    // Create superadmin user
    const result = await pool.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role, user_type_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'superadmin', $6, NOW(), NOW())
       RETURNING user_id, username, first_name, last_name, email, role, created_at`,
      [username, first_name, last_name, email, hashedPassword, superAdminTypeId]
    );

    const newSuperAdmin = result.rows[0];

    // Log the creation
    logAction({
      userId: newSuperAdmin.user_id,
      businessId: null,
      action: "Initial SuperAdmin Created",
    });

    console.log("Initial SuperAdmin created:", {
      user_id: newSuperAdmin.user_id,
      email: newSuperAdmin.email,
      username: newSuperAdmin.username,
      first_name: newSuperAdmin.first_name,
      last_name: newSuperAdmin.last_name,
    });

    res.status(201).json({
      message: "Initial SuperAdmin created successfully",
      user: {
        user_id: newSuperAdmin.user_id,
        username: newSuperAdmin.username,
        first_name: newSuperAdmin.first_name,
        last_name: newSuperAdmin.last_name,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
        created_at: newSuperAdmin.created_at,
      },
    });
  } catch (err) {
    console.error("SuperAdmin creation error:", err);
    res
      .status(500)
      .json({ error: "Failed to create SuperAdmin. Please try again." });
  }
};

// Create superadmin invitation (only existing superadmins can do this)
exports.inviteSuperAdmin = async (req, res) => {
  const { email, name } = req.body;

  // Validation
  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address" });
  }

  try {
    // Check if email is already registered
    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Email address is already registered" });
    }

    // Generate a secure invitation token
    const invitationToken = require("crypto").randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store invitation in database (you might want to create an invitations table)
    // For now, we'll create a temporary user record with a special status
    const tempPassword = require("crypto").randomBytes(16).toString("hex");
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

    const superAdminTypeRes = await pool.query(
      "SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1",
      ["superadmin"]
    );
    const superAdminTypeId = superAdminTypeRes.rows[0]?.user_type_id || 1;

    // Create pending superadmin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, user_type_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'superadmin_pending', $4, NOW(), NOW())
       RETURNING user_id, username, email`,
      [`pending_${Date.now()}`, email, hashedTempPassword, superAdminTypeId]
    );

    const pendingUser = result.rows[0];

    // Log the invitation
    logAction({
      userId: req.user.userId,
      businessId: null,
      action: `SuperAdmin invitation sent to ${email}`,
    });

    // In a real application, you would send an email here
    console.log("SuperAdmin invitation created:", {
      invitedBy: req.user.email,
      invitedUser: email,
      invitationToken,
      expiresAt,
    });

    res.status(201).json({
      message: "SuperAdmin invitation created successfully",
      invitation: {
        email: pendingUser.email,
        username: pendingUser.username,
        token: invitationToken,
        expiresAt,
        setupUrl: `${req.protocol}://${req.get(
          "host"
        )}/setup/invite?token=${invitationToken}`,
      },
    });
  } catch (err) {
    console.error("SuperAdmin invitation error:", err);
    res
      .status(500)
      .json({ error: "Failed to create invitation. Please try again." });
  }
};

// Small helper to safely derive readable location fields from the stored business_address
// Format stored during Get Started: "<house>, <barangay>, <city>, <province>, Philippines"
const parseBusinessAddress = (addressString = "") => {
  const parts = addressString
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) {
    return {
      houseOrStreet: null,
      barangay: null,
      city: null,
      province: null,
      address_line: null,
    };
  }

  // Remove trailing country if present (e.g., "Philippines")
  while (parts.length && /philippines?/i.test(parts[parts.length - 1])) {
    parts.pop();
  }

  const len = parts.length;
  // Expected order after trimming country: <house/street>, <barangay>, <city>, <province>
  const province = len >= 1 ? parts[len - 1] ?? null : null;
  const city = len >= 2 ? parts[len - 2] ?? null : null;
  const barangay = len >= 3 ? parts[len - 3] ?? null : null;
  const houseOrStreet =
    len > 3 ? parts.slice(0, len - 3).join(", ") : parts[0] || null;

  return {
    houseOrStreet,
    barangay,
    city,
    province,
    address_line: addressString || null,
  };
};

// Get user profile with business information
exports.getProfile = async (req, res) => {
  try {
    console.log("Profile request received for user:", req.user);
    const userId = req.user.userId;
    console.log("Fetching profile for userId:", userId);

    // Get user information with business details
    const userResult = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.role, u.contact_number,
              u.created_at, u.updated_at, u.business_id,
              ut.user_type_name
       FROM users u
       LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
       WHERE u.user_id = $1`,
      [userId]
    );

    console.log("User query result:", userResult.rows);

    if (userResult.rowCount === 0) {
      console.log("No user found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userResult.rows[0];
    const firstName = userData.first_name || "";
    const lastName = userData.last_name || "";

    console.log("User data found:", userData);
    let businessData = null;
    let businessUsers = [];

    // If user has a business, get complete business information
    if (userData.business_id) {
      console.log(
        "Fetching business data for business_id:",
        userData.business_id
      );
      // Get business details
      const businessResult = await pool.query(
        `SELECT business_id, business_name, business_type, region,
                business_address, house_number, mobile, email,
                created_at, updated_at
         FROM business 
         WHERE business_id = $1`,
        [userData.business_id]
      );

      console.log("Business query result:", businessResult.rows);

      if (businessResult.rowCount > 0) {
        businessData = businessResult.rows[0];
        console.log("Business data found:", businessData);

        // Get all users associated with this business
        const usersResult = await pool.query(
          `SELECT u.user_id, u.username, u.email, u.role, u.contact_number,
                  u.created_at, u.first_name, u.last_name, ut.user_type_name
           FROM users u
           LEFT JOIN user_type ut ON ut.user_type_id = u.user_type_id
           WHERE u.business_id = $1
           ORDER BY u.created_at`,
          [userData.business_id]
        );

        businessUsers = usersResult.rows;
      }
    }

    // Normalize business data to expose location parts captured during setup
    const normalizedBusiness = businessData
      ? (() => {
          const parsedAddress = parseBusinessAddress(
            businessData.business_address || ""
          );
          return {
            business_id: businessData.business_id,
            business_name: businessData.business_name,
            business_type: businessData.business_type,
            region: businessData.region,
            business_address: businessData.business_address,
            address_line: parsedAddress.address_line,
            house_number:
              businessData.house_number || parsedAddress.houseOrStreet || null,
            mobile: businessData.mobile,
            email: businessData.email,
            province:
              businessData.province ||
              businessData.province_name ||
              businessData.provinceName ||
              parsedAddress.province ||
              null,
            city:
              businessData.city ||
              businessData.city_name ||
              businessData.cityName ||
              parsedAddress.city ||
              null,
            barangay:
              businessData.barangay ||
              businessData.barangay_name ||
              businessData.barangayName ||
              parsedAddress.barangay ||
              null,
            created_at: businessData.created_at,
            updated_at: businessData.updated_at,
            total_users: businessUsers.length,
            users: businessUsers,
          };
        })()
      : null;

    const response = {
      user: {
        user_id: userData.user_id,
        username: userData.username,
        first_name: firstName,
        last_name: lastName,
        email: userData.email,
        role: userData.user_type_name || userData.role,
        contact_number: userData.contact_number,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        business_id: userData.business_id,
      },
      business: normalizedBusiness,
    };

    console.log("Sending profile response:", JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to get profile information" });
  }
};

/**
 * Allow an authenticated user to update their password.
 */
exports.updatePassword = async (req, res) => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body || {};

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return res.status(400).json({ error: strengthError });
  }

  try {
    // Get user info including business_id for logging
    const userRes = await pool.query(
      'SELECT password_hash, business_id, username, email, role FROM users WHERE user_id = $1',
      [userId]
    );
    if (!userRes.rowCount) return res.status(404).json({ error: 'User not found' });

    const user = userRes.rows[0];
    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2', [hashed, userId]);
    
    // Log the password change action with business_id if available
    const businessId = user.business_id || null;
    const userRole = user.role || 'user';
    const userName = user.username || user.email || `User ${userId}`;
    const actionMessage = `${userRole === 'cashier' ? 'Cashier' : userRole === 'admin' ? 'Admin' : 'User'} "${userName}" changed password`;
    
    // Debug: Log user info to verify business_id is present
    console.log(`[Password Change] User ${userId} (${userRole}): business_id = ${businessId}, username = ${userName}`);
    
    // Log the action - will skip if businessId is null (for superadmins)
    // Using await to ensure the log is written before response is sent
    await logAction({
      userId,
      businessId,
      action: actionMessage
    });
    
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Failed to update password', err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
};

/**
 * Allow an authenticated user to update their profile information.
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user?.userId;
  const { first_name, last_name, email, contact_number } = req.body || {};

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Validate that at least one field is provided
  if (!first_name && !last_name && !email && !contact_number) {
    return res.status(400).json({ error: 'At least one field must be provided to update' });
  }

  try {
    // Get user info including business_id for logging
    const userRes = await pool.query(
      'SELECT business_id, username, email, role FROM users WHERE user_id = $1',
      [userId]
    );
    if (!userRes.rowCount) return res.status(404).json({ error: 'User not found' });

    const user = userRes.rows[0];
    const businessId = user.business_id || null;

    // Build update query dynamically
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      queryParams.push(first_name.trim());
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      queryParams.push(last_name.trim());
    }
    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailCheck = await pool.query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
        [email, userId]
      );
      if (emailCheck.rowCount > 0) {
        return res.status(409).json({ error: 'Email is already in use by another account' });
      }
      updateFields.push(`email = $${paramIndex++}`);
      queryParams.push(email.trim());
    }
    if (contact_number !== undefined) {
      updateFields.push(`contact_number = $${paramIndex++}`);
      queryParams.push(contact_number ? contact_number.trim() : null);
    }

    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    queryParams.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, username, first_name, last_name, email, contact_number, updated_at
    `;

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];
    
    // Log the action
    const userName = updatedUser.username || updatedUser.email || `User ${userId}`;
    const actionMessage = `Updated profile information: ${userName}`;
    
    await logAction({
      userId,
      businessId,
      action: actionMessage
    });

    return res.json({
      message: 'Profile updated successfully',
      user: {
        user_id: updatedUser.user_id,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        contact_number: updatedUser.contact_number,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (err) {
    console.error('Failed to update profile', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};