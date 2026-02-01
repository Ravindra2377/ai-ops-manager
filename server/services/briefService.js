const Email = require('../models/Email');
const EmailReminder = require('../models/EmailReminder'); // Assuming we have this, or query Tasks

/**
 * Generates the "Daily Command Center" Brief for a user.
 * 
 * Logic:
 * 1. CRITICAL (Blocking): Intent=QUESTION/APPROVAL + Priority=HIGH + (Unread OR userAction=pending)
 * 2. WARNING (Action Items): Reminders due today OR High Priority Tasks (not blocking)
 * 3. CLEAR: None of the above.
 */
exports.generateDailyBrief = async (userId) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // 1. Fetch CRITICAL Candidates (Blocking Others)
        // Intent: 'QUESTION' or 'APPROVAL' (or 'TASK_REQUEST'?) User said "Question/Approval"
        // Priority: 'HIGH'
        // Status: Unread OR Pending Action
        const criticalEmails = await Email.find({
            userId: userId,
            'aiAnalysis.intent': { $in: ['QUESTION', 'TASK_REQUEST', 'MEETING_REQUEST'] }, // Expanded slightly to include Tasks/Meetings as "Blocking"
            'aiAnalysis.urgency': 'HIGH',
            $or: [
                { isRead: false },
                { userAction: 'pending' }
            ]
        }).limit(5);

        // Filter strictly for "Blocking" feel if needed?
        // User Refinement: Intent = QUESTION or APPROVAL + Priority = HIGH + (unread OR no userAction)
        // My query does exactly this (Mapping TASK_REQUEST/MEETING to blocking loosely, but can refine)

        if (criticalEmails.length > 0) {
            // Count distinct blocking items
            const blockingCount = criticalEmails.length;
            const itemText = criticalEmails.length === 1 ? "1 Person" : `${blockingCount} People`;

            return {
                state: 'CRITICAL',
                headline: `🔥 You're blocking ${itemText}`,
                subtext: "Critical questions & approvals waiting for you.", // TODO: Enhance dynamic subtext
                items: criticalEmails.map(email => ({
                    type: 'BLOCKING',
                    id: email._id,
                    text: `${email.from.name} needs ${email.aiAnalysis.intent.replace('_', ' ').toLowerCase()}`,
                    subtext: email.subject,
                    intent: email.aiAnalysis.intent
                }))
            };
        }

        // 2. Fetch WARNING Candidates (Action Items)
        // a) Reminders due today execution
        const reminders = await EmailReminder.find({
            userId: userId,
            reminderDate: { $lte: endOfDay },
            status: 'pending'
        }).populate('emailId', 'subject from');

        // b) High Priority Tasks/Reads (Not blocking)
        // e.g. URGENT intent but not a direct question? OR High urgency FYI?
        // Let's just grab High Urgency that didn't match Critical?
        // Or just "Tasks for Today"

        // Let's check for draft replies or other high priority things?
        // For simple V1: Reminders + Unread High Priority (FYI/Marketing safety netted out)

        const otherUrgentEmails = await Email.find({
            userId: userId,
            'aiAnalysis.urgency': 'HIGH',
            isRead: false,
            // Exclude what we already caught in Critical if possible, but finding overlap is okay for Warning
            // If it wasn't Critical (e.g. FYI HIGH), it falls here.
            'aiAnalysis.intent': { $nin: ['QUESTION', 'TASK_REQUEST', 'MEETING_REQUEST'] }
        }).limit(3);

        const warningItems = [];

        reminders.forEach(r => {
            warningItems.push({
                type: 'REMINDER',
                id: r.emailId?._id || r._id, // Link to email if exists
                text: `Reminder: ${r.note || r.emailId?.subject || 'Task'}`,
                subtext: 'Due today'
            });
        });

        otherUrgentEmails.forEach(e => {
            warningItems.push({
                type: 'URGENT_READ',
                id: e._id,
                text: `Read: ${e.subject}`,
                subtext: `From ${e.from.name}`
            });
        });

        if (warningItems.length > 0) {
            return {
                state: 'WARNING',
                headline: `🟠 ${warningItems.length} Action Items for Today`,
                subtext: "Reminders and urgent updates.",
                items: warningItems
            };
        }

        // 3. CLEAR (Success)
        return {
            state: 'CLEAR',
            headline: "☕ You're Clear!",
            subtext: "Nothing urgent. Enjoy your focused work.",
            items: []
        };

    } catch (error) {
        console.error('Error generating daily brief:', error);
        throw error;
    }
};
