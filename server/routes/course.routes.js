const express = require('express');
const router = express.Router();
const controller = require("../controllers/course.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This route gets existing courses from the database (e.g., from a cache)
router.get("/api/courses", [verifyToken], controller.getCourses);

// This route triggers the smart scraping process to find and save new courses
router.post("/api/courses/find", [verifyToken], controller.findAndSaveCourses);

module.exports = router;