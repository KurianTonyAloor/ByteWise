const express = require('express');
const router = express.Router();
const controller = require("../controllers/schedule.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");
const multer = require('multer');

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// This route GETS the cached academic schedule
// (This line was already correct)
router.get("/api/schedule", verifyToken, controller.getSchedule);

// This route POSTS a new PDF schedule to be parsed and cached
// *** FIX: Changed "verifyDoken" to "verifyToken" ***
router.post("/api/schedule", verifyToken, upload.single('schedulePdf'), controller.uploadSchedule);

module.exports = router;