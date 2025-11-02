const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['equipment', 'tools', 'consumables', 'furniture'],
        message: '{VALUE} is not a valid category',
      },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['working', 'needs_maintenance', 'damaged', 'retired'],
        message: '{VALUE} is not a valid status',
      },
      default: 'working',
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    currentValue: {
      type: Number,
      min: [0, 'Current value cannot be negative'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    warrantyExpiry: {
      type: Date,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    image: {
      type: String, // URL or file path
    },
    specifications: {
      brand: String,
      model: String,
      manufacturer: String,
      year: Number,
      dimensions: String,
      weight: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ serialNumber: 1 }, { unique: true, sparse: true });
inventorySchema.index({ location: 1 });
inventorySchema.index({ assignedTo: 1 });
inventorySchema.index({ nextMaintenanceDate: 1 });

// Virtual methods
inventorySchema.virtual('isWarrantyValid').get(function() {
  if (!this.warrantyExpiry) return false;
  return this.warrantyExpiry > new Date();
});

inventorySchema.virtual('daysSinceLastMaintenance').get(function() {
  if (!this.lastMaintenanceDate) return null;
  const diffTime = Math.abs(new Date() - this.lastMaintenanceDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

inventorySchema.virtual('isMaintenanceDue').get(function() {
  if (!this.nextMaintenanceDate) return false;
  return this.nextMaintenanceDate <= new Date();
});

inventorySchema.virtual('depreciationRate').get(function() {
  if (!this.purchasePrice || !this.currentValue) return null;
  return ((this.purchasePrice - this.currentValue) / this.purchasePrice) * 100;
});

// Static methods
inventorySchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

inventorySchema.statics.findMaintenanceDue = function(daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  return this.find({
    nextMaintenanceDate: { $lte: futureDate },
    status: { $in: ['working', 'needs_maintenance'] }
  }).populate('assignedTo', 'name email');
};

inventorySchema.statics.findWorkingEquipment = function() {
  return this.find({ status: 'working' });
};

inventorySchema.statics.getTotalValue = function() {
  return this.aggregate([
    { $match: { status: { $ne: 'retired' } } },
    { $group: { _id: null, totalValue: { $sum: '$currentValue' } } }
  ]);
};

inventorySchema.statics.getExpenseReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        purchaseDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalPurchaseCost: { $sum: '$purchasePrice' },
        totalCurrentValue: { $sum: '$currentValue' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware to calculate current value if not provided
inventorySchema.pre('save', function(next) {
  if (this.isNew && !this.currentValue) {
    this.currentValue = this.purchasePrice;
  }
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;