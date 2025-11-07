const Course = require("../models/course.model.js");
// Make sure to import the correct primary function from the scraper service
const { findAndExtractCourses } = require("../services/scraper.service.js");

// This function handles GET requests to fetch courses from the database (cache)
exports.getCourses = (req, res) => {
    const { university, scheme, program, semester } = req.query;
    if (!university || !scheme || !program || !semester) {
        return res.status(400).send({ message: "Missing required query parameters." });
    }

    Course.find({ university, scheme, program, semester }, (err, data) => {
        if (err) return res.status(500).send({ message: "Error fetching courses from DB." });
        return res.status(200).send(data);
    });
};

// This function handles POST requests to find, extract, and save new courses
exports.findAndSaveCourses = async (req, res) => {
    const userInfo = req.body;
    if (!userInfo.university || !userInfo.scheme || !userInfo.program || !userInfo.semester) {
        return res.status(400).send({ message: "Missing required body parameters." });
    }

    // Call the scraping and extraction service
    const foundCourses = await findAndExtractCourses(userInfo);

    // If courses were found, save them to the database for next time
    if (foundCourses && foundCourses.length > 0) {
        const coursesToSave = foundCourses.map(course => ({
            ...course, ...userInfo
        }));
        Course.createBulk(coursesToSave, (err, result) => {
            if (err) console.error("Failed to save found courses to DB:", err);
            else console.log("Successfully saved found courses to DB.");
        });
    }
    
    // Return the newly found courses to the frontend
    return res.status(200).send(foundCourses);
};

