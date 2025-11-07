const { analyzeQuestionPaper } = require("../services/analysis.service.js");
const PyqAnalysis = require("../models/pyq.model.js"); // <-- 1. Import the PYQ model

exports.analyze = async (req, res) => {
  console.log("--- Paper Analysis Request Received ---"); 
  
  // 2. Get the new data from the request
  const userId = req.userId; // This comes from the verifyToken middleware
  const { courseName } = req.body; // This comes from the FormData

  try {
    // 3. Add validation for the new data
    if (!req.file) {
      console.log("Error: No file was uploaded.");
      return res.status(400).send({ message: "No file uploaded." });
    }
    if (!courseName) {
      console.log("Error: No course name was provided.");
      return res.status(400).send({ message: "Please select a course." });
    }
    if (!userId) {
      console.log("Error: User is not authenticated.");
      return res.status(401).send({ message: "User not authenticated." });
    }

    console.log(`File received for user ${userId}, course ${courseName}. Calling service...`); 
    const fileBuffer = req.file.buffer;
    
    // 4. Call the analysis service (this part is the same)
    const results = await analyzeQuestionPaper(fileBuffer);
    
    console.log(`Analysis complete. Found ${results.length} topics. Saving to DB...`);

    // 5. Format data for the DB
    const topicsToSave = results.map(r => ({ 
        topic: r.topic, 
        frequency: r.count 
    }));

    // 6. --- THIS IS THE KEY UPDATE ---
    // We now 'await' the database save to ensure it completes before continuing.
    const dbResult = await PyqAnalysis.createBulk(userId, courseName, topicsToSave);
    console.log(`Successfully saved PYQ analysis to DB. Rows affected: ${dbResult.insertedCount}`);
    // ---------------------------------
    
    // 7. Send results back *after* the save is confirmed
    return res.status(200).send(results);

  } catch (error) {
    // This will now catch errors from the analysis OR the database save
    console.error("Paper Analysis Error:", error);
    res.status(500).send({ message: error.message || "Failed to analyze and save the paper." });
  }
};

