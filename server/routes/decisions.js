const express = require('express');
const authMiddleware = require('../middleware/auth');
const Decision = require('../models/Decision');
const Task = require('../models/Task');

const router = express.Router();

/**
 * @route   GET /api/decisions/pending
 * @desc    Get pending decisions due for follow-up
 * @access  Protected
 */
router.get('/pending', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Auto-complete decisions where linked task is completed
        await autoCompleteFromTasks(userId);

        // Get pending decisions due for follow-up
        const pendingDecisions = await Decision.find({
            userId,
            status: 'PENDING',
            followUpAt: { $lte: new Date() },
        })
            .sort({ createdAt: 1 }) // Oldest first
            .limit(3) // Max 3 at a time
            .populate('emailId', 'subject from');

        res.json({
            success: true,
            decisions: pendingDecisions,
        });
    } catch (error) {
        console.error('Error fetching pending decisions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending decisions',
        });
    }
});

/**
 * @route   POST /api/decisions/:id/resolve
 * @desc    Resolve a decision (complete, snooze, or abandon)
 * @access  Protected
 */
router.post('/:id/resolve', authMiddleware, async (req, res) => {
    try {
        const { resolution } = req.body;

        if (!['COMPLETED', 'SNOOZED', 'ABANDONED'].includes(resolution)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid resolution. Must be: COMPLETED, SNOOZED, or ABANDONED',
            });
        }

        const decision = await Decision.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!decision) {
            return res.status(404).json({
                success: false,
                message: 'Decision not found',
            });
        }

        // Update decision based on resolution
        if (resolution === 'COMPLETED') {
            decision.status = 'COMPLETED';
            decision.completedAt = new Date();
            decision.timeToComplete = decision.completedAt - decision.createdAt;
        } else if (resolution === 'SNOOZED') {
            decision.snoozeCount += 1;
            decision.followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
        } else {
            decision.status = 'ABANDONED';
        }

        await decision.save();

        res.json({
            success: true,
            message: `Decision ${resolution.toLowerCase()}`,
            decision,
        });
    } catch (error) {
        console.error('Error resolving decision:', error);
        res.status(500).json({
            success: false,
            message: 'Error resolving decision',
        });
    }
});

/**
 * Helper: Auto-complete decisions where linked task is completed
 */
async function autoCompleteFromTasks(userId) {
    try {
        const pendingDecisions = await Decision.find({
            userId,
            status: 'PENDING',
            taskId: { $ne: null },
        });

        for (const decision of pendingDecisions) {
            const task = await Task.findById(decision.taskId);
            if (task && task.status === 'completed') {
                decision.status = 'COMPLETED';
                decision.completedAt = task.completedAt || new Date();
                decision.timeToComplete = decision.completedAt - decision.createdAt;
                await decision.save();
                console.log(`✨ Auto-completed decision from task: ${decision.decisionText}`);
            }
        }
    } catch (error) {
        console.error('Error auto-completing decisions:', error);
    }
}

module.exports = router;
