const cron = require('node-cron');
const EmailReminder = require('../models/EmailReminder');
const Email = require('../models/Email');
const { sendPushNotification } = require('../utils/sendPushNotification');

// Run every 5 minutes
const reminderCronJob = cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('[Reminder Cron] Checking for due reminders...');

        const now = new Date();

        // Find due reminders with batch limit (safety improvement #3)
        const dueReminders = await EmailReminder.find({
            remindAt: { $lte: now },
            status: 'pending',
        }).limit(100); // Prevent memory spikes

        if (dueReminders.length === 0) {
            console.log('[Reminder Cron] No due reminders found');
            return;
        }

        console.log(`[Reminder Cron] Found ${dueReminders.length} due reminders`);

        // Process each reminder
        for (const reminder of dueReminders) {
            try {
                // Get email details for notification
                const email = await Email.findById(reminder.emailId);

                if (email) {
                    // Send push notification
                    const notificationTitle = '📧 Email Reminder';
                    const notificationBody = reminder.reason || email.subject || 'You have a reminder';

                    await sendPushNotification(
                        reminder.userId,
                        notificationTitle,
                        notificationBody,
                        {
                            type: 'REMINDER',
                            emailId: email._id.toString(),
                            reminderId: reminder._id.toString(),
                            reason: reminder.reason,
                        }
                    );
                }

                // Mark as triggered
                reminder.status = 'triggered';
                reminder.triggeredAt = new Date();
                await reminder.save();
            } catch (error) {
                console.error(`[Reminder Cron] Error processing reminder ${reminder._id}:`, error);
                // Continue with other reminders even if one fails
            }
        }

        console.log(`[Reminder Cron] Successfully triggered ${dueReminders.length} reminders`);
    } catch (error) {
        console.error('[Reminder Cron] Error processing reminders:', error);
    }
});

module.exports = { reminderCronJob };
