const express = require('express');
const router = express.Router();
const controller = require("../controllers/user.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This route is protected. A valid token must be sent in the request header.
router.put("/api/user/scheme", [verifyToken], controller.updateScheme);

module.exports = router;