const Invoice = require('../models/Invoice');
const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');

/**
 * Generate unique invoice number
 * Format: INV-YYYYMMDD-XXXX
 */
const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  // Find the last invoice created today
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^INV-${dateStr}` },
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  const sequenceStr = sequence.toString().padStart(4, '0');
  return `INV-${dateStr}-${sequenceStr}`;
};

/**
 * Get all invoices with filters
 * GET /api/invoices
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const { patientId, status, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    // Role-based filtering for dentist - only invoices related to their treatments
    if (req.user.role === 'dentist') {
      const treatments = await Treatment.find({ doctorId: req.user._id }).distinct('_id');
      filter.treatmentIds = { $in: treatments };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query
    const invoices = await Invoice.find(filter)
      .populate('patientId', 'name contact email')
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patientId')
      .populate({
        path: 'treatmentIds',
        populate: {
          path: 'doctorId',
          select: 'name',
        },
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Role check for dentist
    if (req.user.role === 'dentist') {
      const hasTreatment = invoice.treatmentIds.some(
        t => t.doctorId._id.toString() === req.user._id.toString()
      );

      if (!hasTreatment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new invoice
 * POST /api/invoices
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const { patientId, treatmentIds, notes, dueDate } = req.body;

    // Validate required fields
    if (!patientId || !treatmentIds || treatmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Patient and treatments are required',
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    // Fetch treatments and calculate total
    const treatments = await Treatment.find({ _id: { $in: treatmentIds } });

    if (treatments.length !== treatmentIds.length) {
      return res.status(404).json({
        success: false,
        error: 'Some treatments not found',
      });
    }

    const totalAmount = treatments.reduce((sum, t) => sum + t.cost, 0);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
      patientId,
      treatmentIds,
      totalAmount,
      invoiceNumber,
      notes,
      dueDate,
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('patientId', 'name contact email')
      .populate('treatmentIds');

    res.status(201).json({
      success: true,
      data: { invoice: populatedInvoice },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update invoice
 * PUT /api/invoices/:id
 */
exports.updateInvoice = async (req, res, next) => {
  try {
    const { paidAmount, status, notes } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Update fields
    if (paidAmount !== undefined) {
      if (paidAmount > invoice.totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'Paid amount cannot exceed total amount',
        });
      }
      invoice.paidAmount = paidAmount;
    }

    if (status) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;

    await invoice.save();

    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('patientId', 'name contact email')
      .populate('treatmentIds');

    res.json({
      success: true,
      data: { invoice: updatedInvoice },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete invoice (Admin only)
 * DELETE /api/invoices/:id
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and download invoice PDF
 * GET /api/invoices/:id/pdf
 */
exports.downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patientId')
      .populate({
        path: 'treatmentIds',
        populate: {
          path: 'doctorId',
          select: 'name',
        },
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // TODO: Generate PDF using PDF service
    // For now, return JSON with message
    res.json({
      success: true,
      message: 'PDF generation will be implemented with PDF service',
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};
