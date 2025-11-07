const express = require('express');
const router = express.Router();
const controller = require("../controllers/course-analysis.controller.js");
const { verifyToken } = require("../middleware/auth.jwt.js");

router.get("/api/course-materials", [verifyToken], controller.getCourseMaterials);

module.exports = router;
