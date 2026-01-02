const express = require('express');
const router = express.Router();
const saleReturnController = require('../controllers/sale-return.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply auth middleware to all return routes
router.use(authMiddleware);

router.post('/', saleReturnController.createReturn);
router.get('/', saleReturnController.getAllReturns);
router.get('/:id', saleReturnController.getReturnById);

module.exports = router;
