const mongoose = require('mongoose');

const calendarSuggestionSchema = new mongoose.Schema({
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
    suggestedStartTime: {
        type: Date,
        required: true,
    },
    suggestedEndTime: {
        type: Date,
        required: true,
    },
    sourceEmailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    googleEventId: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for pending suggestions
calendarSuggestionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('CalendarSuggestion', calendarSuggestionSchema);
