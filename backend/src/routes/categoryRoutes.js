const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/categories', categoryController.getCategoriesByBusinessType);

module.exports = router;
