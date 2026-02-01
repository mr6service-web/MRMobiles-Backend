const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(auth);

router.post('/', ServiceController.createInward);
router.get('/next-number', ServiceController.getNextInwardNo);
router.get('/search', ServiceController.searchInward);
router.put('/:id', ServiceController.updateInward);
router.get('/', ServiceController.getAllServices);
router.get('/navigation/:id', ServiceController.getInwardNavigation);
router.get('/invoice/navigation/:id', ServiceController.getInvoiceNavigation);
router.get('/invoice/:id', ServiceController.getInvoiceById);
router.get('/:id', ServiceController.getServiceById);
router.delete('/:id', authorize('ADMIN'), ServiceController.deleteInward);
router.delete('/invoice/:id', authorize('ADMIN'), ServiceController.deleteInvoice);
router.put('/invoice/:id', ServiceController.updateInvoice);
router.post('/:id/invoice', ServiceController.createInvoice);
router.post('/:id/return', ServiceController.createReturn);

module.exports = router;
