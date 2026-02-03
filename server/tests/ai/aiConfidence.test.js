const { analyzeEmail } = require('../../services/aiService');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

jest.setTimeout(30000);

describe("AI Confidence Gating", () => {
    test("downgrades MEDIUM to LOW when confidence < 0.6", async () => {
        // A vague email that AI might be unsure about
        const email = {
            subject: "Quick question",
            from: "unknown@external.com",
            body: "Let me know what you think."
        };

        const result = await analyzeEmail(email);
        console.log(`[Confidence Test] Urgency: ${result.urgency}, Conf: ${result.confidenceScore}`);

        // If confidence is low, it MUST be LOW
        if (result.confidenceScore < 0.6) {
            expect(result.urgency).toBe("LOW");
            expect(result.reasoning).toContain("low confidence");
        }
    });
});
