const express = require('express');
const router = express.Router();
const EmailReminder = require('../models/EmailReminder');
const Email = require('../models/Email');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Create a reminder
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { emailId, remindAt, reason } = req.body;
        const userId = req.userId; // Fixed: authMiddleware sets req.userId directly

        // Validation
        if (!emailId || !remindAt) {
            return res.status(400).json({
                success: false,
                message: 'Email ID and remind time are required',
            });
        }

        // Verify email exists and belongs to user
        const email = await Email.findOne({ _id: emailId, userId });
        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found',
            });
        }

        // Verify remindAt is in the future
        const remindDate = new Date(remindAt);
        if (remindDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reminder time must be in the future',
            });
        }

        // Check for existing pending reminder (uniqueness guard)
        const existingReminder = await EmailReminder.findOne({
            emailId,
            status: 'pending',
        });
        if (existingReminder) {
            return res.status(400).json({
                success: false,
                message: 'A reminder already exists for this email',
            });
        }

        // Check reminder limit (Disabled: All users are premium now)
        /*
        const user = await User.findById(userId);
        if (user && user.subscriptionTier === 'free') {
            const activeReminders = await EmailReminder.countDocuments({
                userId,
                status: 'pending',
            });
            if (activeReminders >= 3) {
                return res.status(403).json({
                    success: false,
                    message: 'Free tier allows 3 active reminders. Upgrade to Premium for unlimited reminders.',
                    needsUpgrade: true,
                });
            }
        }
        */

        // Create reminder
        const reminder = new EmailReminder({
            userId,
            emailId,
            gmailAccountId: email.gmailAccountId,
            remindAt: remindDate,
            reason,
        });
        await reminder.save();

        res.status(201).json({
            success: true,
            reminder: {
                id: reminder._id,
                emailId: reminder.emailId,
                remindAt: reminder.remindAt,
                status: reminder.status,
                reason: reminder.reason,
            },
        });
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create reminder',
        });
    }
});

// Get active reminders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { status = 'pending' } = req.query;

        const reminders = await EmailReminder.find({
            userId,
            status,
        })
            .populate({
                path: 'emailId',
                select: 'subject sender receivedAt',
            })
            .sort({ remindAt: 1 });

        res.json({
            success: true,
            reminders: reminders.map(r => ({
                id: r._id,
                emailId: r.emailId?._id,
                email: r.emailId ? {
                    subject: r.emailId.subject,
                    sender: r.emailId.sender,
                    receivedAt: r.emailId.receivedAt,
                } : null,
                remindAt: r.remindAt,
                status: r.status,
                reason: r.reason,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reminders',
        });
    }
});

// Cancel a reminder
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const reminderId = req.params.id;

        const reminder = await EmailReminder.findOne({
            _id: reminderId,
            userId,
        });

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found',
            });
        }

        reminder.status = 'cancelled';
        await reminder.save();

        res.json({
            success: true,
            message: 'Reminder cancelled',
        });
    } catch (error) {
        console.error('Cancel reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel reminder',
        });
    }
});

module.exports = router;
