const db = require("../config/db.config.js");

const Course = {};

// Find courses by university, scheme, program, and semester
Course.find = (params, result) => {
  const query = "SELECT course_code, course_name FROM courses WHERE university = ? AND scheme = ? AND program = ? AND semester = ?";
  const queryParams = [params.university, params.scheme, params.program, params.semester];

  db.query(query, queryParams, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Bulk insert new courses into the database
Course.createBulk = (courses, result) => {
  if (courses.length === 0) {
    result(null, { message: "No new courses to add."});
    return;
  }
  
  // This uses a standard INSERT. We are now relying on the smarter NLP service
  // to prevent duplicate entries from being sent here.
  const query = "INSERT INTO courses (university, scheme, program, semester, course_code, course_name) VALUES ?";
  const values = courses.map(c => [c.university, c.scheme, c.program, c.semester, c.course_code, c.course_name]);

  db.query(query, [values], (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    result(null, { insertedCount: res.affectedRows });
  });
};

module.exports = Course;

