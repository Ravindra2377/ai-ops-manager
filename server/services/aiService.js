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
// Fallback to gemini-pro (v1.0) as 1.5-flash is returning 404s for this key/region
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

        // Step 1: Detect intent
        const intentResult = await detectIntent(from, subject, body);

        // Step 2: Assess urgency
        const urgencyResult = await assessUrgency(
            `From: ${from}\nSubject: ${subject}\nBody: ${body}`,
            intentResult.intent
        );

        // SAFETY NET: Force LOW for Marketing/Newsletters
        if (['MARKETING', 'NEWSLETTER', 'FYI'].includes(intentResult.intent) && urgencyResult.urgency !== 'LOW') {
            console.log(`🛡️ Safety Net: Downgrading ${intentResult.intent} to LOW`);
            urgencyResult.urgency = 'LOW';
            urgencyResult.reasoning = 'Automatically set to LOW based on Intent category.';
        }

        // Step 3: Suggest actions
        const actionsResult = await suggestActions(
            `From: ${from}\nSubject: ${subject}\nBody: ${body}`,
            intentResult.intent,
            urgencyResult.urgency
        );

        // Step 4: Generate crisp summary
        const summary = await generateEmailSummary(
            `From: ${from}\nSubject: ${subject}\nBody: ${body}`
        );

        // Step 5: Draft reply (if applicable)
        let draftReply = null;
        if (['MEETING_REQUEST', 'QUESTION', 'TASK_REQUEST'].includes(intentResult.intent)) {
            draftReply = await generateReplyDraft(
                `From: ${from}\nSubject: ${subject}\nBody: ${body}`,
                intentResult.intent,
                from
            );
        }

        return {
            intent: intentResult.intent,
            urgency: urgencyResult.urgency,
            summary: summary,
            confidenceScore: intentResult.confidence,
            reasoning: `Intent: ${intentResult.reasoning}. Urgency: ${urgencyResult.reasoning}`,
            suggestedActions: actionsResult.actions,
            draftReply,
            modelVersion: 'gemini-1.5-flash',
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
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    // Robust JSON parsing
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]);
}

/**
 * Assess urgency level
 */
async function assessUrgency(emailContent, intent) {
    const prompt = URGENCY_ASSESSMENT_PROMPT(emailContent, intent);
    const result = await model.generateContent(prompt);
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
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

/**
 * Generate crisp email summary (one-liner)
 */
async function generateEmailSummary(emailContent) {
    const prompt = `Summarize this email in ONE short sentence (max 10-12 words). Be crisp and specific.

Email:
${emailContent}

Return ONLY the summary sentence, nothing else.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

/**
 * Generate reply draft
 */
async function generateReplyDraft(emailContent, intent, senderName) {
    const prompt = REPLY_DRAFT_PROMPT(emailContent, intent, senderName);
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

/**
 * Generate daily brief
 */
async function generateDailyBrief(emails, tasks, timeOfDay = 'morning') {
    try {
        const prompt = DAILY_BRIEF_PROMPT(emails, tasks, timeOfDay);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('Error generating daily brief:', error);
        return {
            summary: "Unable to generate AI brief at this time (AI Service Unavailable). Please check your emails manually.",
            priorities: []
        };
    }
}

module.exports = {
    analyzeEmail,
    generateDailyBrief,
};
