const express = require('express');
const router = express.Router();
const cleanupUserController = require('../controllers/cleanupUserController');

/**
 * @route DELETE /api/cleanup/user/:userId
 * @desc Deletes a specific user.
 * @access Public (for now, will be restricted later if needed)
 */
router.delete(
  '/user/:userId',
  cleanupUserController.deleteUser
);

module.exports = router;
