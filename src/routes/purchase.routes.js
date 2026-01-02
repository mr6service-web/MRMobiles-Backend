const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchase.controller');
const verifyToken = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(verifyToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', authorize('ADMIN'), controller.delete);

module.exports = router;
