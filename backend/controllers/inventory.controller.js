const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const mongoose = require('mongoose');

// Get all inventory items with filtering and pagination
const getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { 'specifications.model': { $regex: search, $options: 'i' } },
        { 'specifications.brand': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const inventory = await Inventory.find(filter)
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inventory.countDocuments(filter);

    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve inventory items'
    });
  }
};

// Get single inventory item with transaction history
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory item ID'
      });
    }

    const inventory = await Inventory.findById(id)
      .populate('assignedTo', 'name email');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Get transaction history
    const transactions = await InventoryTransaction.getTransactionsByItem(id);

    res.json({
      success: true,
      data: {
        inventory,
        transactions
      }
    });
  } catch (error) {
    console.error('Get inventory by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve inventory item'
    });
  }
};

// Create new inventory item
const createInventory = async (req, res) => {
  try {
    const {
      name,
      category,
      status = 'working',
      purchaseDate,
      purchasePrice,
      currentValue,
      location,
      serialNumber,
      warrantyExpiry,
      lastMaintenanceDate,
      nextMaintenanceDate,
      notes,
      assignedTo,
      image,
      specifications
    } = req.body;

    // Validate required fields
    if (!name || !category || !purchaseDate || !purchasePrice || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, purchaseDate, purchasePrice, location'
      });
    }

    // Check for duplicate serial number
    if (serialNumber) {
      const existingItem = await Inventory.findOne({ serialNumber });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          error: 'Serial number already exists'
        });
      }
    }

    // Create inventory item
    const inventory = new Inventory({
      name,
      category,
      status,
      purchaseDate: new Date(purchaseDate),
      purchasePrice,
      currentValue: currentValue || purchasePrice,
      location,
      serialNumber,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : undefined,
      notes,
      assignedTo,
      image,
      specifications
    });

    await inventory.save();

    // Create purchase transaction
    const transaction = new InventoryTransaction({
      inventoryItem: inventory._id,
      type: 'purchase',
      cost: purchasePrice,
      description: `Purchased ${name}`,
      performedBy: req.user._id,
      newStatus: status,
      timestamp: new Date(purchaseDate)
    });

    await transaction.save();

    // Populate assigned user info
    await inventory.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item'
    });
  }
};

// Update inventory item
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory item ID'
      });
    }

    const existingItem = await Inventory.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Check for duplicate serial number if it's being changed
    if (updateData.serialNumber && updateData.serialNumber !== existingItem.serialNumber) {
      const duplicateItem = await Inventory.findOne({
        serialNumber: updateData.serialNumber,
        _id: { $ne: id }
      });
      if (duplicateItem) {
        return res.status(400).json({
          success: false,
          error: 'Serial number already exists'
        });
      }
    }

    // Track changes for transaction
    const previousStatus = existingItem.status;
    const previousLocation = existingItem.location;
    const previousAssignedTo = existingItem.assignedTo;

    // Update inventory item
    const inventory = await Inventory.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    // Create transaction if there are significant changes
    if (previousStatus !== updateData.status ||
        previousLocation !== updateData.location ||
        previousAssignedTo?.toString() !== updateData.assignedTo) {

      const transaction = new InventoryTransaction({
        inventoryItem: id,
        type: updateData.status === 'damaged' ? 'repair' : 'transfer',
        description: `Updated ${existingItem.name}`,
        performedBy: req.user._id,
        previousStatus,
        newStatus: updateData.status || previousStatus,
        previousLocation,
        newLocation: updateData.location || previousLocation,
        previousAssignedTo,
        newAssignedTo: updateData.assignedTo,
        timestamp: new Date()
      });

      await transaction.save();
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item'
    });
  }
};

// Delete/retire inventory item
const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory item ID'
      });
    }

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Create disposal transaction
    const transaction = new InventoryTransaction({
      inventoryItem: id,
      type: 'disposal',
      description: `Retired ${inventory.name}`,
      performedBy: req.user._id,
      previousStatus: inventory.status,
      newStatus: 'retired',
      timestamp: new Date()
    });

    await transaction.save();

    // Update status to retired instead of deleting
    inventory.status = 'retired';
    await inventory.save();

    res.json({
      success: true,
      message: 'Inventory item retired successfully'
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retire inventory item'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalValueResult,
      statusCounts,
      categoryCounts,
      maintenanceDue,
      recentTransactions
    ] = await Promise.all([
      Inventory.getTotalValue(),
      Inventory.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Inventory.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Inventory.findMaintenanceDue(30),
      InventoryTransaction.find()
        .populate('inventoryItem', 'name')
        .populate('performedBy', 'name')
        .sort({ timestamp: -1 })
        .limit(5)
    ]);

    const totalValue = totalValueResult[0]?.totalValue || 0;

    res.json({
      success: true,
      data: {
        totalValue,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        categoryCounts: categoryCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        maintenanceDue: maintenanceDue.length,
        maintenanceDueItems: maintenanceDue,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics'
    });
  }
};

// Record maintenance activity
const recordMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { cost, description, type = 'maintenance', nextMaintenanceDate, warrantyInformation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory item ID'
      });
    }

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Create maintenance transaction
    const transaction = new InventoryTransaction({
      inventoryItem: id,
      type,
      cost,
      description: description || `${type === 'repair' ? 'Repair' : 'Maintenance'} for ${inventory.name}`,
      performedBy: req.user._id,
      previousStatus: inventory.status,
      newStatus: 'working',
      timestamp: new Date()
    });

    await transaction.save();

    // Update inventory item
    inventory.status = 'working';
    inventory.lastMaintenanceDate = new Date();
    if (nextMaintenanceDate) {
      inventory.nextMaintenanceDate = new Date(nextMaintenanceDate);
    }
    if (warrantyInformation) {
      inventory.warrantyExpiry = new Date(warrantyInformation);
    }
    await inventory.save();

    await inventory.populate('assignedTo', 'name email');

    res.json({
      success: true,
      data: inventory,
      message: 'Maintenance recorded successfully'
    });
  } catch (error) {
    console.error('Record maintenance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record maintenance'
    });
  }
};

// Get maintenance due items
const getMaintenanceDue = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const items = await Inventory.findMaintenanceDue(parseInt(days));

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get maintenance due error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve maintenance due items'
    });
  }
};

// Get expense reports
const getExpenseReports = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const [purchaseReport, maintenanceReport] = await Promise.all([
      Inventory.getExpenseReport(start, end),
      InventoryTransaction.getExpenseReport(start, end, category)
    ]);

    res.json({
      success: true,
      data: {
        purchaseReport,
        maintenanceReport
      }
    });
  } catch (error) {
    console.error('Get expense reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve expense reports'
    });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getDashboardStats,
  recordMaintenance,
  getMaintenanceDue,
  getExpenseReports
};