const express = require('express');
const router = express.Router();

// GET /api/welcome - Welcome endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to MRMobiles Backend API! 🚀',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            items: '/api/items',
            itemTypes: '/api/item-types',
            inventory: '/api/inventory',
            sales: '/api/sales',
            users: '/api/users'
        }
    });
});

module.exports = router;
