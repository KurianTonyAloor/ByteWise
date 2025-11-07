const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Handle new user registration
exports.signup = (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send({ message: "Email and password cannot be empty!" });
    return;
  }

  const user = {
    email: req.body.email,
    password: req.body.password,
    university: req.body.university,
    program: req.body.program,
    semester: req.body.semester,
    scheme: req.body.scheme,
  };

  User.create(user, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    } else {
      res.send({ message: "User was registered successfully!" });
    }
  });
};

// Handle user login
exports.login = (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send({ message: "Email and password cannot be empty!" });
    return;
  }

  User.findByEmail(req.body.email, (err, user) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({ message: `User not found with email ${req.body.email}.` });
      } else {
        res.status(500).send({ message: "Error retrieving User with email " + req.body.email });
      }
      return;
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      res.status(401).send({ accessToken: null, message: "Invalid Password!" });
      return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400, // 24 hours
    });

    res.status(200).send({
      id: user.id,
      email: user.email,
      university: user.university,
      scheme: user.scheme,
      program: user.program,
      semester: user.semester,
      accessToken: token,
    });
  });
};