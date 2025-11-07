const { findCourseMaterials } = require("../services/course-analysis.service.js");
const User = require("../models/user.model.js");

exports.getMaterials = async (req, res) => {
    // We get the courseName from the request body
    const { courseName } = req.body;
    const userId = req.userId; // from verifyToken middleware

    console.log(`--- Course Analysis Request Received for: "${courseName}" ---`);

    if (!courseName) {
        return res.status(400).send({ message: "Course name is required." });
    }

    // Find the full user profile to provide context for the search
    User.findById(userId, async (err, user) => {
        if (err || !user) {
            return res.status(404).send({ message: "User not found." });
        }

        try {
            console.log("Calling the contextual course analysis service...");
            // Pass the full user object to the service
            const materials = await findCourseMaterials(courseName, user);
            res.status(200).send(materials);
        } catch (error) {
            console.error("Error in getMaterials controller:", error);
            res.status(500).send({ message: "An error occurred while finding materials." });
        }
    });
};

