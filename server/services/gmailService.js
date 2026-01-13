const { google } = require('googleapis');
const User = require('../models/User');
const { decrypt } = require('../utils/encryption');

/**
 * Get authenticated Gmail client for a user
 */
async function getGmailClient(userId) {
    try {
        const user = await User.findById(userId);

        if (!user || !user.gmailAccessToken) {
            throw new Error('User not found or Gmail not connected');
        }

        // Decrypt tokens
        const accessToken = decrypt(user.gmailAccessToken);
        const refreshToken = decrypt(user.gmailRefreshToken);

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );

        // Set credentials
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        // Handle token refresh automatically
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                // Update refresh token if new one provided
                const { encrypt } = require('../utils/encryption');
                user.gmailRefreshToken = encrypt(tokens.refresh_token);
            }
            if (tokens.access_token) {
                const { encrypt } = require('../utils/encryption');
                user.gmailAccessToken = encrypt(tokens.access_token);
                await user.save();
            }
        });

        return google.gmail({ version: 'v1', auth: oauth2Client });
    } catch (error) {
        console.error('Error getting Gmail client:', error);
        throw error;
    }
}

/**
 * Fetch recent emails from Gmail
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum number of emails to fetch (default: 10)
 * @returns {Array} - Array of email objects
 */
async function fetchEmails(userId, maxResults = 10) {
    try {
        const gmail = await getGmailClient(userId);

        // List messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: maxResults,
            q: 'in:inbox', // Only inbox emails
        });

        const messages = response.data.messages || [];

        if (messages.length === 0) {
            return [];
        }

        // Fetch full details for each message
        const emailPromises = messages.map(async (message) => {
            const emailData = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full',
            });

            return parseEmailData(emailData.data);
        });

        const emails = await Promise.all(emailPromises);
        return emails;
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

/**
 * Parse Gmail API email data into our format
 */
function parseEmailData(emailData) {
    const headers = emailData.payload.headers;

    // Extract headers
    const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
    };

    const from = parseEmailAddress(getHeader('From'));
    const to = parseEmailAddress(getHeader('To'));
    const subject = getHeader('Subject');
    const date = new Date(parseInt(emailData.internalDate));

    // Extract body and attachments
    let body = '';
    let bodyHtml = '';
    let snippet = emailData.snippet || '';
    let attachments = [];

    if (emailData.payload.body.data) {
        const rawContent = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
        bodyHtml = rawContent; // Store original
        body = cleanEmailBody(rawContent); // Clean for AI
    } else if (emailData.payload.parts) {
        // Multi-part email - prefer text/plain over text/html
        const plainTextPart = emailData.payload.parts.find(
            part => part.mimeType === 'text/plain'
        );
        const htmlPart = emailData.payload.parts.find(
            part => part.mimeType === 'text/html'
        );

        // For HTML storage: prefer HTML, fallback to plain
        if (htmlPart && htmlPart.body.data) {
            bodyHtml = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        } else if (plainTextPart && plainTextPart.body.data) {
            bodyHtml = Buffer.from(plainTextPart.body.data, 'base64').toString('utf-8');
        }

        // For AI analysis: prefer plain text, fallback to cleaned HTML
        const textPart = plainTextPart || htmlPart;
        if (textPart && textPart.body.data) {
            const rawContent = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            body = cleanEmailBody(rawContent);
        }

        // Extract attachments
        attachments = emailData.payload.parts
            .filter(part => part.filename && part.filename.length > 0)
            .map(part => ({
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.body.size || 0,
                attachmentId: part.body.attachmentId
            }));
    }

    return {
        gmailMessageId: emailData.id,
        threadId: emailData.threadId,
        from,
        to: [to],
        subject,
        body,
        bodyHtml,
        snippet,
        attachments,
        receivedAt: date,
    };
}

/**
 * Parse email address from "Name <email@example.com>" format
 */
function parseEmailAddress(addressString) {
    if (!addressString) return { name: '', email: '' };

    const match = addressString.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
        return {
            name: match[1].trim().replace(/"/g, ''),
            email: match[2].trim(),
        };
    }

    return {
        name: '',
        email: addressString.trim(),
    };
}

/**
 * Clean email body (remove HTML tags, extra whitespace)
 */
function cleanEmailBody(body) {
    if (!body) return '';

    // Try to decode URL-encoded content first
    try {
        body = decodeURIComponent(body);
    } catch (e) {
        // If decoding fails, continue with original body
    }

    // Remove HTML tags (proper regex)
    let cleaned = body.replace(/<[^>]*>/g, ' ');

    // Decode HTML entities
    cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Limit length for AI processing (max 2000 chars)
    if (cleaned.length > 2000) {
        cleaned = cleaned.substring(0, 2000) + '...';
    }

    return cleaned;
}

/**
 * Get single email details
 */
async function getEmailDetails(userId, messageId) {
    try {
        const gmail = await getGmailClient(userId);

        const emailData = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
        });

        return parseEmailData(emailData.data);
    } catch (error) {
        console.error('Error getting email details:', error);
        throw error;
    }
}

/**
 * Create draft reply in Gmail
 */
async function createDraftReply(userId, threadId, replyContent) {
    try {
        const gmail = await getGmailClient(userId);

        // Create draft
        const draft = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: {
                    threadId: threadId,
                    raw: Buffer.from(
                        `Content-Type: text/plain; charset="UTF-8"\r\n` +
                        `MIME-Version: 1.0\r\n` +
                        `\r\n` +
                        `${replyContent}`
                    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
                },
            },
        });

        return draft.data;
    } catch (error) {
        console.error('Error creating draft reply:', error);
        throw error;
    }
}

/**
 * Watch inbox for new emails (Gmail push notifications)
 */
async function watchInbox(userId) {
    try {
        const gmail = await getGmailClient(userId);

        // Set up watch (requires Cloud Pub/Sub topic - we'll implement this later)
        const response = await gmail.users.watch({
            userId: 'me',
            requestBody: {
                topicName: 'projects/YOUR_PROJECT_ID/topics/gmail-notifications',
                labelIds: ['INBOX'],
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error setting up inbox watch:', error);
        // Don't throw - this is optional for MVP
        return null;
    }
}

module.exports = {
    getGmailClient,
    fetchEmails,
    getEmailDetails,
    createDraftReply,
    watchInbox,
};
