const fetch = require('node-fetch');
const User = require('../models/User');

/**
 * Send push notification via Expo Push Notification Service
 * Includes rate limiting: max 4 notifications/day
 */
async function sendPushNotification(userId, title, body, data = {}) {
    try {
        // Get user and check if notifications are enabled
        const user = await User.findById(userId);

        if (!user || !user.pushToken) {
            console.log(`No push token for user ${userId}`);
            return { success: false, reason: 'NO_TOKEN' };
        }

        // Check notification type settings
        const notificationType = data.type;
        if (notificationType === 'REMINDER' && !user.notificationSettings?.reminders) {
            console.log(`Reminders disabled for user ${userId}`);
            return { success: false, reason: 'DISABLED' };
        }
        if (notificationType === 'DECISION_FOLLOWUP' && !user.notificationSettings?.decisionFollowUps) {
            console.log(`Decision follow-ups disabled for user ${userId}`);
            return { success: false, reason: 'DISABLED' };
        }
        if (notificationType === 'URGENT_EMAIL' && !user.notificationSettings?.urgentEmails) {
            console.log(`Urgent emails disabled for user ${userId}`);
            return { success: false, reason: 'DISABLED' };
        }

        // RATE LIMITING: Check daily notification count
        const today = new Date().setHours(0, 0, 0, 0);
        const lastNotificationDate = user.lastNotificationSentAt ? new Date(user.lastNotificationSentAt).setHours(0, 0, 0, 0) : null;

        // Reset counter if it's a new day
        if (lastNotificationDate !== today) {
            user.notificationsSentToday = 0;
        }

        // Global rate limit: max 4 notifications/day
        if (user.notificationsSentToday >= 4) {
            console.log(`Daily notification limit reached for user ${userId}`);
            return { success: false, reason: 'RATE_LIMIT' };
        }

        // Type-specific rate limits
        // (For now, we'll track in-memory. In production, add per-type counters to User model)

        // Prepare notification payload
        const message = {
            to: user.pushToken,
            sound: null, // Calm notifications - no sound
            title,
            body,
            data,
            priority: 'default', // Not 'high' - we're not emergency alerts
        };

        // Send to Expo Push Notification Service
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();

        if (result.data && result.data[0].status === 'ok') {
            // Update notification counter
            user.notificationsSentToday += 1;
            user.lastNotificationSentAt = new Date();
            await user.save();

            console.log(`✅ Push notification sent to user ${userId}: ${title}`);
            return { success: true, receipt: result.data[0].id };
        } else {
            console.error(`Failed to send push notification:`, result);
            return { success: false, reason: 'EXPO_ERROR', error: result };
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, reason: 'EXCEPTION', error: error.message };
    }
}

module.exports = { sendPushNotification };
