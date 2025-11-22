const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

console.log('\n--- dotenv parsed (process.env) ---');
console.log({
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
});

console.log('\n--- manual parse (like src/config/database.js) ---');
const configPath = path.join(__dirname, '..', 'config.env');
const content = fs.readFileSync(configPath, 'utf8');
const manual = {};
content.split('\n').forEach(line => {
  const parts = line.split('=');
  const key = parts[0];
  const value = parts[1];
  if (key && value && !key.startsWith('#')) {
    manual[key.trim()] = value.trim();
  }
});

console.log(manual);

// Also show any obvious suspicious keys whose value is short (possible truncation)
console.log('\n--- suspicious manual entries (short values) ---');
Object.entries(manual).forEach(([k,v]) => {
  if (typeof v === 'string' && v.length < 10) console.log(k, '=>', v);
});

console.log('\nDiagnosis script complete.');
