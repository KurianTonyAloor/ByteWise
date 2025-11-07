const express = require('express');
const router = express.Router();
const controller = require("../controllers/quiz.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This route generates the quiz
router.post("/api/generate-quiz", [verifyToken], controller.handleGenerateQuiz);

// *** NEW: This route saves the quiz result to the DB ***
router.post("/api/quiz/save-result", [verifyToken], controller.handleSaveQuizResult);


module.exports = router;