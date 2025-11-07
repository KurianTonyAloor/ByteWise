const db = require("../config/db.config.js");
const bcrypt = require("bcryptjs");

const User = {};

User.create = (newUser, result) => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newUser.password, salt);

  // Updated query to include the new column
  const query = "INSERT INTO users (email, password, university, program, semester, scheme, last_semester_update) VALUES (?, ?, ?, ?, ?, ?, ?)";
  // Added new Date() to set the current date on creation
  const params = [newUser.email, hashedPassword, newUser.university, newUser.program, newUser.semester, newUser.scheme || null, new Date()];

  db.query(query, params, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    console.log("created user: ", { id: res.insertId, ...newUser });
    result(null, { id: res.insertId, ...newUser });
  });
};

User.findByEmail = (email, result) => {
  db.query(`SELECT * FROM users WHERE email = ?`, [email], (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    if (res.length) {
      console.log("found user: ", res[0]);
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

User.updateScheme = (id, scheme, result) => {
  db.query(
    "UPDATE users SET scheme = ? WHERE id = ?",
    [scheme, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, scheme: scheme });
    }
  );
};

User.findById = (id, result) => {
  db.query(`SELECT * FROM users WHERE id = ?`, [id], (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

module.exports = User;