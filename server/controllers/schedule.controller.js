// *** FIX 1: Import from the new, centralized AI service ***
const { extractScheduleFromPdf } = require("../services/ai.service.js"); 
const User = require("../models/user.model.js");
const db = require("../config/db.config.js");

/**
 * --- CONTROLLER: GET CACHED SCHEDULE ---
 * Fetches the user's schedule from the database.
 * (This function remains unchanged, it's correct)
 */
exports.getSchedule = (req, res) => {
    const userId = req.userId; // From verifyToken middleware
    console.log(`--- Schedule GET Request Received for User ID: ${userId} ---`);

    const cacheQuery = "SELECT event_name, event_date FROM schedule_cache WHERE user_id = ? AND event_date >= CURDATE() ORDER BY event_date ASC";
    
    db.query(cacheQuery, [userId], (cacheErr, cacheRes) => {
        if (cacheErr) {
            if (cacheErr.code === 'ER_NO_SUCH_TABLE') {
                console.warn("schedule_cache table does not exist. Returning empty array.");
                return res.status(200).send([]);
            }
            console.error("Error checking schedule cache:", cacheErr);
            return res.status(500).send({ message: "Error checking cache." });
        }
        
        if (cacheRes && cacheRes.length > 0) {
            console.log(`Returning ${cacheRes.length} schedule events from cache.`);
            return res.status(200).send(cacheRes);
        } else {
            // No schedule found in cache
            console.log("No schedule found in cache.");
            return res.status(200).send([]);
        }
    });
};

/**
 * --- CONTROLLER: UPLOAD AND PARSE SCHEDULE (NOW WITH AI) ---
 * Receives a PDF, gets user info, and calls the AI service to parse it.
 */
exports.uploadSchedule = (req, res) => {
  try {
    const userId = req.userId; // From verifyToken middleware

    if (!req.file) {
      return res.status(400).send({ message: "No PDF file uploaded." });
    }

    // 1. Find the user (using the correct callback pattern to prevent crash)
    User.findById(userId, (err, user) => {
        if (err || !user) {
            return res.status(404).send({ message: "User not found." });
        }

        // 2. Process the PDF using the new AI service (async/await)
        // We use a .then().catch() block because we are inside a callback
        
        console.log(`--- AI Schedule Parse Request Received for User ID: ${userId} ---`);
        
        // *** FIX 2: Call the new AI service function ***
        // The new AI function only needs the file buffer.
        extractScheduleFromPdf(req.file.buffer)
            .then(schedule => {
                
                if (!schedule || schedule.length === 0) {
                    return res.status(400).send({ message: "AI could not find any schedule events in the PDF." });
                }

                console.log(`AI parsing successful. Saving ${schedule.length} events to cache for user ${userId}`);
                
                // 3. Save the AI-parsed schedule to the database
                const values = schedule.map(item => [userId, item.event_name, item.event_date]);
                const insertQuery = "INSERT IGNORE INTO schedule_cache (user_id, event_name, event_date) VALUES ?";
                
                db.query(insertQuery, [values], (insertErr, insertRes) => {
                    if (insertErr) {
                        console.error("Error saving AI schedule to cache:", insertErr);
                        return res.status(500).send({ message: "Error saving schedule." });
                    }
                    console.log("AI Schedule saved to cache.");
                    res.status(200).send(schedule); // Send the new schedule back
                });

            })
            .catch(procErr => {
                // This catches errors from the AI service (e.g., Ollama not running)
                console.error("❌ Error processing PDF with AI service:", procErr.message);
                res.status(500).json({ error: procErr.message });
            });
    });

  } catch (err) {
    // This catches synchronous errors (e.g., req.file is missing)
    console.error("❌ Error in uploadSchedule (sync):", err);
    res.status(500).send({ message: "An error occurred." });
  }
};