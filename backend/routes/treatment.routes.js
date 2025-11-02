const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatment.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

// All routes require authentication and are for admin/dentist only (no receptionist access)
router.use(authMiddleware, roleMiddleware(['admin', 'dentist']));

router.get('/', treatmentController.getTreatments);
router.get('/:id', treatmentController.getTreatmentById);
router.post('/', treatmentController.createTreatment);
router.put('/:id', treatmentController.updateTreatment);
router.delete('/:id', roleMiddleware(['admin']), treatmentController.deleteTreatment);

module.exports = router;
