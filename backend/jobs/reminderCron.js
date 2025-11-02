const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { sendAppointmentReminder } = require('../services/emailService');

/**
 * Cron job to send appointment reminders
 * Runs every hour
 */
const startReminderCron = () => {
  // Run every hour: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running appointment reminder cron job...');

      const now = new Date();
      const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Find appointments that need reminders
      // Appointments starting in 23-25 hours, not yet reminded
      const appointments = await Appointment.find({
        startTime: {
          $gte: twentyThreeHoursFromNow,
          $lte: twentyFiveHoursFromNow,
        },
        reminderSent: false,
        status: 'scheduled',
      })
        .populate('patientId')
        .populate('doctorId');

      console.log(`Found ${appointments.length} appointments needing reminders`);

      for (const appointment of appointments) {
        // Check if patient has email
        if (!appointment.patientId.email) {
          console.log(`Skipping appointment ${appointment._id}: Patient has no email`);
          continue;
        }

        // Send reminder
        const result = await sendAppointmentReminder(appointment);

        if (result.success) {
          // Mark as sent
          appointment.reminderSent = true;
          await appointment.save();

          // Update notification status
          await Notification.updateOne(
            {
              appointmentId: appointment._id,
              type: 'appointment_reminder',
            },
            {
              status: 'sent',
              sentAt: new Date(),
            }
          );

          console.log(`Reminder sent for appointment ${appointment._id}`);
        } else {
          // Log failure
          await Notification.updateOne(
            {
              appointmentId: appointment._id,
              type: 'appointment_reminder',
            },
            {
              status: 'failed',
              errorMessage: result.error,
            }
          );

          console.error(`Failed to send reminder for appointment ${appointment._id}:`, result.error);
        }
      }

      // Also process any pending notifications with scheduled time in the past
      const pendingNotifications = await Notification.find({
        status: 'pending',
        scheduledFor: { $lte: now },
      });

      console.log(`Found ${pendingNotifications.length} pending notifications to process`);

      for (const notification of pendingNotifications) {
        const result = await sendEmail(
          notification.recipientEmail,
          notification.subject,
          notification.body
        );

        if (result.success) {
          notification.status = 'sent';
          notification.sentAt = new Date();
        } else {
          notification.status = 'failed';
          notification.errorMessage = result.error;
        }

        await notification.save();
      }

      console.log('Reminder cron job completed');
    } catch (error) {
      console.error('Reminder cron job error:', error);
    }
  });

  console.log('Appointment reminder cron job started (runs every hour)');
};

module.exports = startReminderCron;
