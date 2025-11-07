// Import the centralized AI service and the User model
const { generateQuiz } = require('../services/ai.service.js');
const User = require("../models/user.model.js");

/**
 * Controller to handle the /api/generate-quiz POST request.
 */
async function handleGenerateQuiz(req, res) {
    try {
        // *** FIX 1: Look for 'studyMaterials' to match the frontend ***
        const { topic, studyMaterials } = req.body;
        const userId = req.userId; // From verifyToken middleware

        // *** FIX 1 (cont.): Validate 'studyMaterials' ***
        if (!topic || !studyMaterials) {
            return res.status(400).json({ 
                error: "Missing required fields: 'topic' and 'studyMaterials' are required." 
            });
        }
        if (!userId) {
            return res.status(401).json({ error: "Invalid token. User ID missing." });
        }
        
        console.log(`Controller: Received quiz request for topic: "${topic}"`);

        // *** FIX 2: Use 'User.findById' to get the full user object ***
        User.findById(userId, async (err, user) => {
            if (err) {
                if (err.kind === "not_found") {
                    return res.status(404).send({ message: "User not found." });
                }
                return res.status(500).send({ message: "Error retrieving user." });
            }

            if (!user) {
                return res.status(404).send({ message: "User not found." });
            }

            // Now that we have the user, call the AI service
            try {
                const quiz = await generateQuiz(topic, studyMaterials, user);
                
                // Send success response
                res.status(200).json({
                    message: "Quiz generated successfully.",
                    quiz: quiz 
                });

            } catch (aiError) {
                // Handle errors from the AI service (e.g., Ollama not running)
                console.error("--- ERROR IN QUIZ (AI SERVICE) ---:", aiError.message);
                res.status(500).json({ 
                    error: aiError.message || "An internal server error occurred while generating the quiz." 
                });
            }
        });

    } catch (controllerError) {
        // Handle errors in the controller's outer logic
        console.error("--- ERROR IN QUIZ CONTROLLER ---:", controllerError.message);
        res.status(500).json({ 
            error: "An internal server error occurred." 
        });
    }
}

module.exports = {
    handleGenerateQuiz
};