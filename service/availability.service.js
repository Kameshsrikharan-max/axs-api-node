const availabilityRepository = require("../repository/availability.repository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function setMyAvailability(photographerEmail, { date, status, category, note }) {
  if (!date) throw httpError("date is required", 400);
  if (!status) throw httpError("status is required", 400);
  return availabilityRepository.upsertEntry(photographerEmail, { date, status, category, note });
}

async function bulkSetMyAvailability(photographerEmail, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw httpError("entries[] is required", 400);
  }
  const count = await availabilityRepository.bulkUpsert(photographerEmail, entries);
  return { count };
}

async function getMyAvailability(photographerEmail) {
  return availabilityRepository.findByPhotographer(photographerEmail);
}

async function clearMyAvailability(photographerEmail, date) {
  return availabilityRepository.deleteEntry(photographerEmail, date);
}

async function checkAvailabilityForAssignment(emails, date) {
  if (!Array.isArray(emails) || emails.length === 0) throw httpError("emails[] is required", 400);
  if (!date) throw httpError("date is required", 400);

  const map = await availabilityRepository.findByEmailsOnDate(emails, date);
  return emails.map((email) => {
    const entry = map[email.toLowerCase()];
    const available = !entry || entry.status !== "unavailable";
    return {
      email,
      available,
      reason: available ? null : { category: entry.category, note: entry.note },
    };
  });
}

module.exports = {
  setMyAvailability,
  bulkSetMyAvailability,
  getMyAvailability,
  clearMyAvailability,
  checkAvailabilityForAssignment,
};