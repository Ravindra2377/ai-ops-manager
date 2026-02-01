const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    gmailAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Optional for backward compatibility during migration
        index: true,
    },
    gmailMessageId: {
        type: String,
        required: true,
        unique: true,
    },
    threadId: {
        type: String,
        required: true,
    },
    from: {
        name: String,
        email: String,
    },
    to: [{
        name: String,
        email: String,
    }],
    subject: {
        type: String,
        default: '(No Subject)',
    },
    body: {
        type: String,
        default: '',
    },
    bodyHtml: {
        type: String,
        default: '',
    },
    snippet: {
        type: String,
        default: '',
    },
    receivedAt: {
        type: Date,
        required: true,
        index: true,
    },
    attachments: [{
        filename: String,
        mimeType: String,
        size: Number,
        attachmentId: String,
    }],
    aiAnalysis: {
        intent: {
            type: String,
            enum: ['MEETING_REQUEST', 'TASK_REQUEST', 'QUESTION', 'FYI', 'URGENT', 'MARKETING', 'NEWSLETTER', 'UNKNOWN'],
            default: 'UNKNOWN',
        },
        urgency: {
            type: String,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            default: 'MEDIUM',
            index: true,
        },
        summary: {
            type: String,
            default: '',
        },
        confidenceScore: {
            type: Number,
            min: 0,
            max: 1,
            default: 0,
        },
        reasoning: {
            type: String,
            default: '',
        },
        suggestedActions: [{
            type: {
                type: String,
                enum: ['REPLY', 'CREATE_TASK', 'SCHEDULE_MEETING', 'IGNORE', 'FOLLOW_UP'],
            },
            description: String,
            priority: Number,
        }],
        draftReply: {
            type: String,
            default: null,
        },
        modelVersion: {
            type: String,
            default: 'gemini-1.5-flash',
        },
    },
    userAction: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'ignored'],
        default: 'pending',
    },
    aiProcessingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    aiRetryCount: {
        type: Number,
        default: 0,
    },
    aiLastError: {
        type: String,
        default: null,
    },
    processedAt: {
        type: Date,
        default: Date.now,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    lastSurfacedAt: {
        type: Date,
        default: null
    }
});

// Compound index for efficient queries
emailSchema.index({ userId: 1, receivedAt: -1 });
emailSchema.index({ userId: 1, 'aiAnalysis.urgency': 1 });

module.exports = mongoose.model('Email', emailSchema);
