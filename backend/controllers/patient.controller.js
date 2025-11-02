const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Invoice = require('../models/Invoice');
const File = require('../models/File');
const XLSX = require('xlsx');

/**
 * Get all patients with search and filter
 * GET /api/patients
 */
exports.getPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build filter
    const filter = {};

    // If dentist, only show patients from their appointments
    if (req.user.role === 'dentist') {
      const appointments = await Appointment.find({ doctorId: req.user._id }).distinct('patientId');
      filter._id = { $in: appointments };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Query
    const patients = await Patient.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      data: patients,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient by ID
 * GET /api/patients/:id
 */
exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    // If dentist, check if patient is assigned to them
    if (req.user.role === 'dentist') {
      const appointment = await Appointment.findOne({
        patientId: req.params.id,
        doctorId: req.user._id,
      });

      if (!appointment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new patient
 * POST /api/patients
 */
exports.createPatient = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);

    res.status(201).json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient
 * PUT /api/patients/:id
 */
exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    res.json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete patient (Admin only)
 * DELETE /api/patients/:id
 */
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    // Cascade delete: appointments, treatments, invoices, files
    await Appointment.deleteMany({ patientId: req.params.id });
    await Treatment.deleteMany({ patientId: req.params.id });
    await Invoice.deleteMany({ patientId: req.params.id });

    // Delete files (would need S3 service to delete from S3 as well)
    await File.deleteMany({ patientId: req.params.id });

    res.json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient's appointments
 * GET /api/patients/:id/appointments
 */
exports.getPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.id })
      .populate('doctorId', 'name')
      .sort({ startTime: -1 });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient's treatments
 * GET /api/patients/:id/treatments
 */
exports.getPatientTreatments = async (req, res, next) => {
  try {
    const treatments = await Treatment.find({ patientId: req.params.id })
      .populate('doctorId', 'name')
      .sort({ treatmentDate: -1 });

    res.json({
      success: true,
      data: treatments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient's invoices
 * GET /api/patients/:id/invoices
 */
exports.getPatientInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ patientId: req.params.id })
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient's files
 * GET /api/patients/:id/files
 */
exports.getPatientFiles = async (req, res, next) => {
  try {
    const files = await File.find({ patientId: req.params.id })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    // Note: In production, generate signed S3 URLs here
    // For now, return file metadata
    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export patients
 * POST /api/patients/export
 */
exports.exportPatients = async (req, res, next) => {
  try {
    const { format = 'csv', filters = {} } = req.body;

    // Get patients based on filters
    const patients = await Patient.find(filters);

    // Prepare data
    const data = patients.map(p => ({
      Name: p.name,
      Age: p.age || 'N/A',
      Gender: p.gender || 'N/A',
      Contact: p.contact,
      Email: p.email || 'N/A',
      Address: p.address || 'N/A',
      'Registered Date': p.createdAt.toISOString().split('T')[0],
    }));

    if (format === 'csv' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });

      res.setHeader('Content-Disposition', `attachment; filename=patients.${format === 'csv' ? 'csv' : 'xlsx'}`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else if (format === 'pdf') {
      // PDF export would use pdfkit - simplified for now
      return res.status(400).json({
        success: false,
        error: 'PDF export not yet implemented',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format',
      });
    }
  } catch (error) {
    next(error);
  }
};
