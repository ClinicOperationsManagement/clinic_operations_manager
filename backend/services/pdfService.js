const PDFDocument = require('pdfkit');

/**
 * Generate invoice PDF
 */
const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe PDF to response
  doc.pipe(res);

  // Clinic header
  doc
    .fontSize(20)
    .text(process.env.CLINIC_NAME || 'Dental Clinic', 50, 50)
    .fontSize(10)
    .text(process.env.CLINIC_ADDRESS || '', 50, 75)
    .text(process.env.CLINIC_PHONE || '', 50, 90)
    .moveDown();

  // Invoice title
  doc
    .fontSize(20)
    .text('INVOICE', 50, 140)
    .fontSize(10)
    .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 170)
    .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, 185);

  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 200);
  }

  // Patient info
  doc
    .fontSize(12)
    .text('Bill To:', 50, 230)
    .fontSize(10)
    .text(invoice.patientId.name, 50, 245)
    .text(invoice.patientId.contact, 50, 260);

  if (invoice.patientId.email) {
    doc.text(invoice.patientId.email, 50, 275);
  }

  // Treatments table
  doc.moveDown(2);
  const tableTop = 320;

  // Table headers
  doc
    .fontSize(10)
    .text('Treatment', 50, tableTop, { width: 200 })
    .text('Date', 260, tableTop, { width: 100 })
    .text('Cost', 380, tableTop, { width: 150, align: 'right' });

  // Table line
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Table rows
  let position = tableTop + 25;
  invoice.treatmentIds.forEach((treatment) => {
    doc
      .fontSize(10)
      .text(treatment.treatmentType, 50, position, { width: 200 })
      .text(new Date(treatment.treatmentDate).toLocaleDateString(), 260, position, { width: 100 })
      .text(`$${treatment.cost.toFixed(2)}`, 380, position, { width: 150, align: 'right' });

    position += 20;
  });

  // Totals
  position += 20;
  doc
    .moveTo(350, position)
    .lineTo(550, position)
    .stroke();

  position += 10;
  doc
    .fontSize(10)
    .text('Total Amount:', 350, position)
    .text(`$${invoice.totalAmount.toFixed(2)}`, 380, position, { width: 150, align: 'right' });

  position += 20;
  doc
    .text('Amount Paid:', 350, position)
    .text(`$${invoice.paidAmount.toFixed(2)}`, 380, position, { width: 150, align: 'right' });

  position += 20;
  const balance = invoice.totalAmount - invoice.paidAmount;
  doc
    .fontSize(12)
    .text('Balance Due:', 350, position)
    .text(`$${balance.toFixed(2)}`, 380, position, { width: 150, align: 'right' });

  // Notes
  if (invoice.notes) {
    position += 40;
    doc
      .fontSize(10)
      .text('Notes:', 50, position)
      .text(invoice.notes, 50, position + 15, { width: 500 });
  }

  // Footer
  doc
    .fontSize(8)
    .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

  // Finalize PDF
  doc.end();
};

module.exports = {
  generateInvoicePDF,
};
