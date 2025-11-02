const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
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
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'scheduled',
    },
    notes: {
      type: String,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
appointmentSchema.index({ doctorId: 1, startTime: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ startTime: 1 });
appointmentSchema.index({ status: 1 });

// Validation: endTime must be after startTime
appointmentSchema.pre('validate', function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
