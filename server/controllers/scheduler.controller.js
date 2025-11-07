const { findAndExtractSchedule } = require("../services/schedule.service.js");
const User = require("../models/user.model.js");
const db = require("../config/db.config.js"); // Direct DB access for cache

exports.getSchedule = async (req, res) => {
    const userId = req.userId;

    console.log(`--- Schedule Request Received for User ID: ${userId} ---`);

    // 1. Check Cache First
    // We'll cache results for 1 week to avoid constant scraping
    const cacheQuery = "SELECT event_name, event_date FROM schedule_cache WHERE user_id = ? AND fetched_at > DATE_SUB(NOW(), INTERVAL 7 DAY)";
    db.query(cacheQuery, [userId], async (cacheErr, cacheRes) => {
        if (cacheErr) {
            console.error("Error checking schedule cache:", cacheErr);
            // Proceed without cache if error
        }
        
        if (cacheRes && cacheRes.length > 0) {
            console.log("Returning schedule from cache.");
            return res.status(200).send(cacheRes);
        } else {
            console.log("No valid cache found. Fetching fresh schedule...");
            
            // 2. Fetch User Info
            User.findById(userId, async (userErr, user) => {
                if (userErr || !user) {
                    return res.status(404).send({ message: "User not found." });
                }

                // 3. Call Scraper Service
                try {
                    const schedule = await findAndExtractSchedule(user);

                    // 4. Save to Cache (if results found)
                    if (schedule && schedule.length > 0) {
                        const values = schedule.map(item => [userId, item.event_name, item.event_date]);
                        // Use INSERT IGNORE to gracefully handle any duplicate entries
                        const insertQuery = "INSERT IGNORE INTO schedule_cache (user_id, event_name, event_date) VALUES ?";
                        db.query(insertQuery, [values], (insertErr, insertRes) => {
                            if (insertErr) console.error("Error saving schedule to cache:", insertErr);
                            else console.log("Schedule saved to cache.");
                        });
                    }

                    res.status(200).send(schedule);
                } catch (error) {
                    console.error("Error in getSchedule controller:", error);
                    res.status(500).send({ message: "An error occurred while finding the schedule." });
                }
            });
        }
    });
};

