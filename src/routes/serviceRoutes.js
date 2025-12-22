const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const auth = require('../middleware/auth.middleware');

router.use(auth);

router.post('/', ServiceController.createInward);
router.put('/:id', ServiceController.updateInward);
router.get('/', ServiceController.getAllServices);
router.get('/:id', ServiceController.getServiceById);
router.post('/:id/invoice', ServiceController.createInvoice);
router.post('/:id/return', ServiceController.createReturn);

module.exports = router;
