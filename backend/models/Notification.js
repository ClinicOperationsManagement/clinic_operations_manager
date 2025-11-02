const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['appointment_reminder', 'appointment_confirmation', 'invoice_generated'],
        message: '{VALUE} is not a valid notification type',
      },
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'sent', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    sentAt: {
      type: Date,
    },
    scheduledFor: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ appointmentId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
