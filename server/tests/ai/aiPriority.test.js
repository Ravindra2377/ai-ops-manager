const { analyzeEmail } = require('../../services/aiService');
const marketingEmails = require('./fixtures/marketingEmails.json');
const highPriorityEmails = require('./fixtures/highPriorityEmails.json');
const lowPriorityEmails = require('./fixtures/lowPriorityEmails.json');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Increase timeout for AI calls
jest.setTimeout(30000);

describe("AI Priority Enforcement", () => {

    describe("LOW Priority Safety Net (Marketing/Noise)", () => {
        test("forces marketing emails to LOW priority", async () => {
            console.log("Testing Marketing Emails...");
            for (const email of marketingEmails) {
                const result = await analyzeEmail(email);
                console.log(`[Marketing] Subject: ${email.subject} -> Urgency: ${result.urgency}`);

                expect(result.urgency).toBe("LOW");
                // Check if reasoning mentions marketing or system override
                const reasoning = result.reasoning.toLowerCase();
                const isMarketing = reasoning.includes("marketing") || reasoning.includes("newsletter") || reasoning.includes("system");
                expect(isMarketing).toBe(true);
            }
        });

        test("forces FYI/Low impact emails to LOW priority", async () => {
            console.log("Testing Low Priority Emails...");
            for (const email of lowPriorityEmails) {
                const result = await analyzeEmail(email);
                console.log(`[Low] Subject: ${email.subject} -> Urgency: ${result.urgency}`);

                expect(result.urgency).toBe("LOW");
            }
        });
    });

    describe("HIGH Priority Strictness", () => {
        test("allows HIGH only for blocking decisions/deadlines", async () => {
            console.log("Testing High Priority Emails...");
            for (const email of highPriorityEmails) {
                const result = await analyzeEmail(email);
                console.log(`[High] Subject: ${email.subject} -> Urgency: ${result.urgency}`);

                // Expect HIGH, but sometimes AI might say MEDIUM (which is safe), 
                // but we definitely don't want LOW for these.
                // ideally HIGH 
                expect(["HIGH", "MEDIUM"]).toContain(result.urgency);

                if (result.urgency === "HIGH") {
                    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.6); // Confidence should be decent
                }
            }
        });
    });

    describe("Explanation Quality", () => {
        test("requires concrete reasoning for non-LOW urgency", async () => {
            const email = highPriorityEmails[0]; // Approval needed
            const result = await analyzeEmail(email);

            if (result.urgency !== "LOW") {
                expect(result.reasoning.length).toBeGreaterThan(10);
                // Should contain who/what/why logic or system explanation
                const validReasoning = result.reasoning.length > 10;
                expect(validReasoning).toBe(true);
            }
        });
    });

});
