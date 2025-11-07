const { PdfReader } = require("pdfreader"); // *** FIX 1: Reverted to pdfreader ***
const nlp = require("compromise");
const fetch = require('node-fetch'); // Make sure to install this: npm install node-fetch@2
const fs = require('fs'); // Node.js File System module
const path = require('path'); // Node.js Path module

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL_NAME = "phi3"; 

/**
 * --- CORE AI FUNCTION ---
 * This function now saves EVERY AI response to the debug folder.
 */
async function getLocalAiResponse(prompt, jsonMode = false, options = {}) { 
    console.log(`--- Sending request to local model: ${MODEL_NAME} ---`);
    
    const body = {
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: options 
    };
    
    if (jsonMode) {
        body.format = "json";
    }

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Ollama server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log("--- Received response from local model ---");

        // *** NEW: Save ALL AI responses to debug folder ***
        try {
            const debugDir = path.join(__dirname, '..', 'debug'); 
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true }); 
            }
            // Use a timestamp to make every log unique
            const debugFilePath = path.join(debugDir, `ai_response_${Date.now()}.txt`);
            
            // data.response is the raw string from the AI
            fs.writeFileSync(debugFilePath, data.response); 
            console.log(`✅ AI response saved to: ${debugFilePath}`);
        } catch (saveError) {
            console.error("--- FAILED to save AI debug file ---:", saveError.message);
        }
        // *** END OF NEW DEBUG CODE ***

        return data.response; 

    } catch (error) {
        console.error("Error connecting to local Ollama server:", error.message);
        throw new Error("Could not connect to the local AI model. Is Ollama running?");
    }
}

// --- CHATBOT --- (No change)
async function getChatReply(user, history, message) {
    const context = `
        You are Bytewise, an AI academic assistant. You are talking to a student.
        Their profile is:
        - University: ${user.university}
        - Program: ${user.program}
        - Semester: ${user.semester}
        - Scheme: ${user.scheme || 'N/A'}
        
        Your previous conversation:
        ${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        The user's new message is: "${message}"

        Respond to the user's message in a helpful and concise way,
        always keeping their academic profile in mind.
    `;
    return getLocalAiResponse(context);
}

// --- SUMMARIZER --- (No change)
async function generateSummary(topic, materials, user) {
    const prompt = `
        Act as an expert academic tutor. Summarize the following study materials.
        
        Academic Context:
        - University: ${user.university}
        - Program: ${user.program}
        - Semester: ${user.semester}

        Task Details:
        - Topic: "${topic}"
        - Materials: "${materials}"

        Provide a concise, well-structured summary. Explain the core concepts
        for a student at this level.
    `;
    return getLocalAiResponse(prompt);
}

// --- QUIZ GENERATOR --- (FIXED)
async function generateQuiz(topic, materials, user) { 
    const prompt = `
        You are a quiz generation bot. Based on the topic "${topic}" and the
        following materials: "${materials}", generate a 5-question multiple-choice quiz
        for a ${user.program} student in semester ${user.semester}.
        
        You MUST return ONLY a valid JSON array in the following format:
        [
            {
                "question": "Your question here",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "answer": "The correct option text"
            },
            ...
        ]
    `;
    const jsonString = await getLocalAiResponse(prompt, true, { "temperature": 0.1 });
    
    // *** FIX: Parse the string and return the 'quiz' array *inside* it ***
    const data = JSON.parse(jsonString);
    return data.quiz; 
}

// --- SCHEDULE PDF PARSER (NLP) --- (No change)
async function extractScheduleFromPdf(fileBuffer) {
    // 1. Parse PDF text (This will now use the original function)
    const rawText = await parsePdfWithPdfReader(fileBuffer);
    if (!rawText || rawText.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF.");
    }

    // 2. Pre-process the text (This is our key fix!)
    const cleanText = preProcessText(rawText);
    console.log(`--- Raw text length: ${rawText.length}, Cleaned text length: ${cleanText.length} ---`);
    
    // 3. Send text to AI
    console.log("--- Sending CLEANED PDF text to local AI for schedule extraction ---");
    
    const prompt = `
        You are a data extraction bot.
        Read the following text from a university academic calendar.
        Find all dates and their corresponding events.
        
        **Your Task:**
        List every event you find in the following format:
        YYYY-MM-DD :: The Event Name

        **Example:**
        2025-08-01 :: Commencement of classes
        2025-08-23 :: First Series test to be completed
        
        Do not add any other text. Do not say "Here is the list".
        Just output the list, one event per line.

        Here is the text:
        "${cleanText}"
    `;
    
    // We are still using the low temperature for consistency
    const responseString = await getLocalAiResponse(prompt, false, { "temperature": 0.1 });
    
    // *** REMOVED the old debug code from here, as it's now in the core function ***
    
    // 5. Simple Parser (No change)
    const allEvents = [];
    const lines = responseString.split('\n'); 
    
    const regex = /^(\d{4}-\d{2}-\d{2})\s*::\s*(.+)$/;

    for (const line of lines) {
        const match = line.trim().match(regex);
        if (match) {
            allEvents.push({
                event_date: match[1],
                event_name: match[2].trim()
            });
        }
    }

    if (allEvents.length === 0) { 
        console.error("AI returned a response, but no events could be parsed from it:", responseString);
        throw new Error("The AI service returned data, but no schedule events could be extracted.");
    }

    // 6. Success! (No change)
    console.log(`Successfully parsed ${allEvents.length} events from AI string.`);
    return allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
}

/**
 * --- *** REVERTED HELPER FUNCTION: PDF PARSER *** ---
 * This function uses 'pdfreader' again.
 * The 'preProcessText' function will clean up its messy output.
 */
function parsePdfWithPdfReader(fileBuffer) {
  return new Promise((resolve, reject) => {
    let fullText = "";
    new PdfReader().parseBuffer(fileBuffer, (err, item) => {
      if (err) {
        console.error("PDF parsing error (pdfreader):", err);
        reject(err);
      } else if (!item) {
        // End of PDF
        console.log(`✅ PDF parsed successfully with pdfreader. Total text length: ${fullText.length}`);
        resolve(fullText);
      } else if (item.text) {
        // A new text item was found
        fullText += item.text + " ";
      }
    });
  });
}


// --- TEXT PRE-PROCESSOR --- (No change, this is our key fix)
function preProcessText(rawText) {
    const lines = rawText.split(/\s*\n\s*/); // Split by new lines
    const relevantLines = [];

    const keywords = [
        'semester', 'commencement', 'classes', 'exam', 'test',
        'registration', 'last date', 'audit', 'advisory', 'survey',
        'ends', 'begins', 'holiday', 'vacation'
    ];
    
    const dateRegex = /(\d{4})|((\d{2}-){2}\d{4})|(JUL|AUG|SEP|OCT|NOV|DEC|JAN|FEB|MAR|APR|MAY|JUN)/i;

    for (const line of lines) {
        if (line.length < 10) continue; // Skip very short lines
        
        const lowerLine = line.toLowerCase();
        
        if (dateRegex.test(lowerLine) || keywords.some(key => lowerLine.includes(key))) {
            relevantLines.push(line.trim());
        }
    }
    
    return relevantLines.join('\n'); // Re-join the clean lines
}


module.exports = {
    getChatReply,
    generateSummary,
    generateQuiz,
    extractScheduleFromPdf
};