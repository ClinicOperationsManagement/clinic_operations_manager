const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: {
        values: ['prescription', 'scan', 'report', 'other'],
        message: '{VALUE} is not a valid file type',
      },
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      max: [10485760, 'File size cannot exceed 10MB'], // 10MB in bytes
    },
    s3Key: {
      type: String,
      required: [true, 'S3 key is required'],
      unique: true,
    },
    s3Bucket: {
      type: String,
      required: [true, 'S3 bucket is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
fileSchema.index({ patientId: 1 });
fileSchema.index({ s3Key: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
