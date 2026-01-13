const cron = require('node-cron');
const EmailReminder = require('../models/EmailReminder');

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

        // Mark as triggered
        for (const reminder of dueReminders) {
            reminder.status = 'triggered';
            reminder.triggeredAt = new Date();
            await reminder.save();
        }

        console.log(`[Reminder Cron] Successfully triggered ${dueReminders.length} reminders`);
    } catch (error) {
        console.error('[Reminder Cron] Error processing reminders:', error);
    }
});

module.exports = { reminderCronJob };
