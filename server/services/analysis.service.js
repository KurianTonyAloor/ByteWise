const { PdfReader } = require("pdfreader");

/**
 * Helper function to extract text from a PDF buffer using pdfreader.
 * We wrap it in a Promise to work with our async/await structure.
 */
function extractTextFromPdf(fileBuffer) {
  return new Promise((resolve, reject) => {
    let fullText = "";
    new PdfReader().parseBuffer(fileBuffer, (err, item) => {
      if (err) {
        // An error occurred during parsing
        console.error("PDF parsing error:", err);
        reject(err);
      } else if (!item) {
        // End of PDF
        resolve(fullText);
      } else if (item.text) {
        // A new text item was found
        fullText += item.text + " ";
      }
    });
  });
}

/**
 * This function is for the question paper analysis.
 * It uses pdfreader to get the text and then analyzes it.
 */
async function analyzeQuestionPaper(fileBuffer) {
  // 1. Extract text using the new helper function
  const text = await extractTextFromPdf(fileBuffer);

  // 2. The NLP/keyword analysis logic
  const wordCounts = {};
  const words = text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
  const STOP_WORDS = new Set(['i', 'me', 'my', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'of', 'at', 'by', 'for', 'with', 'to', 'in', 'out', 'on', 'is', 'are', 'was', 'were', 'be', 'do', 'what', 'which', 'who', 'this', 'that', 'it', 'its', 'they', 'them', 'not', 'no']);

  for (const word of words) {
    if (word && !STOP_WORDS.has(word) && isNaN(word) && word.length > 2) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  const sortedWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Get the top 10 topics

  const results = sortedWords.map(([topic, count]) => ({ topic, count }));
  
  // 3. This ensures the results are sent back to the controller
  return results;
}

// We export the function this file is responsible for.
// This file does NOT know about Gemini or web scraping.
module.exports = { analyzeQuestionPaper };

