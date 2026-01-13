const express = require('express');
const authMiddleware = require('../middleware/auth');
const Task = require('../models/Task');
const Email = require('../models/Email');

const router = express.Router();

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filters
 * @access  Protected
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { status, priority, limit = 50 } = req.query;

        // Build query
        const query = { userId };
        if (status) query.status = status;
        if (priority) query.priority = priority.toUpperCase();

        const tasks = await Task.find(query)
            .populate('sourceEmailId', 'subject from')
            .sort({ priority: -1, dueDate: 1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
        });
    }
});

/**
 * @route   POST /api/tasks
 * @desc    Create manual task
 * @access  Protected
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required',
            });
        }

        const task = new Task({
            userId: req.userId,
            title,
            description,
            priority: priority || 'MEDIUM',
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: 'user',
        });

        await task.save();

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task,
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
        });
    }
});

/**
 * @route   POST /api/tasks/from-email/:emailId
 * @desc    Create task from AI suggestion
 * @access  Protected
 */
router.post('/from-email/:emailId', authMiddleware, async (req, res) => {
    try {
        const email = await Email.findOne({
            _id: req.params.emailId,
            userId: req.userId,
        });

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found',
            });
        }

        // Find CREATE_TASK action in suggestions (if AI analysis exists)
        let taskTitle, taskPriority;

        if (email.aiAnalysis && email.aiAnalysis.suggestedActions) {
            const taskAction = email.aiAnalysis.suggestedActions.find(
                action => action.type === 'CREATE_TASK'
            );

            if (taskAction) {
                taskTitle = taskAction.description;
                taskPriority = email.aiAnalysis.urgency;
            }
        }

        // Fallback: Create task from email subject if no AI suggestion
        if (!taskTitle) {
            taskTitle = email.subject || 'Task from email';
            taskPriority = 'MEDIUM';
        }

        // Create task
        const task = new Task({
            userId: req.userId,
            title: taskTitle,
            description: `From email: ${email.subject}\n\nFrom: ${email.from}`,
            priority: taskPriority,
            sourceEmailId: email._id,
            createdBy: email.aiAnalysis ? 'ai' : 'user',
        });

        await task.save();

        // Mark email as approved
        email.userAction = 'approved';
        await email.save();

        res.status(201).json({
            success: true,
            message: 'Task created from email',
            task,
        });
    } catch (error) {
        console.error('Error creating task from email:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
        });
    }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Protected
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority, dueDate } = req.body;

        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Update fields
        if (title) task.title = title;
        if (description) task.description = description;
        if (status) task.status = status;
        if (priority) task.priority = priority;
        if (dueDate) task.dueDate = new Date(dueDate);

        // Set completion time if marking as completed
        if (status === 'completed' && task.status !== 'completed') {
            task.completedAt = new Date();
        }

        await task.save();

        res.json({
            success: true,
            message: 'Task updated successfully',
            task,
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task',
        });
    }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Protected
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
        });
    }
});

module.exports = router;
