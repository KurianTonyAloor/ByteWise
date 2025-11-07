const express = require('express');
const router = express.Router();
const controller = require("../controllers/summarizer.controller.js"); 
const { verifyToken } = require("../middleware/auth.jwt.js");

// *** FIXED: We put the FULL path here ***
// This will match "POST /api/summarize"
router.post("/api/summarize", [verifyToken], controller.handleGenerateSummary);

module.exports = router;