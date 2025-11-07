const db = require("../config/db.config.js");

const PyqAnalysis = {};

/**
 * Finds all saved PYQ topics for a specific user and course.
 */
PyqAnalysis.find = (userId, courseName, result) => {
  const query = "SELECT topic_name, frequency FROM pyq_analysis_topics WHERE user_id = ? AND course_name = ? ORDER BY frequency DESC";
  db.query(query, [userId, courseName], (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    const topics = res.map(item => ({
        topic: item.topic_name,
        frequency: item.frequency
    }));
    console.log(`Found ${topics.length} saved PYQ topics for user ${userId} and course ${courseName}.`);
    result(null, topics);
  });
};

/**
 * --- THIS IS THE FIX ---
 * We wrap the database query in a Promise so the controller can 'await' it.
 */
PyqAnalysis.createBulk = (userId, courseName, topics) => {
  return new Promise((resolve, reject) => {
    if (!topics || topics.length === 0) {
      return resolve({ message: "No topics to add." });
    }

    const values = topics.map(item => [userId, courseName, item.topic, item.frequency]);
    
    const query = "INSERT IGNORE INTO pyq_analysis_topics (user_id, course_name, topic_name, frequency) VALUES ?";
    
    db.query(query, [values], (err, res) => {
      if (err) {
        console.log("error: ", err);
        return reject(err); // Reject the promise on error
      }
      // Resolve the promise on success
      resolve({ insertedCount: res.affectedRows });
    });
  });
};
// -----------------------

module.exports = PyqAnalysis;

