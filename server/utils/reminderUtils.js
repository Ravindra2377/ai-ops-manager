const EmailReminder = require('../models/EmailReminder');

/**
 * Auto-cancel all pending reminders for a deleted email
 * Safety improvement #4: Prevent "ghost reminders"
 */
async function cancelRemindersForEmail(emailId) {
    try {
        const result = await EmailReminder.updateMany(
            { emailId, status: 'pending' },
            { status: 'cancelled' }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Reminder Utils] Cancelled ${result.modifiedCount} reminders for deleted email ${emailId}`);
        }

        return result.modifiedCount;
    } catch (error) {
        console.error('[Reminder Utils] Error cancelling reminders:', error);
        throw error;
    }
}

/**
 * Get reminder count for a user (for premium gating)
 */
async function getActiveReminderCount(userId) {
    return await EmailReminder.countDocuments({
        userId,
        status: 'pending',
    });
}

/**
 * Check if email has an active reminder
 */
async function hasActiveReminder(emailId) {
    const reminder = await EmailReminder.findOne({
        emailId,
        status: 'pending',
    });
    return !!reminder;
}

module.exports = {
    cancelRemindersForEmail,
    getActiveReminderCount,
    hasActiveReminder,
};
