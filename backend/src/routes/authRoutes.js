const express = require('express');
const router = express.Router();
const { register, login, getProfile, checkSetupStatus, createInitialSuperAdmin, inviteSuperAdmin, checkUsername, checkEmail, checkExistingUser } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Availability check routes (no authentication required for registration flow)
router.get('/check-username/:username', checkUsername);
router.get('/check-email/:email', checkEmail);
router.post('/check-existing', checkExistingUser);

// Debug route to test if auth routes are working
router.get('/test', (req, res) => {
  console.log('Auth test route hit');
  res.json({ message: 'Auth routes working' });
});

router.get('/profile', authenticate, getProfile);

// Setup routes (no authentication required for initial setup)
router.get('/setup/status', checkSetupStatus);
router.post('/setup/superadmin', createInitialSuperAdmin);

// SuperAdmin invitation (requires superadmin role)
router.post('/invite/superadmin', authenticate, authorize(['superadmin']), inviteSuperAdmin);

module.exports = router;
