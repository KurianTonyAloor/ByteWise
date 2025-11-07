// services/schedule.service.js
const { PdfReader } = require("pdfreader");
const fs = require("fs");
const path = require("path");
const nlp = require("compromise");

/**
 * --- 1) LAYOUT-AWARE TEXT EXTRACTION ---
 * Reads the PDF preserving column and row layout.
 */
function extractTextFromPdf(fileBuffer) {
  return new Promise((resolve, reject) => {
    const pages = {};
    const gapThreshold = 40; // Use 40 for better column separation

    new PdfReader().parseBuffer(fileBuffer, (err, item) => {
      if (err) return reject(err);

      // When finished parsing
      if (!item) {
        const text = Object.keys(pages)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(pageNum =>
            Object.keys(pages[pageNum])
              .sort((a, b) => parseFloat(a) - parseFloat(b))
              .map(y => {
                const row = pages[pageNum][y];
                row.sort((a, b) => a.x - b.x);
                let line = "";
                let lastX = 0;
                for (const { x, text } of row) {
                  if (x - lastX > gapThreshold) line += " | ";
                  line += text.trim() + " ";
                  lastX = x + text.length * 3;
                }
                return line.trim();
              })
              .join("\n")
          )
          .join("\n\n");

        return resolve(text);
      }

      // Collect words by (page → row)
      if (item.page) {
        if (!pages[item.page]) pages[item.page] = {};
      } else if (item.text && item.x !== undefined && item.y !== undefined) {
        const yKey = item.y.toFixed(1);
        if (!pages[item.page]) pages[item.page] = {};
        if (!pages[item.page][yKey]) pages[item.page][yKey] = [];
        pages[item.page][yKey].push({ x: item.x, text: item.text });
      }
    });
  });
}

/**
 * --- 2) NORMALIZATION AND NOISE FILTERING ---
 */
function normalizeAndFilter(raw) {
  if (!raw) return "";

  // Only filter headers and known junk — don't over-trim
  const noisePatterns = [
    /^APJ ABDUL KALAM/i,
    /^Academic Calendar/i,
    /^Odd Semester/i,
    /^Even Semester/i,
    /Page \d+ of \d+/i,
    /^Thiruvananthapuram/i,
    /^U\.O\.No/i,
    /^Dean \(Academic\)/i,
    /^Section Officer/i,
    /^Important Dates/i,
    /^SL\.No/i,
    /^\* This is a computer system/i,
  ];

  return raw
    .replace(/\s{2,}/g, " ")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !noisePatterns.some(rx => rx.test(line)))
    .join("\n");
}

/**
 * --- 3) PROGRAM/SEMESTER BLOCK DETECTION ---
 */
function findProgramBlock(fullText, user) {
  const programNameRaw = (user.program || "").toString().replace(/\./g, "").trim().toLowerCase();
  let programTokens = programNameRaw.split(/\s+/).filter(Boolean);

  // --- NEW MAPPING LOGIC ---
  // MODIFIED: Changed "b.tech" to "b tech" to match the normalize function's output
  const programMappings = {
    "cse": "b tech",
    "computer science": "b tech",
    "computer science and engineering": "b tech",
    "ece": "b tech",
    "eee": "b tech",
    "mechanical": "b tech",
    "civil": "b tech",
  };
  
  const mappedProgram = programMappings[programNameRaw];
  if (mappedProgram) {
    programTokens.push(mappedProgram); // pushes "b tech"
    programTokens.push(mappedProgram.replace(/\s/g, "")); // pushes "btech"
  }
  // --- END NEW MAPPING ---


  let sem = "";
  if (user.semester) {
    sem = user.semester.toString().trim().toUpperCase();
    if (!sem.startsWith("S")) sem = "S" + sem;
  } else if (user.current_sem) {
    sem = user.current_sem.toString().trim().toUpperCase();
    if (!sem.startsWith("S")) sem = "S" + sem;
  }

  const blocks = fullText.match(
    /APJ\s+ABDUL\s+KALAM\s+TECHNOLOGICAL\s+UNIVERSITY[\s\S]*?(?=APJ\s+ABDUL\s+KALAM\s+TECHNOLOGICAL\s+UNIVERSITY|$)/gi
  );
  if (!blocks || blocks.length === 0) {
      console.log("[Debug] No APJAKTU blocks found at all.");
      return fullText;
  }

  // This normalize function turns "B. Tech" into "b tech"
  const normalize = s => s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const semNum = sem.replace("S", "");
  const semPattern = new RegExp(`s\\s*${semNum}(\\b|[\\s\\/\\,\\-])`, "i");

  for (const b of blocks) {
    const nb = normalize(b);
    
    // This will now check for "cse" OR "b tech" OR "btech"
    const programMatch = programTokens.some(t => nb.includes(t)); 
    const semMatch = sem ? semPattern.test(nb) : true;

    // This will match on nb.includes("b tech") and semPattern.test("s5")
    if (programMatch && semMatch) {
      console.log(`[Debug] Matched block for tokens: [${programTokens.join(", ")}] and semester: ${sem}`);
      return b; // Found the correct block!
    }
  }

  console.log(`[Debug] No block found for tokens: [${programTokens.join(", ")}] and semester: ${sem}. Falling back to full text.`);
  return fullText; // Fallback if no specific block matches
}

/**
 * --- 4) DATE PARSING HELPERS ---
 */
const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
};

/**
 * This function now prioritizes the DD-MM-YYYY format
 * found in the PDF's summary tables.
 */
function parseDate(segment, yearHint = 2025) {
  // Try DD-MM-YYYY first
  let m = segment.match(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(m[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d)) return d;
  }

  // Fallback for Month-Name-Date (like "October 15")
  m = segment.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b[\s\-.,]*?(\d{1,2})/i
  );
  if (!m) return null;
  const monStr = m[1].toLowerCase().slice(0, 3);
  const day = parseInt(m[2], 10);
  const mon = MONTHS[monStr];
  if (mon === undefined) return null;
  const d = new Date(yearHint, mon, day);
  return isNaN(d) ? null : d;
}


/**
 * --- 5) SMART EVENT ASSEMBLY ---
 * This logic is designed to parse the summary tables, which
 * are separated by '|' and have a DD-MM-YYYY date in the last column.
 */
function assembleEvents(blockText) {
  const lines = blockText
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const events = [];
  const seen = new Set();
  const dateRegex = /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/;

  for (const line of lines) {
    const parts = line.split(/\s*\|\s*/); // Split by the pipe separator
    if (parts.length < 2) continue; // Need at least an event and a date

    const lastPart = parts[parts.length - 1];
    let date = null;
    let event_name = "";

    if (dateRegex.test(lastPart)) {
      // Format: "Event Name | ... | 01-07-2025"
      date = parseDate(lastPart);
      // Join all other parts as the event name, stripping noise
      event_name = parts.slice(0, -1).join(" ").replace(/^\d+\s+/, "").trim(); // Remove leading SL.No numbers
    }
    
    if (date && event_name) {
      const key = `${date.toISOString().split("T")[0]}|${event_name}`;
      if (event_name.length > 5 && !seen.has(key)) {
        seen.add(key);
        events.push({
          event_name: event_name,
          event_date: date.toISOString().split("T")[0],
        });
      }
    }
  }

  return events;
}

/**
 * --- 6) CSV EXPORT ---
 */
function saveEventsToCsv(events) {
  if (!events || !events.length) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(__dirname, `schedule_extracted_${timestamp}.csv`);
  const header = "event_name,event_date\n";
  const rows = events
    .map(e => `"${(e.event_name || "").replace(/"/g, '""')}",${e.event_date || ""}`)
    .join("\n");
  fs.writeFileSync(filePath, header + rows, "utf8");
  console.log(`🧾 CSV saved to: ${filePath}`);
  return filePath;
}

/**
 * --- 7) MAIN PIPELINE ---
 */
async function processSchedulePdf(fileBuffer, user) {
  console.log("📘 Parsing schedule PDF (layout-aware)...");

  const rawText = await extractTextFromPdf(fileBuffer);
  const filteredText = normalizeAndFilter(rawText);
  const relevantBlock = findProgramBlock(filteredText, user);
  let events = assembleEvents(relevantBlock);

  // Remove duplicates & noise
  events = events.filter(
    e => e.event_name && e.event_name.length > 2 && !/university|calendar|page/i.test(e.event_name)
  );

  const unique = new Set();
  events = events.filter(e => {
    const key = `${e.event_name}|${e.event_date}`;
    if (unique.has(key)) return false;
    unique.add(key);
    return true;
  });

  // Sort chronologically
  events.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  // Save CSV for inspection
  saveEventsToCsv(events);

  console.log(`✅ Extracted ${events.length} probable events.`);
  return events;
}

module.exports = { processSchedulePdf };