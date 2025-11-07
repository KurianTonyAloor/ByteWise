const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Updated model
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" });

async function generateQuizWithGemini(topic, materials, user) {
  console.log(`Generating quiz for topic "${topic}" for a Semester ${user.semester} student...`);

  const prompt = `
    You are an expert quiz designer for university students. Your task is to create a multiple-choice quiz based on the provided topic and study materials.

    **Academic Context:**
    - University: ${user.university}
    - Program: ${user.program}
    - Current Semester: ${user.semester}

    **Task Details:**
    - Topic of the Quiz: "${topic}"
    - Study Materials: "${materials}"

    **Instructions:**
    1. Generate exactly 5 multiple-choice questions.
    2. Each question must have exactly 4 answer options.
    3. One and only one option must be correct.
    4. For each question, provide a short hint that guides the student without giving away the answer.
    5. Return the output as a single, clean, stringified JSON array of objects. Do not include any other text, explanations, or markdown formatting.

    **The JSON format for each question object must be:**
    {
      "question": "The full question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct answer text, which must exactly match one of the options",
      "hint": "A short hint for the question."
    }
  `;

  try {
    console.log("Sending request to Gemini API for quiz generation...");
    const result = await model.generateContent(prompt);
    const response = await result.response;

    let responseText = response.text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const quiz = JSON.parse(responseText);
    console.log(`✅ Gemini quiz generation successful. Created ${quiz.length} questions.`);
    return quiz;
  } catch (error) {
    console.error("❌ Error calling Gemini API for quiz generation:", error);
    throw new Error("Failed to generate quiz due to an API error.");
  }
}

module.exports = { generateQuizWithGemini };
