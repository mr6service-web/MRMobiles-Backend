const express = require('express');
const router = express.Router();
const controller = require('../controllers/itemType.controller');
const verifyToken = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

router.get('/', controller.getAll);
router.post('/', controller.create);

module.exports = router;
