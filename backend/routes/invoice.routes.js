const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

// All routes require authentication
router.use(authMiddleware);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', roleMiddleware(['admin', 'receptionist']), invoiceController.createInvoice);
router.put('/:id', roleMiddleware(['admin', 'receptionist']), invoiceController.updateInvoice);
router.delete('/:id', roleMiddleware(['admin']), invoiceController.deleteInvoice);

// PDF download
router.get('/:id/pdf', invoiceController.downloadInvoicePDF);

module.exports = router;
