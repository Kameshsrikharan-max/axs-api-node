const userRepository = require("../repository/user.repository");
const AppError = require("../config/errors/AppError");

async function requestDeletion(userId, reason) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.deleteStatus === "pending") {
    throw new AppError("A delete request is already pending for this account", 409);
  }

  const updated = await userRepository.markDeleteRequested(userId, reason);
  return updated;
}

async function listPendingRequests() {
  return userRepository.findPendingDeleteRequests();
}

async function approveDeletion(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.deleteStatus !== "pending") {
    throw new AppError("This user has no pending delete request", 409);
  }

  await userRepository.deleteUserById(userId);
  return { email: user.email };
}

async function rejectDeletion(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.deleteStatus !== "pending") {
    throw new AppError("This user has no pending delete request", 409);
  }

  const updated = await userRepository.clearDeleteRequest(userId);
  return updated;
}

module.exports = {requestDeletion,listPendingRequests,approveDeletion,rejectDeletion,
};