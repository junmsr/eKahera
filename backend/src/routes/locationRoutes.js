const express = require('express');
const router = express.Router();
const { getLocations } = require('../controllers/locationController');

router.get('/locations', getLocations);

module.exports = router;