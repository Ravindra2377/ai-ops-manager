const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    priority: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM',
    },
    dueDate: {
        type: Date,
        default: null,
    },
    sourceEmailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
    },
    createdBy: {
        type: String,
        enum: ['ai', 'user'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
        default: null,
    },
});

// Compound indexes for efficient queries
taskSchema.index({ userId: 1, status: 1, priority: -1 });
taskSchema.index({ userId: 1, dueDate: 1 });

// Virtual field to populate source email
taskSchema.virtual('sourceEmail', {
    ref: 'Email',
    localField: 'sourceEmailId',
    foreignField: '_id',
    justOne: true,
});

module.exports = mongoose.model('Task', taskSchema);
