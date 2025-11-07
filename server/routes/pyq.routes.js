const express = require('express');
const router = express.Router();
const controller = require("../controllers/pyq.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

// This route finds PYQ analysis for a specific course
router.get("/api/pyq-analysis", [verifyToken], controller.getPyqAnalysis);

module.exports = router;
