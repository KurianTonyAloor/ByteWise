const express = require('express');
const router = express.Router();
const controller = require("../controllers/chatbot.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This route is protected and will handle chat messages
router.post("/api/chat", [verifyToken], controller.sendMessage);

module.exports = router;
