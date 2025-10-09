#!/usr/bin/env node

const readline = require('readline');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load config from config.env file
const configPath = path.join(__dirname, '..', 'config.env');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = {};

configContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    config[key.trim()] = value.trim();
  }
});

// Database connection
const { Pool } = require('pg');
const pool = new Pool({
  host: config.DB_HOST || 'localhost',
  port: config.DB_PORT || 5432,
  database: config.DB_NAME,
  user: config.DB_USER || 'postgres',
  password: config.DB_PASSWORD,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    process.stdin.on('data', function(char) {
      if (char === '\u0003') { // Ctrl+C
        process.exit();
      } else if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '\u007f') { // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        input += char;
        process.stdout.write('*');
      }
    });
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
  if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
  if (!hasNumbers) return 'Password must contain at least one number';
  if (!hasSpecialChar) return 'Password must contain at least one special character';
  
  return null;
}

async function createSuperAdmin() {
  console.log('\n🔐 eKahera SuperAdmin Creation Tool');
  console.log('=====================================\n');

  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await pool.query(
      'SELECT email FROM users WHERE role = $1',
      ['superadmin']
    );

    if (existingSuperAdmin.rowCount > 0) {
      console.log('⚠️  SuperAdmin already exists:');
      existingSuperAdmin.rows.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email}`);
      });
      
      const proceed = await question('\nDo you want to create another SuperAdmin? (y/N): ');
      if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
        console.log('Operation cancelled.');
        process.exit(0);
      }
    }

    // Get user input
    let name, email, password, confirmPassword;

    // Name
    do {
      name = await question('Full Name: ');
      if (!name.trim()) {
        console.log('❌ Name is required');
      }
    } while (!name.trim());

    // Email
    do {
      email = await question('Email Address: ');
      if (!email.trim()) {
        console.log('❌ Email is required');
      } else if (!validateEmail(email)) {
        console.log('❌ Please enter a valid email address');
        email = '';
      } else {
        // Check if email already exists
        const existingUser = await pool.query(
          'SELECT 1 FROM users WHERE email = $1',
          [email]
        );
        if (existingUser.rowCount > 0) {
          console.log('❌ Email address is already registered');
          email = '';
        }
      }
    } while (!email);

    // Password
    do {
      password = await questionHidden('Password: ');
      const passwordError = validatePassword(password);
      if (passwordError) {
        console.log(`❌ ${passwordError}`);
        password = '';
      }
    } while (!password);

    // Confirm Password
    do {
      confirmPassword = await questionHidden('Confirm Password: ');
      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match');
        confirmPassword = '';
      }
    } while (!confirmPassword);

    console.log('\n📝 Creating SuperAdmin account...');

    // Hash password with high salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get superadmin user_type_id
    const superAdminTypeRes = await pool.query(
      'SELECT user_type_id FROM user_type WHERE lower(user_type_name) = $1',
      ['superadmin']
    );

    const superAdminTypeId = superAdminTypeRes.rows[0]?.user_type_id || 1;

    // Create superadmin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, user_type_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'superadmin', $4, NOW(), NOW())
       RETURNING user_id, username, email, created_at`,
      [name.trim(), email, hashedPassword, superAdminTypeId]
    );

    const newSuperAdmin = result.rows[0];

    console.log('\n✅ SuperAdmin created successfully!');
    console.log('=====================================');
    console.log(`User ID: ${newSuperAdmin.user_id}`);
    console.log(`Username: ${newSuperAdmin.username}`);
    console.log(`Email: ${newSuperAdmin.email}`);
    console.log(`Created: ${newSuperAdmin.created_at}`);
    console.log('\n🔗 You can now login at: http://localhost:3000/login?role=admin');

  } catch (error) {
    console.error('\n❌ Error creating SuperAdmin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔐 eKahera SuperAdmin Creation Tool

Usage:
  node scripts/create-superadmin.js

This interactive script will guide you through creating a SuperAdmin account.

Requirements:
  - Name (required)
  - Email (required, must be unique)
  - Password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)

Options:
  --help, -h    Show this help message
  `);
  process.exit(0);
}

// Run the script
createSuperAdmin().catch(console.error);
