const express = require('express');
const authMiddleware = require('../middleware/auth');
const { fetchEmails, createDraftReply } = require('../services/gmailService');
const { analyzeEmail } = require('../services/aiService');
const Email = require('../models/Email');
const User = require('../models/User');
const UserActionLog = require('../models/UserActionLog');
const { syncLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/emails/sync
 * @desc    Manually trigger email sync and AI analysis
 * @access  Protected
 */
router.post('/sync', authMiddleware, syncLimiter, async (req, res) => {
    try {
        const userId = req.userId;
        const { maxResults = 10 } = req.body;

        // Check if Gmail is connected
        const user = await User.findById(userId);
        if (!user.isGmailConnected) {
            return res.status(400).json({
                success: false,
                message: 'Gmail not connected. Please connect your Gmail account first.',
            });
        }

        // Fetch emails from Gmail
        console.log(`Fetching ${maxResults} emails for user ${userId}...`);
        const gmailEmails = await fetchEmails(userId, maxResults);

        if (gmailEmails.length === 0) {
            return res.json({
                success: true,
                message: 'No new emails found',
                emailsProcessed: 0,
            });
        }

        // Process each email
        const processedEmails = [];
        const skippedEmails = [];
        const failedEmails = [];

        for (const emailData of gmailEmails) {
            // IDEMPOTENCY: Check if email already exists
            const existingEmail = await Email.findOne({
                gmailMessageId: emailData.gmailMessageId,
            });

            if (existingEmail) {
                console.log(`✓ Email ${emailData.gmailMessageId} already processed, skipping...`);
                skippedEmails.push(emailData.gmailMessageId);
                continue;
            }

            // Create email record first (before AI analysis)
            const email = new Email({
                userId,
                ...emailData,
                aiProcessingStatus: 'processing',
            });

            try {
                // Analyze email with AI
                console.log(`🤖 Analyzing: ${emailData.subject}`);
                const aiAnalysis = await analyzeEmail({
                    from: emailData.from.email,
                    subject: emailData.subject,
                    body: emailData.body,
                });

                // Update with AI results
                email.aiAnalysis = aiAnalysis;
                email.aiProcessingStatus = 'completed';

                if (aiAnalysis.aiLastError) {
                    email.aiLastError = aiAnalysis.aiLastError;
                }

                await email.save();
                processedEmails.push(email);

                console.log(`✅ Processed: ${emailData.subject} (${aiAnalysis.intent}, ${aiAnalysis.urgency})`);
            } catch (error) {
                // AI failed - save email anyway with failed status
                console.error(`❌ AI analysis failed for: ${emailData.subject}`, error.message);

                email.aiProcessingStatus = 'failed';
                email.aiLastError = error.message;
                email.aiRetryCount += 1;

                await email.save();
                failedEmails.push({
                    subject: emailData.subject,
                    error: error.message,
                });
            }
        }

        // Rate Limit Safety: Wait 4s between emails (Strict 15 RPM limit)
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Update last sync time
        user.lastSyncAt = new Date();
        res.json({
            success: true,
            message: `Successfully processed ${processedEmails.length} emails`,
            emailsProcessed: processedEmails.length,
            emailsSkipped: skippedEmails.length,
            emailsFailed: failedEmails.length,
            emails: processedEmails.map(e => ({
                id: e._id,
                subject: e.subject,
                from: e.from,
                intent: e.aiAnalysis.intent,
                urgency: e.aiAnalysis.urgency,
                confidence: e.aiAnalysis.confidenceScore,
                accountLabel: e.gmailAccountId ?
                    (user.gmailAccounts.find(acc => acc._id.toString() === e.gmailAccountId.toString())?.label || 'Personal')
                    : 'Personal',
            })),
            failures: failedEmails.length > 0 ? failedEmails : undefined,
        });
    } catch (error) {
        console.error('Email sync error:', error);

        // Provide specific error messages based on error type
        let errorMessage = 'Error syncing emails';
        let statusCode = 500;

        if (error.message?.includes('not found or Gmail not connected')) {
            errorMessage = 'Gmail account not connected. Please reconnect your Gmail account.';
            statusCode = 401;
        } else if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
            errorMessage = 'Gmail access expired. Please reconnect your Gmail account.';
            statusCode = 401;
        } else if (error.code === 429 || error.message?.includes('rate limit')) {
            errorMessage = 'Too many requests. Please try again in a few minutes.';
            statusCode = 429;
        } else if (error.code === 403) {
            errorMessage = 'Gmail API access denied. Please check permissions.';
            statusCode = 403;
        } else if (error.message) {
            errorMessage = `Sync failed: ${error.message}`;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message,
            needsReconnect: statusCode === 401,
        });
    }
});

/**
 * @route   GET /api/emails
 * @desc    Get all processed emails with filters
 * @access  Protected
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { urgency, userAction, limit = 500 } = req.query;

        // Build query
        const query = { userId };
        if (urgency) {
            query['aiAnalysis.urgency'] = { $regex: new RegExp(`^${urgency}$`, 'i') };
        }
        if (userAction) query.userAction = userAction;

        // Fetch user to get account labels
        const user = await User.findById(userId).select('gmailAccounts');
        const accountMap = {};
        if (user && user.gmailAccounts) {
            user.gmailAccounts.forEach(acc => {
                accountMap[acc._id.toString()] = acc.label;
            });
        }

        const emails = await Email.find(query)
            .sort({ receivedAt: -1 })
            .limit(parseInt(limit));

        // Inject account label
        const emailsWithLabels = emails.map(email => {
            const emailObj = email.toObject();
            if (email.gmailAccountId) {
                emailObj.accountLabel = accountMap[email.gmailAccountId.toString()] || 'Personal';
            } else {
                // Fallback for legacy emails (assume primary/personal)
                emailObj.accountLabel = user?.gmailAccounts?.[0]?.label || 'Personal';
            }
            return emailObj;
        });

        res.json({
            success: true,
            count: emailsWithLabels.length,
            emails: emailsWithLabels,
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching emails',
        });
    }
});

/**
 * @route   GET /api/emails/:id
 * @desc    Get single email with full details
 * @access  Protected
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const email = await Email.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found',
            });
        }

        res.json({
            success: true,
            email,
        });
    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching email',
        });
    }
});

/**
 * @route   POST /api/emails/:id/action
 * @desc    User approves/rejects AI suggestion
 * @access  Protected
 */
router.post('/:id/action', authMiddleware, async (req, res) => {
    try {
        const { action } = req.body; // 'approved', 'rejected', 'ignored'

        if (!['approved', 'rejected', 'ignored'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be: approved, rejected, or ignored',
            });
        }

        const email = await Email.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found',
            });
        }

        email.userAction = action;
        await email.save();

        // DECISION FOLLOW-THROUGH: Create decision for meaningful approved actions
        if (action === 'approved' && email.aiAnalysis.suggestedActions && email.aiAnalysis.suggestedActions.length > 0) {
            const Decision = require('../models/Decision');
            const primaryAction = email.aiAnalysis.suggestedActions[0];

            // Only create decision for actions that imply future work
            if (['REPLY', 'CREATE_TASK', 'SCHEDULE_MEETING', 'FOLLOW_UP'].includes(primaryAction.type)) {
                const decisionType = primaryAction.type === 'CREATE_TASK' ? 'TASK' :
                    primaryAction.type === 'FOLLOW_UP' ? 'REMINDER' : 'REPLY';

                const decision = new Decision({
                    userId: req.userId,
                    emailId: email._id,
                    decisionType,
                    decisionText: primaryAction.description || email.subject,
                    source: 'EMAIL',
                    createdAt: new Date(),
                    followUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
                    status: 'PENDING',
                });

                await decision.save();
                console.log(`📋 Created decision: ${decision.decisionText}`);
            }
        }

        // AUDIT LOG: Track user actions for ML training
        const actionLog = new UserActionLog({
            userId: req.userId,
            emailId: email._id,
            action,
            aiSuggestion: {
                intent: email.aiAnalysis.intent,
                urgency: email.aiAnalysis.urgency,
                suggestedActions: email.aiAnalysis.suggestedActions,
            },
        });
        await actionLog.save();

        res.json({
            success: true,
            message: `Email marked as ${action}`,
            email,
        });
    } catch (error) {
        console.error('Error updating email action:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating email action',
        });
    }
});

/**
 * @route   POST /api/emails/:id/draft-reply
 * @desc    Save AI-generated draft reply to Gmail
 * @access  Protected
 */
router.post('/:id/draft-reply', authMiddleware, async (req, res) => {
    try {
        const email = await Email.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found',
            });
        }

        if (!email.aiAnalysis.draftReply) {
            return res.status(400).json({
                success: false,
                message: 'No draft reply available for this email',
            });
        }

        // Create draft in Gmail
        const draft = await createDraftReply(
            req.userId,
            email.threadId,
            email.aiAnalysis.draftReply
        );

        res.json({
            success: true,
            message: 'Draft reply saved to Gmail',
            draftId: draft.id,
        });
    } catch (error) {
        console.error('Error creating draft reply:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating draft reply',
        });
    }
});

/**
 * @route   GET /api/emails/stats
 * @desc    Get email statistics for dashboard
 * @access  Protected
 */
router.get('/stats/overview', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const [total, pending, highUrgency, mediumUrgency, lowUrgency] = await Promise.all([
            Email.countDocuments({ userId }),
            Email.countDocuments({ userId, userAction: 'pending' }),
            Email.countDocuments({ userId, 'aiAnalysis.urgency': 'HIGH' }),
            Email.countDocuments({ userId, 'aiAnalysis.urgency': 'MEDIUM' }),
            Email.countDocuments({ userId, 'aiAnalysis.urgency': 'LOW' }),
        ]);

        res.json({
            success: true,
            stats: {
                total,
                pending,
                urgency: {
                    high: highUrgency,
                    medium: mediumUrgency,
                    low: lowUrgency,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
        });
    }
});

module.exports = router;
