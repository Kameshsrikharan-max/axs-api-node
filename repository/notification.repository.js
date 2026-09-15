const Notification = require("../models/Notification");

async function create(data) {
  return Notification.create(data);
}

async function findByRecipient(email) {
  return Notification.find({ recipientEmail: email.toLowerCase() }).sort({ createdAt: -1 });
}

async function findById(id) {
  return Notification.findById(id);
}

async function markRead(id) {
  return Notification.findByIdAndUpdate(id, { read: true }, { new: true });
}

async function markAllRead(email) {
  return Notification.updateMany(
    { recipientEmail: email.toLowerCase(), read: false },
    { $set: { read: true } }
  );
}

async function deleteById(id) {
  return Notification.findByIdAndDelete(id);
}

async function deleteAllForRecipient(email) {
  return Notification.deleteMany({ recipientEmail: email.toLowerCase() });
}

module.exports = {
  create,
  findByRecipient,
  findById,
  markRead,
  markAllRead,
  deleteById,
  deleteAllForRecipient,
};