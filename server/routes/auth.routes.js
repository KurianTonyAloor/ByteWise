const express = require('express');
const router = express.Router();
const controller = require("../controllers/auth.controller.js");

// Route for user signup, linked to the signup function
router.post("/api/signup", controller.signup);

// Route for user login, linked to the login function
router.post("/api/login", controller.login);

module.exports = router;