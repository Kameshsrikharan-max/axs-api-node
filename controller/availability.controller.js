const availabilityService = require("../service/availability.service");

async function setMine(req, res, next) {
  try {
    const entry = await availabilityService.setMyAvailability(req.user.email, req.body);
    res.json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

async function bulkSetMine(req, res, next) {
  try {
    const result = await availabilityService.bulkSetMyAvailability(req.user.email, req.body.entries);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getMine(req, res, next) {
  try {
    const entries = await availabilityService.getMyAvailability(req.user.email);
    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
}

async function clearMine(req, res, next) {
  try {
    await availabilityService.clearMyAvailability(req.user.email, req.params.date);
    res.json({ success: true, message: "Availability entry cleared" });
  } catch (err) {
    next(err);
  }
}


async function checkAvailability(req, res, next) {
  try {
    const { emails, date } = req.body;
    const results = await availabilityService.checkAvailabilityForAssignment(emails, date);
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
}

module.exports = { setMine, bulkSetMine, getMine, clearMine, checkAvailability };