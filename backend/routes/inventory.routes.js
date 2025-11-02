const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

// All routes require authentication
router.use(authMiddleware);

// Basic CRUD operations
router.get('/', inventoryController.getInventory);
router.post('/', roleMiddleware(['admin', 'receptionist']), inventoryController.createInventory);
router.get('/stats/dashboard', inventoryController.getDashboardStats);
router.get('/maintenance-due', inventoryController.getMaintenanceDue);
router.get('/reports/expenses', inventoryController.getExpenseReports);

// Individual item operations
router.get('/:id', inventoryController.getInventoryById);
router.put('/:id', roleMiddleware(['admin', 'receptionist']), inventoryController.updateInventory);
router.delete('/:id', roleMiddleware(['admin']), inventoryController.deleteInventory);

// Maintenance operations
router.post('/:id/maintenance', roleMiddleware(['admin', 'receptionist']), inventoryController.recordMaintenance);

module.exports = router;