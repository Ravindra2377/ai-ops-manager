const cron = require('node-cron');
const Decision = require('../models/Decision');
const { sendPushNotification } = require('../utils/sendPushNotification');

// Run every hour to check for decision follow-ups
const decisionCronJob = cron.schedule('0 * * * *', async () => {
    try {
        console.log('[Decision Cron] Checking for decision follow-ups...');

        const now = new Date();

        // Find decisions due for follow-up
        const dueDecisions = await Decision.find({
            followUpAt: { $lte: now },
            status: 'PENDING',
        }).limit(50); // Batch limit

        if (dueDecisions.length === 0) {
            console.log('[Decision Cron] No decision follow-ups due');
            return;
        }

        console.log(`[Decision Cron] Found ${dueDecisions.length} decision follow-ups`);

        // Send notifications for each decision
        for (const decision of dueDecisions) {
            try {
                // Calm, non-judgmental copy
                const notificationTitle = '📋 Yesterday\'s Decision';
                const notificationBody = `Did you complete: ${decision.decisionText}?`;

                await sendPushNotification(
                    decision.userId,
                    notificationTitle,
                    notificationBody,
                    {
                        type: 'DECISION_FOLLOWUP',
                        decisionId: decision._id.toString(),
                        decisionText: decision.decisionText,
                        reason: 'You approved this action yesterday',
                    }
                );

                console.log(`✅ Sent decision follow-up notification: ${decision.decisionText}`);
            } catch (error) {
                console.error(`[Decision Cron] Error sending notification for decision ${decision._id}:`, error);
                // Continue with other decisions even if one fails
            }
        }

        console.log(`[Decision Cron] Successfully sent ${dueDecisions.length} decision follow-up notifications`);
    } catch (error) {
        console.error('[Decision Cron] Error processing decision follow-ups:', error);
    }
});

module.exports = { decisionCronJob };
