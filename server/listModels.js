const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  console.log("Fetching available models...");

  // This line is corrected. listModels() is called directly on genAI.
  const { models } = await genAI.listModels();
  
  for (const m of models) {
    if (m.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${m.name}`);
    }
  }
}

run();