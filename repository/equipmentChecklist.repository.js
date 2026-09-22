const EquipmentChecklist = require("../models/EquipmentChecklist");

async function findByEventId(eventId) {
  return EquipmentChecklist.findOne({ event: eventId });
}

async function create(eventId, items, createdBy) {
  return EquipmentChecklist.create({ event: eventId, items, createdBy });
}

async function addItem(eventId, item) {
  return EquipmentChecklist.findOneAndUpdate(
    { event: eventId },
    { $push: { items: item } },
    { new: true }
  );
}

async function removeItem(eventId, itemId) {
  return EquipmentChecklist.findOneAndUpdate(
    { event: eventId },
    { $pull: { items: { _id: itemId } } },
    { new: true }
  );
}

async function setItemChecked(eventId, itemId, checked, checkedBy) {
  return EquipmentChecklist.findOneAndUpdate(
    { event: eventId, "items._id": itemId },
    {
      $set: {
        "items.$.checked": checked,
        "items.$.checkedBy": checked ? checkedBy : "",
        "items.$.checkedAt": checked ? new Date() : null,
      },
    },
    { new: true }
  );
}

module.exports = {
  findByEventId,
  create,
  addItem,
  removeItem,
  setItemChecked,
};