const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema({
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
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    reminderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reminder',
        default: null,
    },

    decisionType: {
        type: String,
        enum: ['REPLY', 'TASK', 'REMINDER'],
        required: true,
    },
    decisionText: {
        type: String,
        required: true,
    },

    source: {
        type: String,
        enum: ['EMAIL', 'MANUAL'],
        default: 'EMAIL',
    },

    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    followUpAt: {
        type: Date,
        required: true,
        index: true,
    },

    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'SNOOZED', 'ABANDONED'],
        default: 'PENDING',
        index: true,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    snoozeCount: {
        type: Number,
        default: 0,
    },

    // Analytics
    timeToComplete: {
        type: Number, // milliseconds
        default: null,
    },
});

// Index for efficient querying of pending decisions
decisionSchema.index({ userId: 1, status: 1, followUpAt: 1 });

// Auto-abandon if linked email is deleted
decisionSchema.pre('save', async function (next) {
    if (this.isNew) {
        const Email = mongoose.model('Email');
        const email = await Email.findById(this.emailId);
        if (!email) {
            this.status = 'ABANDONED';
        }
    }
    next();
});

module.exports = mongoose.model('Decision', decisionSchema);
