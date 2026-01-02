const express = require('express');
const router = express.Router();
const controller = require('../controllers/itemType.controller');
const verifyToken = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// All routes require authentication
router.use(verifyToken);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', authorize('ADMIN'), controller.delete);

module.exports = router;
