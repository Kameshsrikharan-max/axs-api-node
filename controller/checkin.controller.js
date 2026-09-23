const checkinService = require("../service/checkin.service");

async function getContext(req, res, next) {
  try {
    const context = await checkinService.getCheckInContext(req.params.token);
    res.json(context);
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const { arrivedConfirmed, photo, lat, lng } = req.body;
    const checkIn = await checkinService.submitCheckIn(req.params.token, {
      arrivedConfirmed,
      photo,
      lat,
      lng,
    });
    res.status(201).json({ success: true, checkInId: checkIn._id });
  } catch (err) {
    next(err);
  }
}

async function recent(req, res, next) {
  try {
    const list = await checkinService.listRecent();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function statusForEvents(req, res, next) {
  try {
    const raw = req.query.eventIds || "";
    const eventIds = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    if (!eventIds.length) return res.json([]);
    const status = await checkinService.getStatusForEvents(eventIds);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function statusForEvent(req, res, next) {
  try {
    const detail = await checkinService.getCheckInDetailForEvent(req.params.eventId);
    if (!detail) return res.status(404).json({ message: "Event not found." });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

async function resend(req, res, next) {
  try {
    const { photographerEmail } = req.body;
    if (!photographerEmail) {
      return res.status(400).json({ message: "photographerEmail is required." });
    }
    await checkinService.resendCheckInEmail(req.params.eventId, photographerEmail);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getContext, submit, recent, statusForEvents, statusForEvent, resend };