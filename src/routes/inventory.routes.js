const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventory.controller');
const verifyToken = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// All routes require authentication
router.use(verifyToken);

router.get('/', controller.getAll);
router.get('/report', controller.getStockReport);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', authorize('ADMIN'), controller.delete);

module.exports = router;
