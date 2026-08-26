const User = require("../model/User");

async function findByEmail(email) {
  return User.findOne({ email });
}

async function createUser({ name, email }) {
  return User.create({ name, email });
}

module.exports = { findByEmail, createUser };
