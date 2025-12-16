const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');

// Submit contact form
router.post('/submit', submitContactForm);

// Debug: Log route registration
console.log('Contact routes registered: POST /api/contact/submit');

module.exports = router;
