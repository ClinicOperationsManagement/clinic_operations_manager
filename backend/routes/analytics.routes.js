const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/patient-growth', analyticsController.getPatientGrowth);
router.get('/revenue-by-treatment', analyticsController.getRevenueByTreatment);
router.get('/patients-by-doctor', analyticsController.getPatientsByDoctor);
router.get('/diseases', analyticsController.getDiseases);

module.exports = router;
