const express = require('express');
const router = express.Router();
const controller = require("../controllers/chatbot.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This defines the full path.
router.post("/api/chat", [verifyToken], controller.handleChat);

module.exports = router;