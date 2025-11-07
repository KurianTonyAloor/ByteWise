require('dotenv').config(); // Keep this at the top
const express = require("express"); 
const cors = require("cors");

// Import all routes
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const courseRoutes = require("./routes/course.routes.js");
const paperAnalysisRoutes = require("./routes/analysis.routes.js");
const summarizerRoutes = require("./routes/summarizer.routes.js");
const chatbotRoutes = require("./routes/chatbot.routes.js");
const courseAnalysisRoutes = require("./routes/course-analysis.routes.js");
const scheduleRoutes = require("./routes/schedule.routes.js");
const pyqRoutes = require("./routes/pyq.routes.js");
const quizRoutes = require("./routes/quiz.routes.js"); 
const { scheduleSemesterUpdate } = require("./cron/semesterUpdate.js");

const app = express();

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173"
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Welcome route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Bytewise backend server." });
});

// Register all routes at the root ("/")
// This is your correct, original structure.
app.use('/', authRoutes); 
app.use('/', userRoutes);
app.use('/', courseRoutes);
app.use('/', paperAnalysisRoutes);
app.use('/', summarizerRoutes); // Will use the path "/api/summarize" from its file
app.use('/', chatbotRoutes);
app.use('/', courseAnalysisRoutes);
app.use('/', scheduleRoutes);
app.use('/', pyqRoutes);
app.use('/', quizRoutes); // Will use the path "/api/generate-quiz" from its file

// Start the cron job
scheduleSemesterUpdate();

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}. 🚀`);
});