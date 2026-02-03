const { analyzeEmail, SIGNAL_WEIGHTS } = require('../../services/aiService');
const nonUrgentInbox = require('./fixtures/nonUrgentInbox.json');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

jest.setTimeout(30000);

describe("AI Safety & Anti-Regression", () => {

    describe("No-HIGH Guarantee", () => {
        test("allows inboxes with ZERO HIGH priority emails", async () => {
            console.log("Testing Non-Urgent Inbox (Expect 0 HIGH)...");
            const results = [];
            for (const email of nonUrgentInbox) {
                const result = await analyzeEmail(email);
                results.push(result);
            }

            const highs = results.filter(r => r.urgency === "HIGH");
            console.log(`Highs found: ${highs.length}`);

            // This MUST be zero. If AI invents urgency, we fail.
            expect(highs.length).toBe(0);
        });
    });

    describe("LOW Default State", () => {
        test("defaults to LOW when no strong signals exist", async () => {
            const email = {
                subject: "Hello",
                body: "Just sharing an update regarding the weather.", // Intentionally vague/neutral
                from: "colleague@company.com"
            };

            const result = await analyzeEmail(email);
            console.log(`[Neutral] Urgency: ${result.urgency}`);

            expect(result.urgency).toBe("LOW");
        });
    });

    describe("Scoring Table Integrity", () => {
        test("signal weights remain frozen and unchanged", () => {
            // Verify core negative weights prevent drift
            expect(SIGNAL_WEIGHTS.SALE).toBe(-6);
            expect(SIGNAL_WEIGHTS.NEWSLETTER).toBe(-8);

            // Verify positive weights
            expect(SIGNAL_WEIGHTS.ACTION).toBe(4);
            expect(SIGNAL_WEIGHTS.URGENCY).toBe(3);

            // Verify it's frozen
            expect(Object.isFrozen(SIGNAL_WEIGHTS)).toBe(true);
        });
    });

});
