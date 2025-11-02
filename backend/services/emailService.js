const createTransporter = require('../config/email');
const Notification = require('../models/Notification');

/**
 * Send email
 */
const sendEmail = async (to, subject, body) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send appointment reminder
 */
const sendAppointmentReminder = async (appointment) => {
  const patientEmail = appointment.patientId.email;

  if (!patientEmail) {
    return { success: false, error: 'Patient has no email' };
  }

  const subject = `Appointment Reminder - ${process.env.CLINIC_NAME || 'Dental Clinic'}`;

  const body = `Dear ${appointment.patientId.name},

This is a reminder about your upcoming appointment:

Date: ${new Date(appointment.startTime).toLocaleDateString()}
Time: ${new Date(appointment.startTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString()}
Doctor: Dr. ${appointment.doctorId.name}

Location: ${process.env.CLINIC_ADDRESS || 'Our Clinic'}

If you need to reschedule or cancel, please contact us at ${process.env.CLINIC_PHONE || 'our office'}.

Best regards,
${process.env.CLINIC_NAME || 'Dental Clinic'}`;

  // Create notification record
  await Notification.create({
    type: 'appointment_reminder',
    recipientEmail: patientEmail,
    patientId: appointment.patientId._id,
    appointmentId: appointment._id,
    subject,
    body,
    status: 'pending',
  });

  return await sendEmail(patientEmail, subject, body);
};

/**
 * Send appointment confirmation
 */
const sendAppointmentConfirmation = async (appointment) => {
  const patientEmail = appointment.patientId.email;

  if (!patientEmail) {
    return { success: false, error: 'Patient has no email' };
  }

  const subject = `Appointment Confirmed - ${process.env.CLINIC_NAME || 'Dental Clinic'}`;

  const body = `Dear ${appointment.patientId.name},

Your appointment has been confirmed:

Date: ${new Date(appointment.startTime).toLocaleDateString()}
Time: ${new Date(appointment.startTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString()}
Doctor: Dr. ${appointment.doctorId.name}

Location: ${process.env.CLINIC_ADDRESS || 'Our Clinic'}

We look forward to seeing you!

Best regards,
${process.env.CLINIC_NAME || 'Dental Clinic'}`;

  // Create notification record
  await Notification.create({
    type: 'appointment_confirmation',
    recipientEmail: patientEmail,
    patientId: appointment.patientId._id,
    appointmentId: appointment._id,
    subject,
    body,
    status: 'sent',
    sentAt: new Date(),
  });

  return await sendEmail(patientEmail, subject, body);
};

/**
 * Send invoice notification
 */
const sendInvoiceNotification = async (invoice) => {
  const patientEmail = invoice.patientId.email;

  if (!patientEmail) {
    return { success: false, error: 'Patient has no email' };
  }

  const subject = `Invoice #${invoice.invoiceNumber} - ${process.env.CLINIC_NAME || 'Dental Clinic'}`;

  const balance = invoice.totalAmount - invoice.paidAmount;

  const body = `Dear ${invoice.patientId.name},

An invoice has been generated for your recent visit:

Invoice Number: ${invoice.invoiceNumber}
Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Total Amount: $${invoice.totalAmount.toFixed(2)}
Amount Paid: $${invoice.paidAmount.toFixed(2)}
Balance Due: $${balance.toFixed(2)}

${invoice.dueDate ? `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}` : ''}

You can download your invoice from our patient portal or contact us for payment options.

Best regards,
${process.env.CLINIC_NAME || 'Dental Clinic'}`;

  // Create notification record
  await Notification.create({
    type: 'invoice_generated',
    recipientEmail: patientEmail,
    patientId: invoice.patientId._id,
    subject,
    body,
    status: 'sent',
    sentAt: new Date(),
  });

  return await sendEmail(patientEmail, subject, body);
};

module.exports = {
  sendEmail,
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendInvoiceNotification,
};
