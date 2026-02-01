const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Register push token
router.post('/register', authMiddleware, async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.userId;

        if (!pushToken) {
            return res.status(400).json({
                success: false,
                message: 'Push token is required',
            });
        }

        // Update user's push token
        await User.findByIdAndUpdate(userId, {
            pushToken,
        });

        res.json({
            success: true,
            message: 'Push token registered successfully',
        });
    } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register push token',
        });
    }
});

// Unregister push token
router.post('/unregister', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        await User.findByIdAndUpdate(userId, {
            pushToken: null,
        });

        res.json({
            success: true,
            message: 'Push token unregistered successfully',
        });
    } catch (error) {
        console.error('Error unregistering push token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unregister push token',
        });
    }
});

// Update notification settings
router.put('/settings', authMiddleware, async (req, res) => {
    try {
        const { reminders, decisionFollowUps, urgentEmails } = req.body;
        const userId = req.userId;

        const updateData = {};
        if (typeof reminders === 'boolean') {
            updateData['notificationSettings.reminders'] = reminders;
        }
        if (typeof decisionFollowUps === 'boolean') {
            updateData['notificationSettings.decisionFollowUps'] = decisionFollowUps;
        }
        if (typeof urgentEmails === 'boolean') {
            updateData['notificationSettings.urgentEmails'] = urgentEmails;
        }

        await User.findByIdAndUpdate(userId, updateData);

        res.json({
            success: true,
            message: 'Notification settings updated successfully',
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings',
        });
    }
});

// Get notification settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('notificationSettings pushToken');

        res.json({
            success: true,
            settings: user.notificationSettings || {
                reminders: true,
                decisionFollowUps: true,
                urgentEmails: false,
            },
            hasToken: !!user.pushToken,
        });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification settings',
        });
    }
});

module.exports = router;
