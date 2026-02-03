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
// Upgraded to Gemini 1.5 Flash as 2.0 might be restricted
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        signalScore: -999 // Debugging: failed
    };
}

/**
 * Detect high/low signals before AI processing
 * @param {string} from
 * @param {string} subject
 * @param {string} body
 */
/**
 * Explicit, frozen weights for signal scoring
 * This prevents accidental drift in priority logic.
 */
const SIGNAL_WEIGHTS = Object.freeze({
    // High Signals
    QUESTION: 3,
    ACTION: 4,      // approve, review
    URGENCY: 3,     // deadline, eod, today
    EXPLICIT_URGENCY: 3, // urgent, asap

    // Negative Signals
    UNSUBSCRIBE: -4,
    SALE: -6,
    OFFER: -6,
    NEWSLETTER: -8,
    NO_REPLY: -5
});

/**
 * Detect high/low signals before AI processing
 * @param {string} from
 * @param {string} subject
 * @param {string} body
 */
function calculateSignalScore(from, subject, body) {
    let score = 0;
    try {
        const combinedText = `${subject} ${body}`.toLowerCase();
        const sender = from ? from.toLowerCase() : '';

        // High Signals
        if (combinedText.includes('?')) score += SIGNAL_WEIGHTS.QUESTION;
        if (combinedText.includes('approve') || combinedText.includes('review')) score += SIGNAL_WEIGHTS.ACTION;
        if (combinedText.includes('deadline') || combinedText.includes('eod') || combinedText.includes('today')) score += SIGNAL_WEIGHTS.URGENCY;
        if (combinedText.includes('urgent') || combinedText.includes('asap')) score += SIGNAL_WEIGHTS.EXPLICIT_URGENCY;

        // Negative Signals (Marketing/Noise)
        if (combinedText.includes('unsubscribe')) score += SIGNAL_WEIGHTS.UNSUBSCRIBE;
        if (combinedText.includes('sale') || combinedText.includes('% off')) score += SIGNAL_WEIGHTS.SALE;
        if (combinedText.includes('limited time') || combinedText.includes('offer')) score += SIGNAL_WEIGHTS.OFFER;
        if (combinedText.includes('newsletter') || combinedText.includes('digest')) score += SIGNAL_WEIGHTS.NEWSLETTER;
        if (sender.includes('no-reply') || sender.includes('noreply')) score += SIGNAL_WEIGHTS.NO_REPLY;

        return score;
    } catch (error) {
        // Fallback safely
        return 0;
    }
}

/**
 * Apply hard rules and confidence gating to AI output
 * @param {Object} analysis - AI result
 * @param {number} score - Calculated signal score
 */
function applyPriorityRules(analysis, score) {
    let finalUrgency = analysis.urgency;
    let reasoning = analysis.reasoning;

    // 1. Confidence Gating
    if (analysis.confidence && analysis.confidence < 0.6) {
        if (finalUrgency !== 'LOW') {
            finalUrgency = 'LOW';
            reasoning = `[System] Downgraded to LOW due to low confidence (${analysis.confidence}).`;
        }
    }

    // 2. Marketing/Noise System Override
    if (score <= -5) {
        finalUrgency = 'LOW';
        reasoning = '[System] Identified as Marketing/Newsletter based on keywords.';
    }

    // 3. Strict HIGH Enforcement
    if (finalUrgency === 'HIGH' && score < 5) {
        finalUrgency = 'MEDIUM'; // Downgrade "fake HIGHs"
        reasoning = `[System] Downgraded to MEDIUM. AI marked HIGH but signal score was weak (${score}).`;
    }

    // 4. Force Distribution (Medium is only for positive scores)
    // Ensure strict type checking
    if (finalUrgency === 'MEDIUM' && Number(score) <= 0) {
        finalUrgency = 'LOW';
        reasoning = `[System] Downgraded to LOW. Medium priority requires positive signal score.`;
    }

    return {
        ...analysis,
        urgency: finalUrgency, // Ensure clean string
        reasoning: reasoning
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

        // STEP 1: Calculate Pre-AI Signal Score
        const signalScore = calculateSignalScore(from, subject, body);

        // OPTIMIZATION: Use Single-Shot Composite Analysis reduces API calls from 4 to 1
        const { COMPOSITE_ANALYSIS_PROMPT } = require('../prompts/emailAnalysis');
        const prompt = COMPOSITE_ANALYSIS_PROMPT(from, subject, body);

        const result = await makeRequestWithRetry(() => model.generateContent(prompt));
        const response = result.response.text();

        // Robust JSON parsing
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const rawAnalysis = JSON.parse(jsonMatch[0]);

        // STEP 2: Apply Priority Rules (Post-Processing)
        const refinedAnalysis = applyPriorityRules(rawAnalysis, signalScore);

        return {
            intent: refinedAnalysis.intent || 'UNKNOWN',
            urgency: refinedAnalysis.urgency || 'MEDIUM',
            summary: refinedAnalysis.summary || subject,
            confidenceScore: refinedAnalysis.confidence || 0.5,
            reasoning: refinedAnalysis.reasoning || 'AI analysis',
            suggestedActions: refinedAnalysis.suggestedActions || [],
            draftReply: null, // Saved for later (on demand) to save tokens
            modelVersion: 'gemini-1.5-flash',
            signalScore: signalScore // Log for debugging
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
    SIGNAL_WEIGHTS,
};
