const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require("../controllers/analysis.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js"); // Import middleware

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the POST route for paper analysis
// --- FIX: Removed the brackets [] around verifyToken ---
router.post("/api/paper-analysis", verifyToken, upload.single('paper'), controller.analyze);

module.exports = router;

