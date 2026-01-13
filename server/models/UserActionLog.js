const mongoose = require('mongoose');

const userActionLogSchema = new mongoose.Schema({
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
    },
    action: {
        type: String,
        enum: ['approved', 'rejected', 'ignored'],
        required: true,
    },
    aiSuggestion: {
        intent: String,
        urgency: String,
        suggestedActions: Array,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Index for analytics queries
userActionLogSchema.index({ userId: 1, timestamp: -1 });
userActionLogSchema.index({ action: 1 });

module.exports = mongoose.model('UserActionLog', userActionLogSchema);
