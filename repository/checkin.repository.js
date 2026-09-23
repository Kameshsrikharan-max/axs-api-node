const CheckIn = require("../models/CheckIn");

async function findByEventAndPhotographer(eventId, photographerEmail) {
  return CheckIn.findOne({
    eventId,
    photographerEmail: photographerEmail.toLowerCase(),
  });
}

async function create(data) {
  return CheckIn.create(data);
}

async function findRecent(sinceDate) {
  return CheckIn.find({ createdAt: { $gte: sinceDate } })
    .populate("eventId", "name date time address city")
    .sort({ createdAt: -1 });
}

async function findByEventIds(eventIds) {
  return CheckIn.find({ eventId: { $in: eventIds } });
}

module.exports = { findByEventAndPhotographer, create, findRecent, findByEventIds };