const express = require('express');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');
const { google } = require('googleapis');
const { authLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Gmail OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Create user
        const user = new User({ email, password });
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                isGmailConnected: user.isGmailConnected,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Account not found. Please sign up first.',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate token
        const token = user.generateAuthToken();

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                isGmailConnected: user.isGmailConnected,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
        });
    }
});

/**
 * @route   GET /api/auth/gmail/authorize
 * @desc    Initiate Gmail OAuth flow
 * @access  Protected
 * @query   userId - User ID
 * @query   label - Account label (Work/Personal/Other) - optional, for adding accounts
 * @query   addingAccount - Boolean, true if adding additional account
 */
router.get('/gmail/authorize', (req, res) => {
    try {
        // Validate environment variables
        if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REDIRECT_URI) {
            return res.status(500).json({
                success: false,
                message: 'Gmail OAuth not configured on server. Please contact support.',
                error: 'Missing Gmail OAuth environment variables',
            });
        }

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar',
        ];

        // Build state object with userId, label, and addingAccount flag
        const stateData = {
            userId: req.query.userId,
            label: req.query.label || 'Personal', // Default to Personal
            addingAccount: req.query.addingAccount === 'true',
            timestamp: Date.now(),
        };

        // Encode state as base64 JSON
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: stateData.addingAccount ? 'select_account' : 'consent',
            state,
        });

        res.json({
            success: true,
            authUrl: url,
        });
    } catch (error) {
        console.error('Error generating Gmail auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate authorization URL',
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/auth/gmail/callback
 * @desc    Handle Gmail OAuth callback
 * @access  Public
 */
router.get('/gmail/callback', async (req, res) => {
    try {
        console.log('Callback query params:', req.query);
        const { code, state: encodedState } = req.query;

        if (!code) {
            console.error('Authorization code missing from query');
            return res.status(400).send('Authorization code missing');
        }

        // Decode state
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(encodedState, 'base64').toString('utf-8'));
        } catch (error) {
            console.error('Failed to decode state:', error);
            return res.status(400).send('Invalid state parameter');
        }

        const { userId, label, addingAccount } = stateData;

        if (!userId) {
            return res.status(400).send('User ID missing from state');
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Get user email from Google
        oauth2Client.setCredentials(tokens);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const gmailEmail = profile.data.emailAddress;

        // Encrypt tokens before storing
        const encryptedAccessToken = encrypt(tokens.access_token);
        const encryptedRefreshToken = encrypt(tokens.refresh_token);

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (addingAccount) {
            // ADDING ADDITIONAL ACCOUNT

            // Check account limit
            const maxAccounts = user.subscriptionTier === 'free' ? 1 : 3;
            if (user.gmailAccounts.length >= maxAccounts) {
                return res.status(403).send(`
                    <html>
                        <body>
                            <h2>Account Limit Reached</h2>
                            <p>You can connect up to ${maxAccounts} Gmail account(s) with your ${user.subscriptionTier} plan.</p>
                            <p>${user.subscriptionTier === 'free' ? 'Upgrade to Premium to connect up to 3 accounts.' : ''}</p>
                            <script>setTimeout(() => window.close(), 5000);</script>
                        </body>
                    </html>
                `);
            }

            // Check if account already connected
            const existingAccount = user.gmailAccounts.find(acc => acc.email === gmailEmail);
            if (existingAccount) {
                return res.status(400).send(`
                    <html>
                        <body>
                            <h2>Account Already Connected</h2>
                            <p>${gmailEmail} is already connected to your account.</p>
                            <script>setTimeout(() => window.close(), 3000);</script>
                        </body>
                    </html>
                `);
            }

            // Add new account to gmailAccounts array
            const newAccount = {
                email: gmailEmail,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                label: label || 'Personal',
                isPrimary: user.gmailAccounts.length === 0, // First account is primary
                status: 'connected',
                provider: 'gmail',
                lastSyncAt: null,
                connectedAt: new Date(),
            };

            user.gmailAccounts.push(newAccount);

            // Set as active account
            user.activeGmailAccountId = user.gmailAccounts[user.gmailAccounts.length - 1]._id;
            user.isGmailConnected = true;

            await user.save();

            res.send(`
                <html>
                    <body>
                        <h2>Gmail Account Added Successfully!</h2>
                        <p>${gmailEmail} (${label}) has been connected.</p>
                        <p>You can close this window and return to the app.</p>
                        <script>setTimeout(() => window.close(), 2000);</script>
                    </body>
                </html>
            `);
        } else {
            // FIRST-TIME CONNECTION (Legacy flow for backward compatibility)

            // Update legacy fields
            user.gmailAccessToken = encryptedAccessToken;
            user.gmailRefreshToken = encryptedRefreshToken;
            user.isGmailConnected = true;

            // Also add to gmailAccounts array for new multi-account support
            if (user.gmailAccounts.length === 0) {
                user.gmailAccounts.push({
                    email: gmailEmail,
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken,
                    label: 'Personal',
                    isPrimary: true,
                    status: 'connected',
                    provider: 'gmail',
                    lastSyncAt: null,
                    connectedAt: new Date(),
                });
                user.activeGmailAccountId = user.gmailAccounts[0]._id;
            }

            await user.save();

            res.send(`
                <html>
                    <body>
                        <h2>Gmail Connected Successfully!</h2>
                        <p>You can close this window and return to the app.</p>
                        <script>setTimeout(() => window.close(), 2000);</script>
                    </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Gmail OAuth callback error:', error);
        res.status(500).send('Error connecting Gmail. Please try again.');
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user data
 * @access  Protected
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
