const Event = require("../models/Event");
const User = require("../models/User");
const Notification = require("../models/Notification");
const checkinRepository = require("../repository/checkin.repository");
const { verify, sign } = require("../utils/checkinToken");
const { parseEventStart } = require("../utils/eventTime");
const { isPhotographerRole } = require("../utils/photographerRole");
const { sendCheckInAlertEmail, sendCheckInEmail } = require("../utils/mailer");
const AppError = require("../config/errors/AppError");

const WINDOW_MS = 60 * 60 * 1000; // 1 hour before event start

/**
 * Re-derives validity from scratch on every request — never trusts the
 * client, and never trusts that the link's embedded timestamp still matches
 * the event (covers reschedules after the email already went out).
 */
async function resolveTokenState(token) {
  const decoded = verify(token);
  if (!decoded) return { state: "invalid" };

  const event = await Event.findById(decoded.eventId);
  if (!event) return { state: "invalid" };

  const actualStart = parseEventStart(event.date, event.time);
  if (!actualStart || actualStart !== decoded.eventTimestamp) {
    return { state: "invalid" };
  }

  const now = Date.now();
  const windowStart = actualStart - WINDOW_MS;

  if (now < windowStart) return { state: "not_yet_valid", event, decoded, opensAt: windowStart };
  if (now >= actualStart) return { state: "expired", event, decoded };

  const existing = await checkinRepository.findByEventAndPhotographer(
    event._id,
    decoded.photographerEmail
  );
  if (existing) return { state: "already_checked_in", event, decoded, checkIn: existing };

  return { state: "valid", event, decoded };
}

function findMember(event, email) {
  return (event.assignedMembersList || []).find(
    (m) => (m.email || "").toLowerCase() === email.toLowerCase()
  );
}

async function getCheckInContext(token) {
  const result = await resolveTokenState(token);
  if (result.state === "invalid") {
    throw new AppError("This check-in link is invalid.", 404);
  }

  const member = findMember(result.event, result.decoded.photographerEmail);

  return {
    state: result.state,
    opensAt: result.opensAt || null,
    event: {
      name: result.event.name,
      date: result.event.date,
      time: result.event.time,
      address: result.event.address,
      city: result.event.city,
    },
    photographer: {
      name: member?.name || "",
      email: result.decoded.photographerEmail,
    },
  };
}

async function notifyAdmins(event, checkIn) {
  const admins = await User.find({ role: { $in: ["studio_admin", "super_admin"] } });
  const recipients = admins.filter((a) => a.email);

  const photographerLabel = checkIn.photographerName || checkIn.photographerEmail;

  // In-app: one Notification doc per admin, matching the schema /studio/notifications
  // already serves (recipientEmail-scoped — same pattern the assignment flow uses).
  // ASSUMPTION, unconfirmed: GET /studio/notifications filters by
  // `recipientEmail: req.user.email`. If it filters differently, tell me and
  // I'll adjust this instead of guessing further.
  const notificationDocs = recipients.map((a) => ({
    recipientEmail: a.email,
    notifCategory: "photographerCheckIn",
    category: "Photographer Check-In",
    title: `${photographerLabel} checked in`,
    description: `Checked in for "${event.name}"`,
    date: event.date,
    time: event.time,
    priority: "medium",
    triggeredBy: photographerLabel,
    tags: ["check-in"],
    isActionable: false,
    extraDetails: [],
    eventId: event._id,
    payload: {
      eventName: event.name,
      photographerName: photographerLabel,
      arrivedAt: new Date(checkIn.submittedAt).toLocaleString(),
      location: `${checkIn.location.lat.toFixed(4)}, ${checkIn.location.lng.toFixed(4)}`,
    },
    read: false,
  }));

  if (notificationDocs.length) {
    try {
      await Notification.insertMany(notificationDocs);
    } catch (err) {
      console.error("checkin in-app notification insert failed:", err.message);
    }
  }

  // Email: reliable across devices, doesn't depend on the admin having the app open.
  await Promise.all(
    recipients.map((a) =>
      sendCheckInAlertEmail(a.email, event, checkIn).catch((err) =>
        console.error(`checkin alert email failed for ${a.email}:`, err.message)
      )
    )
  );
}

async function submitCheckIn(token, { arrivedConfirmed, photo, lat, lng }) {
  const result = await resolveTokenState(token);

  if (result.state === "invalid") throw new AppError("This check-in link is invalid.", 404);
  if (result.state === "not_yet_valid") throw new AppError("This check-in link isn't active yet.", 403);
  if (result.state === "expired") throw new AppError("This check-in window has closed.", 410);
  if (result.state === "already_checked_in") throw new AppError("You've already checked in for this event.", 409);

  if (!arrivedConfirmed) throw new AppError("Please confirm you have arrived.", 400);
  if (!photo || typeof photo !== "string" || !photo.startsWith("data:image")) {
    throw new AppError("A live photo is required.", 400);
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new AppError("Location is required.", 400);
  }

  const member = findMember(result.event, result.decoded.photographerEmail);

  let checkIn;
  try {
    checkIn = await checkinRepository.create({
      eventId: result.event._id,
      photographerEmail: result.decoded.photographerEmail,
      photographerName: member?.name || "",
      arrivedConfirmed: true,
      photo,
      location: { lat, lng },
      submittedAt: new Date(),
    });
  } catch (err) {
    // unique index race — someone else's request landed first
    if (err.code === 11000) throw new AppError("You've already checked in for this event.", 409);
    throw err;
  }

  notifyAdmins(result.event, checkIn).catch((err) =>
    console.error("checkin admin notify failed:", err.message)
  );

  return checkIn;
}

async function listRecent(sinceHours = 24) {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  return checkinRepository.findRecent(since);
}

/**
 * For a set of eventIds, returns each event's per-photographer check-in
 * status: who's checked in (with time/location) and who's still pending.
 * Used for the event-list badge (bulk) and the event-detail panel (single id).
 */
async function getStatusForEvents(eventIds) {
  const events = await Event.find({ _id: { $in: eventIds } });
  const checkIns = await checkinRepository.findByEventIds(eventIds);

  const checkInsByEvent = new Map();
  checkIns.forEach((c) => {
    const key = c.eventId.toString();
    if (!checkInsByEvent.has(key)) checkInsByEvent.set(key, []);
    checkInsByEvent.get(key).push(c);
  });

  return events.map((event) => {
    const photographers = (event.assignedMembersList || []).filter(isPhotographerRole);
    const eventCheckIns = checkInsByEvent.get(event._id.toString()) || [];
    const checkedInEmails = new Set(eventCheckIns.map((c) => c.photographerEmail));

    const checkedIn = eventCheckIns.map((c) => ({
      photographerEmail: c.photographerEmail,
      photographerName: c.photographerName,
      submittedAt: c.submittedAt,
      location: c.location,
    }));

    const pending = photographers
      .filter((p) => p.email && !checkedInEmails.has(p.email.toLowerCase()))
      .map((p) => ({ photographerEmail: p.email, photographerName: p.name }));

    return {
      eventId: event._id,
      eventName: event.name,
      totalPhotographers: photographers.length,
      checkedIn,
      pending,
      checkinStatus: event.checkinStatus,
      checkinEmailSentAt: event.checkinEmailSentAt,
      eventStartTs: parseEventStart(event.date, event.time),
    };
  });
}

/**
 * Full detail for one event's check-ins, photo included — for the event
 * detail page panel. Deliberately separate from getStatusForEvents (bulk,
 * no photo) so the event-list badge query never has to pull base64 images.
 */
async function getCheckInDetailForEvent(eventId) {
  const [status] = await getStatusForEvents([eventId]);
  if (!status) return null;

  const checkIns = await checkinRepository.findByEventIds([eventId]);
  const photoByEmail = new Map(checkIns.map((c) => [c.photographerEmail, c.photo]));

  return {
    ...status,
    checkedIn: status.checkedIn.map((c) => ({
      ...c,
      photo: photoByEmail.get(c.photographerEmail) || null,
    })),
  };
}

/**
 * Admin-triggered manual send — same email the cron job sends, but on
 * demand. Useful if the automatic send failed, or the admin wants to give
 * the photographer more lead time. Doesn't change checkinStatus if it was
 * already "sent" (the cron job owns that transition); only flips it from
 * "not_sent" so the cron doesn't also send a duplicate later.
 */
async function resendCheckInEmail(eventId, photographerEmail) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError("Event not found.", 404);

  const member = findMember(event, photographerEmail);
  if (!member || !member.email) throw new AppError("Photographer not found on this event.", 404);

  const startTs = parseEventStart(event.date, event.time);
  if (!startTs) throw new AppError("This event's date/time could not be parsed.", 400);

  const token = sign(event._id.toString(), member.email, startTs);
  const link = `${process.env.APP_PUBLIC_URL}/checkin/${token}`;
  await sendCheckInEmail(member.email, member.name, event, link);

  if (event.checkinStatus === "not_sent" || !event.checkinStatus) {
    event.checkinStatus = "sent";
    event.checkinEmailSentAt = new Date();
    await event.save();
  }
}

module.exports = {
  getCheckInContext,
  submitCheckIn,
  listRecent,
  getStatusForEvents,
  getCheckInDetailForEvent,
  resendCheckInEmail,
};