const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

// All routes require authentication
router.use(authMiddleware);

// Calendar view
router.get('/calendar', appointmentController.getCalendarAppointments);

// List and create appointments
router.get('/', appointmentController.getAppointments);
router.post('/', roleMiddleware(['admin', 'receptionist', 'dentist']), appointmentController.createAppointment);

// Send reminder
router.post('/:id/reminder', roleMiddleware(['admin', 'receptionist']), appointmentController.sendReminder);

// Appointment details
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', roleMiddleware(['admin', 'receptionist', 'dentist']), appointmentController.updateAppointment);
router.delete('/:id', roleMiddleware(['admin', 'receptionist']), appointmentController.cancelAppointment);

module.exports = router;
