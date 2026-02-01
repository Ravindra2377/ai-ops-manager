const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
    INTENT_DETECTION_PROMPT,
    URGENCY_ASSESSMENT_PROMPT,
    ACTION_SUGGESTION_PROMPT,
    REPLY_DRAFT_PROMPT,
    DAILY_BRIEF_PROMPT,
} = require('../prompts/emailAnalysis');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Upgraded to Gemini 2.0 Flash as 1.5/Pro are unavailable for this key
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Helper to handle rate limits (429) with exponential backoff
 */
async function makeRequestWithRetry(apiCallFn, retries = 3, delay = 2000) {
    try {
        return await apiCallFn();
    } catch (error) {
        if (error.status === 429 && retries > 0) {
            console.warn(`⚠️ Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeRequestWithRetry(apiCallFn, retries - 1, delay * 2);
        }
        throw error;
    }
}

// AI Kill Switch
const AI_ENABLED = process.env.AI_ENABLED !== 'false';

/**
 * Fallback analysis when AI is disabled or fails
 */
function getFallbackAnalysis() {
    return {
        intent: 'UNKNOWN',
        urgency: 'MEDIUM',
        confidenceScore: 0,
        reasoning: 'AI analysis unavailable - manual review needed',
        suggestedActions: [],
        draftReply: null,
        modelVersion: 'fallback',
    };
}

/**
 * Main function to analyze email with AI
 * @param {Object} emailData - Email object with from, subject, body
 * @returns {Object} - Complete AI analysis
 */
async function analyzeEmail(emailData) {
    // Kill switch check
    if (!AI_ENABLED) {
        console.log('⚠️  AI is disabled via AI_ENABLED flag');
        return getFallbackAnalysis();
    }

    try {
        const { from, subject, body } = emailData;

        // OPTIMIZATION: Use Single-Shot Composite Analysis reduces API calls from 4 to 1
        const { COMPOSITE_ANALYSIS_PROMPT } = require('../prompts/emailAnalysis');
        const prompt = COMPOSITE_ANALYSIS_PROMPT(from, subject, body);

        const result = await makeRequestWithRetry(() => model.generateContent(prompt));
        const response = result.response.text();

        // Robust JSON parsing
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const analysis = JSON.parse(jsonMatch[0]);

        return {
            intent: analysis.intent || 'UNKNOWN',
            urgency: analysis.urgency || 'MEDIUM',
            summary: analysis.summary || subject,
            confidenceScore: analysis.confidence || 0.5,
            reasoning: analysis.reasoning || 'AI analysis',
            suggestedActions: analysis.suggestedActions || [],
            draftReply: null, // Saved for later (on demand) to save tokens
            modelVersion: 'gemini-2.0-flash',
        };
    } catch (error) {
        console.error('AI analysis error:', error.message);

        // Log specific error types for monitoring
        if (error.message?.includes('quota')) {
            console.error('❌ Gemini API quota exceeded');
        } else if (error.message?.includes('API key')) {
            console.error('❌ Invalid Gemini API key');
        }

        // Return safe fallback with error info
        return {
            ...getFallbackAnalysis(),
            aiLastError: error.message,
        };
    }
}

/**
 * Detect email intent
 */
async function detectIntent(from, subject, body) {
    const prompt = INTENT_DETECTION_PROMPT(from, subject, body);
    const result = await makeRequestWithRetry(() => model.generateContent(prompt));
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]);
}

async function assessUrgency(emailContent, intent) {
    const prompt = URGENCY_ASSESSMENT_PROMPT(emailContent, intent);
    const result = await makeRequestWithRetry(() => model.generateContent(prompt));
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]);
}

/**
 * Suggest actions
 */
async function suggestActions(emailContent, intent, urgency) {
    const prompt = ACTION_SUGGESTION_PROMPT(emailContent, intent, urgency);
    const result = await makeRequestWithRetry(() => model.generateContent(prompt));
    const response = result.response.text();

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

async function generateEmailSummary(emailContent) {
    const prompt = `Summarize this email in ONE short sentence (max 10-12 words). Be crisp and specific.\n\nEmail:\n${emailContent}\n\nReturn ONLY the summary sentence, nothing else.`;
    const result = await makeRequestWithRetry(() => model.generateContent(prompt));
    return result.response.text().trim();
}

async function generateReplyDraft(emailContent, intent, senderName) {
    const prompt = REPLY_DRAFT_PROMPT(emailContent, intent, senderName);
    const result = await makeRequestWithRetry(() => model.generateContent(prompt));
    return result.response.text().trim();
}

async function generateDailyBrief(emails, tasks, timeOfDay = 'morning') {
    try {
        const prompt = DAILY_BRIEF_PROMPT(emails, tasks, timeOfDay);
        const result = await makeRequestWithRetry(() => model.generateContent(prompt));
        const response = result.response.text();

        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('Error generating daily brief:', error);
        return {
            summary: "Unable to generate AI brief at this time (High Traffic). Please check your emails manually.",
            priorities: []
        };
    }
}

module.exports = {
    analyzeEmail,
    generateDailyBrief,
};
