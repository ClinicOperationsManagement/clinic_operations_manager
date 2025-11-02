const File = require('../models/File');
const Patient = require('../models/Patient');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Upload file
 * POST /api/files/upload
 */
exports.uploadFile = async (req, res, next) => {
  try {
    const { patientId, fileType } = req.body;

    if (!patientId || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and file type are required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    // Role check for dentist - can only upload for their patients
    if (req.user.role === 'dentist') {
      const Appointment = require('../models/Appointment');
      const appointment = await Appointment.findOne({
        patientId,
        doctorId: req.user._id,
      });

      if (!appointment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    // TODO: Upload to S3 using S3 service
    // For now, store metadata with placeholder S3 info
    const timestamp = Date.now();
    const s3Key = `patients/${patientId}/${timestamp}-${req.file.originalname}`;

    const file = await File.create({
      patientId,
      fileName: req.file.originalname,
      fileType,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      s3Key,
      s3Bucket: process.env.AWS_S3_BUCKET || 'dental-clinic-files',
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: {
        file,
        message: 'File uploaded successfully (S3 upload pending implementation)',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Role check - admin or uploader can delete
    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // TODO: Delete from S3 using S3 service

    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Export multer middleware
exports.uploadMiddleware = upload.single('file');
