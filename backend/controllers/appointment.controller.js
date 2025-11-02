const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * Check for appointment conflicts
 */
const checkConflict = async (doctorId, startTime, endTime, excludeAppointmentId = null) => {
  const query = {
    doctorId,
    status: 'scheduled',
    $or: [
      // New appointment starts during existing appointment
      {
        startTime: { $lte: new Date(startTime) },
        endTime: { $gt: new Date(startTime) },
      },
      // New appointment ends during existing appointment
      {
        startTime: { $lt: new Date(endTime) },
        endTime: { $gte: new Date(endTime) },
      },
      // New appointment encompasses existing appointment
      {
        startTime: { $gte: new Date(startTime) },
        endTime: { $lte: new Date(endTime) },
      },
    ],
  };

  // Exclude current appointment when updating
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflict = await Appointment.findOne(query);
  return conflict;
};

/**
 * Get appointments with filters
 * GET /api/appointments
 */
exports.getAppointments = async (req, res, next) => {
  try {
    const { doctorId, date, status, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'dentist') {
      filter.doctorId = req.user._id;
    } else if (doctorId) {
      filter.doctorId = doctorId;
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query
    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name contact email')
      .populate('doctorId', 'name')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment by ID
 * GET /api/appointments/:id
 */
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    // Role check for dentist
    if (req.user.role === 'dentist' && appointment.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new appointment
 * POST /api/appointments
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, startTime, endTime, notes } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Patient, doctor, start time, and end time are required',
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

    // Verify doctor exists and has dentist role
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'dentist') {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    // Check for conflicts
    const conflict = await checkConflict(doctorId, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'Doctor has conflicting appointment at this time',
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      startTime,
      endTime,
      notes,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name contact email')
      .populate('doctorId', 'name');

    res.status(201).json({
      success: true,
      data: { appointment: populatedAppointment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment
 * PUT /api/appointments/:id
 */
exports.updateAppointment = async (req, res, next) => {
  try {
    const { startTime, endTime, status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    // Role check for dentist - can only update own appointments
    if (req.user.role === 'dentist' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // If time is being changed, check for conflicts
    if (startTime || endTime) {
      const newStartTime = startTime || appointment.startTime;
      const newEndTime = endTime || appointment.endTime;

      const conflict = await checkConflict(
        appointment.doctorId,
        newStartTime,
        newEndTime,
        appointment._id
      );

      if (conflict) {
        return res.status(409).json({
          success: false,
          error: 'Doctor has conflicting appointment at this time',
        });
      }

      appointment.startTime = newStartTime;
      appointment.endTime = newEndTime;

      // Update status to rescheduled if time changed
      if (appointment.status === 'scheduled') {
        appointment.status = 'rescheduled';
      }
    }

    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name contact email')
      .populate('doctorId', 'name');

    res.json({
      success: true,
      data: { appointment: updatedAppointment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel appointment (soft delete)
 * DELETE /api/appointments/:id
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointments for calendar view
 * GET /api/appointments/calendar
 */
exports.getCalendarAppointments = async (req, res, next) => {
  try {
    const { doctorId, start, end } = req.query;

    const filter = {};

    // Role-based filtering
    if (req.user.role === 'dentist') {
      filter.doctorId = req.user._id;
    } else if (doctorId) {
      filter.doctorId = doctorId;
    }

    // Date range filter
    if (start && end) {
      filter.startTime = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    // Format for FullCalendar
    const events = appointments.map(appt => ({
      id: appt._id,
      title: appt.patientId.name,
      start: appt.startTime,
      end: appt.endTime,
      resourceId: appt.doctorId._id,
      extendedProps: {
        patientId: appt.patientId._id,
        doctorId: appt.doctorId._id,
        doctorName: appt.doctorId.name,
        status: appt.status,
        notes: appt.notes,
      },
    }));

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send appointment reminder
 * POST /api/appointments/:id/reminder
 */
exports.sendReminder = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    if (!appointment.patientId.email) {
      return res.status(400).json({
        success: false,
        error: 'Patient does not have an email address',
      });
    }

    // TODO: Send email via email service
    // For now, just mark as sent
    appointment.reminderSent = true;
    await appointment.save();

    res.json({
      success: true,
      message: 'Reminder sent successfully',
    });
  } catch (error) {
    next(error);
  }
};
