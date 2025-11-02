const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', fileController.uploadMiddleware, fileController.uploadFile);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
