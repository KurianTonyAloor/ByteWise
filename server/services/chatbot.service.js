const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using a model fine-tuned for chat
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" });

async function generateChatResponse(chatHistory, user) {
    // System instruction to define the chatbot's persona and context
    const systemInstruction = `
        You are Bytewise, a friendly and helpful AI academic assistant.
        You must always tailor your answers to the user's specific academic context.
        User's Profile:
        - University: ${user.university}
        - Program: ${user.program}
        - Scheme/Regulation Year: ${user.scheme}
        - Current Semester: ${user.semester}
        Keep your explanations clear, concise, and appropriate for this student's level.
    `;

    const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
            maxOutputTokens: 1000,
        },
        systemInstruction: systemInstruction,
    });

    const lastMessage = chatHistory[chatHistory.length - 1].parts[0].text;

    try {
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        console.log("Chatbot response generated successfully.");
        return response.text();
    } catch (error) {
        console.error("--- ERROR in Chatbot Service ---", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
}

module.exports = { generateChatResponse };
