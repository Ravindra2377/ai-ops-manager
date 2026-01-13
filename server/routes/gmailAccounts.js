const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Email = require('../models/Email');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/gmail/accounts
 * List all connected Gmail accounts for the user
 */
router.get('/accounts', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('gmailAccounts activeGmailAccountId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Format accounts for response (don't send tokens)
        const accounts = user.gmailAccounts.map(account => ({
            id: account._id,
            email: account.email,
            label: account.label,
            isPrimary: account.isPrimary,
            status: account.status,
            provider: account.provider,
            lastSyncAt: account.lastSyncAt,
            connectedAt: account.connectedAt,
        }));

        res.json({
            success: true,
            accounts,
            activeAccountId: user.activeGmailAccountId,
        });
    } catch (error) {
        console.error('Error fetching Gmail accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Gmail accounts',
        });
    }
});

/**
 * POST /api/gmail/accounts/:id/set-primary
 * Set a Gmail account as primary
 */
router.post('/accounts/:id/set-primary', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Find the account
        const account = user.gmailAccounts.id(id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Gmail account not found',
            });
        }

        // Set all accounts to non-primary
        user.gmailAccounts.forEach(acc => {
            acc.isPrimary = false;
        });

        // Set selected account as primary
        account.isPrimary = true;
        user.activeGmailAccountId = account._id;

        await user.save();

        res.json({
            success: true,
            message: `${account.label} account is now primary`,
            account: {
                id: account._id,
                email: account.email,
                label: account.label,
                isPrimary: account.isPrimary,
            },
        });
    } catch (error) {
        console.error('Error setting primary account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set primary account',
        });
    }
});

/**
 * DELETE /api/gmail/accounts/:id
 * Disconnect a Gmail account
 */
router.delete('/accounts/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Cannot delete if only account
        if (user.gmailAccounts.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot disconnect your only Gmail account',
            });
        }

        // Find the account
        const account = user.gmailAccounts.id(id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Gmail account not found',
            });
        }

        const wasPrimary = account.isPrimary;
        const accountEmail = account.email;

        // Remove account
        user.gmailAccounts.pull(id);

        // If deleted account was primary, promote another
        if (wasPrimary && user.gmailAccounts.length > 0) {
            user.gmailAccounts[0].isPrimary = true;
            user.activeGmailAccountId = user.gmailAccounts[0]._id;
        }

        // If no accounts left, clear active account
        if (user.gmailAccounts.length === 0) {
            user.activeGmailAccountId = null;
            user.isGmailConnected = false;
        }

        await user.save();

        // Delete all emails associated with this account
        await Email.deleteMany({
            userId: req.userId,
            gmailAccountId: id,
        });

        res.json({
            success: true,
            message: `Disconnected ${accountEmail}`,
            remainingAccounts: user.gmailAccounts.length,
        });
    } catch (error) {
        console.error('Error disconnecting account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect account',
        });
    }
});

/**
 * POST /api/gmail/accounts/check-limit
 * Check if user can add more accounts (premium gating)
 */
router.post('/accounts/check-limit', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('gmailAccounts subscriptionTier');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const currentCount = user.gmailAccounts.length;
        const maxAccounts = user.subscriptionTier === 'free' ? 1 : 3;
        const canAdd = currentCount < maxAccounts;

        res.json({
            success: true,
            canAdd,
            currentCount,
            maxAccounts,
            subscriptionTier: user.subscriptionTier,
            needsUpgrade: !canAdd && user.subscriptionTier === 'free',
        });
    } catch (error) {
        console.error('Error checking account limit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check account limit',
        });
    }
});

module.exports = router;
