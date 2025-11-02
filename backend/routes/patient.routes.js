const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

// All routes require authentication
router.use(authMiddleware);

// List and create patients
router.get('/', patientController.getPatients);
router.post('/', roleMiddleware(['admin', 'receptionist']), patientController.createPatient);

// Export patients
router.post('/export', roleMiddleware(['admin', 'receptionist']), patientController.exportPatients);

// Patient details
router.get('/:id', patientController.getPatientById);
router.put('/:id', roleMiddleware(['admin', 'receptionist']), patientController.updatePatient);
router.delete('/:id', roleMiddleware(['admin']), patientController.deletePatient);

// Patient related data
router.get('/:id/appointments', patientController.getPatientAppointments);
router.get('/:id/treatments', patientController.getPatientTreatments);
router.get('/:id/invoices', patientController.getPatientInvoices);
router.get('/:id/files', patientController.getPatientFiles);

module.exports = router;
