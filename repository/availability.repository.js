const Availability = require("../models/Availability");

async function upsertEntry(photographerEmail, { date, status, category, note }) {
  return Availability.findOneAndUpdate(
    { photographerEmail: photographerEmail.toLowerCase(), date },
    { status, category: category || "other", note: note || "" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function bulkUpsert(photographerEmail, entries) {
  const email = photographerEmail.toLowerCase();
  const ops = entries.map((e) => ({
    updateOne: {
      filter: { photographerEmail: email, date: e.date },
      update: { $set: { status: e.status, category: e.category || "other", note: e.note || "" } },
      upsert: true,
    },
  }));
  if (ops.length > 0) await Availability.bulkWrite(ops);
  return entries.length;
}

async function findByPhotographer(photographerEmail) {
  return Availability.find({ photographerEmail: photographerEmail.toLowerCase() }).lean();
}

async function findByEmailsOnDate(emails, date) {
  const rows = await Availability.find({
    photographerEmail: { $in: emails.map((e) => e.toLowerCase()) },
    date,
  }).lean();
  const map = {};
  rows.forEach((r) => { map[r.photographerEmail] = r; });
  return map;
}

async function deleteEntry(photographerEmail, date) {
  return Availability.findOneAndDelete({ photographerEmail: photographerEmail.toLowerCase(), date });
}

module.exports = {
  upsertEntry,
  bulkUpsert,
  findByPhotographer,
  findByEmailsOnDate,
  deleteEntry,
};