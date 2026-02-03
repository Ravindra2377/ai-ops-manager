require('dotenv').config();
const { analyzeEmail } = require('./services/aiService');

async function debugSafety() {
    console.log("--- DEBUGGING SAFETY ---");

    // The problematic "Neutral" email
    const email = {
        subject: "Hello",
        body: "Just sharing an update regarding the weather.",
        from: "colleague@company.com"
    };

    try {
        const result = await analyzeEmail(email);
        console.log("\n--- RESULT ---");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

debugSafety();
