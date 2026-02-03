require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels method on the instance easily accessible in all versions, 
        // but let's try to generate content and see the error, or use the model name we think works.
        // Actually, the error message in logs was listing models. 
        // Let's force that error to see the list.
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-flash");
    } catch (error) {
        console.log("Error:", error.message);
    }
}

listModels();
