const mongoose = require('mongoose');

const emailReminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    emailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true,
        index: true,
    },
    gmailAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    remindAt: {
        type: Date,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'triggered', 'cancelled'],
        default: 'pending',
        required: true,
        index: true,
    },
    reason: {
        type: String,
        // Optional field for future AI suggestions
        // e.g., "Follow up", "Waiting for reply"
    },
    triggeredAt: {
        type: Date,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Compound indexes for efficient queries
emailReminderSchema.index({ userId: 1, status: 1 }); // List user's active reminders
emailReminderSchema.index({ remindAt: 1, status: 1 }); // Cron job query
emailReminderSchema.index({ emailId: 1, status: 1 }); // Check if email has reminder

// Prevent duplicate pending reminders for same email
emailReminderSchema.index(
    { emailId: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('EmailReminder', emailReminderSchema);
