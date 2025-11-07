const express = require('express');
const router = express.Router();
const controller = require("../controllers/course-analysis.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This route finds materials for a specific course using a POST request
router.post("/api/course-materials", [verifyToken], controller.getMaterials);

module.exports = router;

