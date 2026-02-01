const express = require('express');
const authMiddleware = require('../middleware/auth');
const { generateDailyBrief } = require('../services/aiService');
const Email = require('../models/Email');
const Task = require('../models/Task');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   GET /api/dashboard/brief
 * @desc    Get AI-generated daily brief
 * @access  Protected
 */
router.get('/brief', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { timeOfDay = 'morning' } = req.query;

        // Get recent emails (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentEmails = await Email.find({
            userId,
            receivedAt: { $gte: oneDayAgo },
        })
            .sort({ receivedAt: -1 })
            .limit(20);

        // Get pending tasks
        const pendingTasks = await Task.find({
            userId,
            status: { $in: ['pending', 'in_progress'] },
        })
            .sort({ priority: -1, dueDate: 1 })
            .limit(10);

        // CACHING STRATEGY:
        // Only regenerate brief if it's older than 15 minutes OR if forceRefresh=true
        const user = await User.findById(userId);
        const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
        const isCacheValid = user.dailyBrief &&
            user.dailyBriefGeneratedAt &&
            (Date.now() - new Date(user.dailyBriefGeneratedAt).getTime() < CACHE_DURATION);

        if (isCacheValid && req.query.forceRefresh !== 'true') {
            return res.json({
                success: true,
                timeOfDay,
                brief: user.dailyBrief,
                emailCount: recentEmails.length,
                taskCount: pendingTasks.length,
                cached: true,
            });
        }

        // Format data for AI
        const emailsForAI = recentEmails.map(e => ({
            from: e.from.email,
            subject: e.subject,
            urgency: e.aiAnalysis.urgency,
            intent: e.aiAnalysis.intent,
        }));

        const tasksForAI = pendingTasks.map(t => ({
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate,
        }));

        // Generate brief with AI (with quota error handling)
        let brief;
        try {
            brief = await generateDailyBrief(emailsForAI, tasksForAI, timeOfDay);

            // Save to cache only if successful
            if (brief && brief.summary && !brief.summary.includes('Unable to generate')) {
                user.dailyBrief = brief;
                user.dailyBriefGeneratedAt = new Date();
                await user.save();
            }
        } catch (error) {
            // Graceful degradation for quota errors
            if (error.status === 429) {
                console.warn('⚠️ AI Quota exhausted, returning fallback brief');
                brief = {
                    summary: "AI quota reached. Your emails and tasks are being processed normally.",
                    priorities: [],
                    state: 'CLEAR'
                };
            } else {
                throw error; // Re-throw non-quota errors
            }
        }

        res.json({
            success: true,
            timeOfDay,
            brief,
            emailCount: recentEmails.length,
            taskCount: pendingTasks.length,
            cached: false,
        });
    } catch (error) {
        console.error('Error generating daily brief:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating daily brief',
        });
    }
});

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard overview statistics
 * @access  Protected
 */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Get email stats
        const [
            totalEmails,
            pendingEmails,
            highUrgencyEmails,
            totalTasks,
            pendingTasks,
            completedTasks,
        ] = await Promise.all([
            Email.countDocuments({ userId }),
            Email.countDocuments({ userId, userAction: 'pending' }),
            Email.countDocuments({ userId, 'aiAnalysis.urgency': 'HIGH', userAction: 'pending' }),
            Task.countDocuments({ userId }),
            Task.countDocuments({ userId, status: { $in: ['pending', 'in_progress'] } }),
            Task.countDocuments({ userId, status: 'completed' }),
        ]);

        // Get recent high-priority items
        const highPriorityEmails = await Email.find({
            userId,
            'aiAnalysis.urgency': 'HIGH',
            userAction: 'pending',
        })
            .sort({ receivedAt: -1 })
            .limit(5)
            .select('subject from aiAnalysis.intent receivedAt');

        const urgentTasks = await Task.find({
            userId,
            priority: 'HIGH',
            status: { $in: ['pending', 'in_progress'] },
        })
            .sort({ dueDate: 1 })
            .limit(5)
            .select('title priority dueDate createdBy');

        res.json({
            success: true,
            stats: {
                emails: {
                    total: totalEmails,
                    pending: pendingEmails,
                    highUrgency: highUrgencyEmails,
                },
                tasks: {
                    total: totalTasks,
                    pending: pendingTasks,
                    completed: completedTasks,
                },
            },
            highlights: {
                highPriorityEmails,
                urgentTasks,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
        });
    }
});

module.exports = router;
