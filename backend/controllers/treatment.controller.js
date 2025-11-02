const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * Get all treatments with filters
 * GET /api/treatments
 */
exports.getTreatments = async (req, res, next) => {
  try {
    const { patientId, doctorId, treatmentType, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};

    // Role-based filtering - dentists only see their own treatments
    if (req.user.role === 'dentist') {
      filter.doctorId = req.user._id;
    } else if (doctorId) {
      filter.doctorId = doctorId;
    }

    if (patientId) filter.patientId = patientId;
    if (treatmentType) filter.treatmentType = { $regex: treatmentType, $options: 'i' };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query
    const treatments = await Treatment.find(filter)
      .populate('patientId', 'name contact')
      .populate('doctorId', 'name')
      .sort({ treatmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Treatment.countDocuments(filter);

    res.json({
      success: true,
      data: treatments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get treatment by ID
 * GET /api/treatments/:id
 */
exports.getTreatmentById = async (req, res, next) => {
  try {
    const treatment = await Treatment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId', 'name')
      .populate('appointmentId');

    if (!treatment) {
      return res.status(404).json({
        success: false,
        error: 'Treatment not found',
      });
    }

    // Role check for dentist - can only view own treatments
    if (req.user.role === 'dentist' && treatment.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { treatment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new treatment
 * POST /api/treatments
 */
exports.createTreatment = async (req, res, next) => {
  try {
    let { patientId, doctorId, appointmentId, treatmentType, description, cost, disease, treatmentDate } = req.body;

    // Validate required fields
    if (!patientId || !treatmentType || cost === undefined || !treatmentDate) {
      return res.status(400).json({
        success: false,
        error: 'Patient, treatment type, cost, and treatment date are required',
      });
    }

    // Auto-set doctorId to current user if dentist
    if (req.user.role === 'dentist') {
      doctorId = req.user._id;
    } else if (!doctorId) {
      return res.status(400).json({
        success: false,
        error: 'Doctor is required',
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

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'dentist') {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    // Create treatment
    const treatment = await Treatment.create({
      patientId,
      doctorId,
      appointmentId,
      treatmentType,
      description,
      cost,
      disease,
      treatmentDate,
    });

    const populatedTreatment = await Treatment.findById(treatment._id)
      .populate('patientId', 'name contact')
      .populate('doctorId', 'name');

    res.status(201).json({
      success: true,
      data: { treatment: populatedTreatment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update treatment
 * PUT /api/treatments/:id
 */
exports.updateTreatment = async (req, res, next) => {
  try {
    const treatment = await Treatment.findById(req.params.id);

    if (!treatment) {
      return res.status(404).json({
        success: false,
        error: 'Treatment not found',
      });
    }

    // Role check - dentist can only update own treatments
    if (req.user.role === 'dentist' && treatment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update fields
    const allowedUpdates = ['treatmentType', 'description', 'cost', 'disease', 'treatmentDate'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        treatment[field] = req.body[field];
      }
    });

    await treatment.save();

    const updatedTreatment = await Treatment.findById(treatment._id)
      .populate('patientId', 'name contact')
      .populate('doctorId', 'name');

    res.json({
      success: true,
      data: { treatment: updatedTreatment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete treatment (Admin only)
 * DELETE /api/treatments/:id
 */
exports.deleteTreatment = async (req, res, next) => {
  try {
    const treatment = await Treatment.findByIdAndDelete(req.params.id);

    if (!treatment) {
      return res.status(404).json({
        success: false,
        error: 'Treatment not found',
      });
    }

    res.json({
      success: true,
      message: 'Treatment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
