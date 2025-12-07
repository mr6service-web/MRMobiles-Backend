const express = require('express');
const router = express.Router();
const controller = require('../controllers/sale.controller');
const verifyToken = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

module.exports = router;
