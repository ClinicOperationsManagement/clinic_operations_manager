const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Invoice = require('../models/Invoice');

/**
 * Get dashboard metrics
 * GET /api/analytics/dashboard
 */
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const filter = {};

    // Role-based filtering for dentist
    if (req.user.role === 'dentist') {
      filter.doctorId = req.user._id;
    }

    // Total patients
    let totalPatients;
    if (req.user.role === 'dentist') {
      const appointments = await Appointment.find({ doctorId: req.user._id }).distinct('patientId');
      totalPatients = appointments.length;
    } else {
      totalPatients = await Patient.countDocuments();
    }

    // Total revenue
    const revenueFilter = req.user.role === 'dentist' ? { doctorId: req.user._id } : {};
    const treatments = await Treatment.find(revenueFilter);
    const totalRevenue = treatments.reduce((sum, t) => sum + t.cost, 0);

    // Total appointments
    const totalAppointments = await Appointment.countDocuments(filter);

    // Upcoming appointments (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingAppointments = await Appointment.countDocuments({
      ...filter,
      startTime: { $gte: now, $lte: nextWeek },
      status: 'scheduled',
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        totalRevenue,
        totalAppointments,
        upcomingAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient growth over time
 * GET /api/analytics/patient-growth
 */
exports.getPatientGrowth = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let groupFormat;
    switch (period) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = '%Y-%U'; // Year-Week
        break;
      case 'monthly':
      default:
        groupFormat = '%Y-%m';
        break;
    }

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ];

    const data = await Patient.aggregate(pipeline);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by treatment type
 * GET /api/analytics/revenue-by-treatment
 */
exports.getRevenueByTreatment = async (req, res, next) => {
  try {
    const { doctorId } = req.query;

    const matchStage = {};
    if (req.user.role === 'dentist') {
      matchStage.doctorId = req.user._id;
    } else if (doctorId) {
      matchStage.doctorId = doctorId;
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$treatmentType',
          totalRevenue: { $sum: '$cost' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      {
        $project: {
          treatmentType: '$_id',
          totalRevenue: 1,
          count: 1,
          _id: 0,
        },
      },
    ];

    const data = await Treatment.aggregate(pipeline);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patients by doctor
 * GET /api/analytics/patients-by-doctor
 */
exports.getPatientsByDoctor = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$doctorId',
          patientCount: { $addToSet: '$patientId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $project: {
          doctorId: '$_id',
          doctorName: '$doctor.name',
          patientCount: { $size: '$patientCount' },
          _id: 0,
        },
      },
      { $sort: { patientCount: -1 } },
    ];

    const data = await Appointment.aggregate(pipeline);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get disease statistics
 * GET /api/analytics/diseases
 */
exports.getDiseases = async (req, res, next) => {
  try {
    // Diseases from patients
    const patientDiseases = await Patient.aggregate([
      { $unwind: '$diseases' },
      {
        $group: {
          _id: '$diseases',
          count: { $sum: 1 },
        },
      },
    ]);

    // Diseases from treatments
    const treatmentDiseases = await Treatment.aggregate([
      { $match: { disease: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$disease',
          count: { $sum: 1 },
        },
      },
    ]);

    // Combine and aggregate
    const diseaseCounts = {};
    [...patientDiseases, ...treatmentDiseases].forEach(item => {
      if (item._id) {
        diseaseCounts[item._id] = (diseaseCounts[item._id] || 0) + item.count;
      }
    });

    const data = Object.entries(diseaseCounts)
      .map(([disease, count]) => ({ disease, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
