const express = require('express');
const router = express.Router();
const cleanupController = require('../controllers/cleanupController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route POST /api/cleanup
 * @desc Triggers the cleanup of old pending transactions and associated users.
 * @access Private (Superadmin only)
 */
router.post(
  '/',
  authenticate,
  authorize(['superadmin']),
  cleanupController.triggerCleanup
);

module.exports = router;
