const { getChatReply } = require("../services/ai.service.js"); // Import from the central AI service
const User = require("../models/user.model.js");

/**
 * Handles chat requests for authenticated users.
 * (REFACTORED to use the callback-style User.findById to prevent server crash)
 */
exports.handleChat = (req, res) => {
    const { message, history } = req.body;
    const userId = req.userId; // Provided by verifyToken middleware

    if (!message) {
        return res.status(400).send({ message: "Message is required." });
    }

    // 1. Find the user using the callback pattern
    // This matches your user.model.js and stops the crash
    User.findById(userId, (err, user) => {
        if (err) {
            console.error("--- ERROR IN CHATBOT CONTROLLER (User.findById) ---:", err);
            return res.status(500).send({ message: "Error finding user." });
        }

        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        // 2. Call the AI service (which is async)
        // We use .then() .catch() because we are inside a callback
        getChatReply(user, history || [], message)
            .then(reply => {
                // 3. Send the AI’s reply to the frontend
                res.status(200).send({ reply });
            })
            .catch(aiError => {
                // 4. Catch any errors from the AI service
                console.error("--- ERROR IN CHATBOT CONTROLLER (getChatReply) ---:", aiError);
                res.status(500).send({
                    message: aiError.message || "An error occurred in the AI service.",
                });
            });
    });
};