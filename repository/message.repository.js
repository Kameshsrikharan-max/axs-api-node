const Message = require("../models/Message");

async function create(data) {
  return Message.create(data);
}

async function findByEvent(eventId) {
  return Message.find({ eventId, deleted: false }).sort({ createdAt: 1 });
}

async function findById(id) {
  return Message.findById(id);
}

async function updateText(id, text) {
  return Message.findByIdAndUpdate(
    id,
    { text, edited: true },
    { new: true }
  );
}

async function softDeleteById(id) {
  return Message.findByIdAndUpdate(id, { deleted: true }, { new: true });
}

async function hardDeleteById(id) {
  return Message.findByIdAndDelete(id);
}

async function deleteAllForEvent(eventId) {
  return Message.deleteMany({ eventId });
}

module.exports = {
  create,
  findByEvent,
  findById,
  updateText,
  softDeleteById,
  hardDeleteById,
  deleteAllForEvent,
};