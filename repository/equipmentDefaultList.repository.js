const EquipmentDefaultList = require("../models/EquipmentDefaultList");

async function findByOwner(ownerId) {
  return EquipmentDefaultList.findOne({ owner: ownerId });
}

async function upsert(ownerId, items) {
  return EquipmentDefaultList.findOneAndUpdate(
    { owner: ownerId },
    { owner: ownerId, items },
    { new: true, upsert: true }
  );
}

module.exports = { findByOwner, upsert };