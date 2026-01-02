const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/profit', auth, authorize('ADMIN'), ReportController.getProfitReport);

module.exports = router;
