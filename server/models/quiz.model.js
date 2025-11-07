const db = require("../config/db.config.js");

const QuizResult = {};

QuizResult.create = (newResult, result) => {
  const query = "INSERT INTO quiz_results (user_id, topic, score, total_questions, correct_answers) VALUES (?, ?, ?, ?, ?)";
  const params = [
    newResult.userId,
    newResult.topic,
    newResult.score,
    newResult.totalQuestions,
    newResult.correctAnswers
  ];

  db.query(query, params, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    console.log("created quiz result: ", { id: res.insertId, ...newResult });
    result(null, { id: res.insertId, ...newResult });
  });
};

module.exports = QuizResult;