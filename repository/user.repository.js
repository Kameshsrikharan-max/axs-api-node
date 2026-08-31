const User = require("../models/User");

async function findByEmail(email) {
  return User.findOne({ email });
}

async function findById(id) {
  return User.findById(id);
}

async function createUser({ name, email }) {
  return User.create({ name, email });
}

async function markDeleteRequested(userId, reason) {
  return User.findByIdAndUpdate(
    userId,
    {
      deleteStatus: "pending",
      deleteRequestedAt: new Date(),
      deleteReason: reason || "",
    },
    { new: true }
  );
}

async function clearDeleteRequest(userId) {
  return User.findByIdAndUpdate(
    userId,
    {
      deleteStatus: "none",
      deleteRequestedAt: null,
      deleteReason: "",
    },
    { new: true }
  );
}

async function findPendingDeleteRequests() {
  return User.find({ deleteStatus: "pending" }).sort({ deleteRequestedAt: 1 });
}

async function deleteUserById(userId) {
  return User.findByIdAndDelete(userId);
}

module.exports = {findByEmail,findById,createUser,markDeleteRequested,clearDeleteRequest,findPendingDeleteRequests,deleteUserById,};