const { generateSummary } = require("../services/ai.service.js"); // <-- Import from new AI service
const User = require("../models/user.model.js");

exports.createSummary = (req, res) => {
    const { topic, studyMaterials } = req.body;
    const userId = req.userId; 

    if (!topic || !studyMaterials) {
        return res.status(400).send({ message: "Topic and study materials are required." });
    }

    User.findById(userId, async (err, user) => {
        if (err || !user) {
            return res.status(404).send({ message: "User not found." });
        }
        
        try {
            const summary = await generateSummary(topic, studyMaterials, user);
            res.status(200).send({ summary: summary });
        } catch (error) {
            console.error("Error in summarizer controller:", error);
            res.status(500).send({ message: error.message || "An error occurred while generating the summary." });
        }
    });
};