const { findPyqAnalysis } = require("../services/pyq.service.js");
// We don't need the User model here because the service and model handle all DB logic.

exports.getPyqAnalysis = async (req, res) => {
    // Data comes from the query parameters (e.g., /api/pyq-analysis?courseName=...)
    const { courseName } = req.query;
    // The userId is added to the request by our verifyToken middleware
    const userId = req.userId; 

    // Validation
    if (!courseName) {
        return res.status(400).send({ message: "Course name is required." });
    }
    if (!userId) {
        return res.status(401).send({ message: "User not authenticated." });
    }

    console.log(`--- PYQ Analysis Request Received for: "${courseName}" ---`);

    try {
        // Call the service, which now queries the database
        const analysis = await findPyqAnalysis(userId, courseName);
        res.status(200).send(analysis);

    } catch (error) {
        console.error("Error in getPyqAnalysis controller:", error);
        res.status(500).send({ message: "An error occurred while finding PYQ analysis." });
    }
};

