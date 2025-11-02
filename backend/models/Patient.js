const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
      trim: true,
    },
    age: {
      type: Number,
      min: [0, 'Age must be a positive number'],
      max: [150, 'Please enter a valid age'],
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender',
      },
    },
    weight: {
      type: Number,
      min: [0, 'Weight must be a positive number'],
    },
    height: {
      type: Number,
      min: [0, 'Height must be a positive number'],
    },
    bloodPressure: {
      type: String,
      trim: true,
    },
    temperature: {
      type: Number,
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    address: {
      type: String,
      trim: true,
    },
    medicalHistory: {
      type: String,
    },
    diseases: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
patientSchema.index({ name: 1 });
patientSchema.index({ contact: 1 });
patientSchema.index({ createdAt: -1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
