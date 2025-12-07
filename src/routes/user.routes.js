const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const verifyToken = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Get all users
router.get('/', controller.getAll);

module.exports = router;
