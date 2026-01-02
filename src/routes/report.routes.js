const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const auth = require('../middleware/auth.middleware');

router.get('/profit', auth, ReportController.getProfitReport);

module.exports = router;
