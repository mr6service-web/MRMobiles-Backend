const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// Get recent activities
router.get('/activities', dashboardController.getRecentActivities);

// Get low stock items
router.get('/low-stock', dashboardController.getLowStockItems);

module.exports = router;
