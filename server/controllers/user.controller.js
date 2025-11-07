const User = require("../models/user.model.js");

exports.updateScheme = (req, res) => {
  if (!req.body.scheme) {
    return res.status(400).send({ message: "Scheme cannot be empty!" });
  }
  
  // req.userId is added by the verifyToken middleware
  User.updateScheme(req.userId, req.body.scheme, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({ message: `Not found User with id ${req.userId}.` });
      } else {
        res.status(500).send({ message: "Error updating User with id " + req.userId });
      }
    } else {
      res.send({ message: "Scheme updated successfully!" });
    }
  });
};