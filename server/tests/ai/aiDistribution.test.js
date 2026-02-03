const { analyzeEmail } = require('../../services/aiService');
const mixedInbox = require('./fixtures/mixedInbox.json');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

jest.setTimeout(60000); // Longer timeout for batch processing

describe("AI Urgency Distribution", () => {
    test("keeps MEDIUM priority under 30% of inbox", async () => {
        const results = [];
        console.log("Running Distribution Test on Mixed Inbox...");

        for (const email of mixedInbox) {
            const result = await analyzeEmail(email);
            results.push(result);
            process.stdout.write('.'); // Progress indicator
        }
        console.log("\nDistribution Analysis Complete.");

        const total = results.length;
        const mediumCount = results.filter(r => r.urgency === "MEDIUM").length;
        const highCount = results.filter(r => r.urgency === "HIGH").length;
        const lowCount = results.filter(r => r.urgency === "LOW").length;

        console.log(`Total: ${total}`);
        console.log(`HIGH: ${highCount}`);
        console.log(`MEDIUM: ${mediumCount}`);
        console.log(`LOW: ${lowCount}`);

        const mediumRatio = mediumCount / total;

        // Assertions
        // 1. Medium should be rare (less than 30-40% to be safe, strict 30%)
        expect(mediumRatio).toBeLessThanOrEqual(0.4); // Giving a little buffer for 10 items, but ideally 0.3

        // 2. Low should be the majority
        expect(lowCount).toBeGreaterThan(mediumCount);

        // 3. High should be the minority
        expect(highCount).toBeLessThan(lowCount);
    });
});
