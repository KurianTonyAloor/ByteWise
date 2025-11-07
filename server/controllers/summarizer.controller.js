// Import the centralized AI service
const { generateSummary } = require('../services/ai.service.js');
const User = require("../models/user.model.js"); // <-- **ADDED**

async function handleGenerateSummary(req, res) {
    try {
        const { topic, studyMaterials } = req.body;
        const userId = req.userId; // <-- **FIX 1: Use req.userId**

        // Validation
        if (!topic || !studyMaterials) {
            return res.status(400).json({ 
                error: "Missing required fields: 'topic' and 'studyMaterials' are required." 
            });
        }
        if (!userId) { // <-- **FIX 2: Check for userId**
            return res.status(401).json({ error: "User not authenticated (no userId)." });
        }

        // **FIX 3: Find user with the callback pattern, just like the chatbot**
        User.findById(userId, (err, user) => {
            if (err) {
                console.error("--- ERROR IN SUMMARIZER (User.findById) ---:", err);
                return res.status(500).send({ message: "Error finding user." });
            }
            if (!user) {
                return res.status(404).send({ message: "User not found." });
            }

            console.log(`Controller: Received summary request for topic: "${topic}"`);

            // Call the AI service (which is async)
            generateSummary(topic, studyMaterials, user)
                .then(summary => {
                    // Send success response
                    res.status(200).json({
                        message: "Summary generated successfully.",
                        summary: summary
                    });
                })
                .catch(aiError => {
                    console.error("--- ERROR IN SUMMARIZER (generateSummary) ---:", aiError);
                    res.status(500).send({
                        message: aiError.message || "An error occurred in the AI service.",
                    });
                });
        });

    } catch (error) {
        // This catch block is for synchronous errors only
        console.error("--- SYNC ERROR IN SUMMARIZER CONTROLLER ---:", error.message);
        res.status(500).json({ 
            error: "An internal server error occurred."
        });
    }
}

module.exports = {
    handleGenerateSummary
};