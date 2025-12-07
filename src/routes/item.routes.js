const express = require('express');
const router = express.Router();
const controller = require('../controllers/item.controller');
const verifyToken = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
