const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory item is required'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['purchase', 'maintenance', 'repair', 'disposal', 'transfer', 'upgrade', 'depreciation'],
        message: '{VALUE} is not a valid transaction type',
      },
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      required: function() {
        return ['purchase', 'maintenance', 'repair', 'upgrade'].includes(this.type);
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by user is required'],
    },
    previousStatus: {
      type: String,
      enum: ['working', 'needs_maintenance', 'damaged', 'retired'],
    },
    newStatus: {
      type: String,
      enum: ['working', 'needs_maintenance', 'damaged', 'retired'],
    },
    previousLocation: {
      type: String,
      trim: true,
    },
    newLocation: {
      type: String,
      trim: true,
    },
    previousAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    newAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vendor: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    warrantyInformation: {
      type: String,
      trim: true,
    },
    attachments: [{
      type: String, // File URLs or paths
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
inventoryTransactionSchema.index({ inventoryItem: 1 });
inventoryTransactionSchema.index({ type: 1 });
inventoryTransactionSchema.index({ performedBy: 1 });
inventoryTransactionSchema.index({ timestamp: -1 });
inventoryTransactionSchema.index({ cost: 1 });

// Static methods
inventoryTransactionSchema.statics.getExpenseReport = function(startDate, endDate, category = null) {
  const matchStage = {
    timestamp: { $gte: startDate, $lte: endDate },
    type: { $in: ['purchase', 'maintenance', 'repair', 'upgrade'] }
  };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'inventories',
        localField: 'inventoryItem',
        foreignField: '_id',
        as: 'inventoryDetails'
      }
    },
    { $unwind: '$inventoryDetails' }
  ];

  if (category) {
    pipeline.push({
      $match: { 'inventoryDetails.category': category }
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          type: '$type',
          category: '$inventoryDetails.category'
        },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 },
        transactions: { $push: '$$ROOT' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        transactionTypes: {
          $push: {
            type: '$_id.type',
            totalCost: '$totalCost',
            count: '$count'
          }
        },
        totalCost: { $sum: '$totalCost' },
        totalCount: { $sum: '$count' }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  );

  return this.aggregate(pipeline);
};

inventoryTransactionSchema.statics.getTransactionsByItem = function(inventoryItemId, limit = 50) {
  return this.find({ inventoryItem: inventoryItemId })
    .populate('performedBy', 'name email')
    .populate('previousAssignedTo newAssignedTo', 'name')
    .sort({ timestamp: -1 })
    .limit(limit);
};

inventoryTransactionSchema.statics.get MaintenanceTransactions = function(startDate, endDate) {
  return this.find({
    type: { $in: ['maintenance', 'repair'] },
    timestamp: { $gte: startDate, $lte: endDate }
  })
  .populate('inventoryItem', 'name serialNumber category')
  .populate('performedBy', 'name email')
  .sort({ timestamp: -1 });
};

inventoryTransactionSchema.statics.getAssetLifecycle = function(inventoryItemId) {
  return this.find({ inventoryItem: inventoryItemId })
    .sort({ timestamp: 1 })
    .populate('performedBy', 'name email')
    .populate('previousAssignedTo newAssignedTo', 'name');
};

// Instance method to get formatted cost
inventoryTransactionSchema.methods.getFormattedCost = function() {
  if (this.cost === null || this.cost === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.cost);
};

// Pre-save validation middleware
inventoryTransactionSchema.pre('save', function(next) {
  // Validate that cost is provided for transaction types that require it
  const requiresCost = ['purchase', 'maintenance', 'repair', 'upgrade'];
  if (requiresCost.includes(this.type) && (this.cost === null || this.cost === undefined)) {
    return next(new Error(`Cost is required for ${this.type} transactions`));
  }

  // Validate that status changes are logical
  if (this.previousStatus && this.newStatus && this.previousStatus === this.newStatus) {
    return next(new Error('Previous and new status cannot be the same'));
  }

  next();
});

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

module.exports = InventoryTransaction;