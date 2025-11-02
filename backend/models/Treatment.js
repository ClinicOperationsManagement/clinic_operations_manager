const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    treatmentType: {
      type: String,
      required: [true, 'Treatment type is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost must be a non-negative number'],
    },
    disease: {
      type: String,
      trim: true,
    },
    treatmentDate: {
      type: Date,
      required: [true, 'Treatment date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
treatmentSchema.index({ patientId: 1 });
treatmentSchema.index({ doctorId: 1 });
treatmentSchema.index({ treatmentType: 1 });
treatmentSchema.index({ treatmentDate: -1 });

const Treatment = mongoose.model('Treatment', treatmentSchema);

module.exports = Treatment;
