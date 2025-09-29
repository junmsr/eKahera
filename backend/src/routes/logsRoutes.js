const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getLogs } = require('../controllers/logsController');

router.get('/', authenticate, getLogs);

module.exports = router;


