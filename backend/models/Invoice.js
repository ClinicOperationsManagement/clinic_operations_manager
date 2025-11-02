const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },
    treatmentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Treatment',
    }],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be non-negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount must be non-negative'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'paid', 'partial', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ patientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: -1 });

// Validation: paidAmount cannot exceed totalAmount
invoiceSchema.pre('validate', function (next) {
  if (this.paidAmount > this.totalAmount) {
    next(new Error('Paid amount cannot exceed total amount'));
  } else {
    next();
  }
});

// Auto-update status based on paidAmount
invoiceSchema.pre('save', function (next) {
  if (this.paidAmount === 0) {
    this.status = 'pending';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = 'partial';
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
