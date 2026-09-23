const cron = require("node-cron");
const Event = require("../models/Event");
const { sign } = require("../utils/checkinToken");
const { parseEventStart } = require("../utils/eventTime");
const { sendCheckInEmail } = require("../utils/mailer");
const { isPhotographerRole } = require("../utils/photographerRole");

const WINDOW_MS = 60 * 60 * 1000;


async function runOnce() {
  const now = Date.now();

  const candidates = await Event.find({
    checkinStatus: { $in: ["not_sent", null] },
    "assignedMembersList.0": { $exists: true },
  });

  for (const event of candidates) {
    const startTs = parseEventStart(event.date, event.time);
    if (!startTs) continue; // unparsable date/time — skip rather than guess

    const sendAt = startTs - WINDOW_MS;

    if (now >= startTs) {
      // event already started and we never sent — mark expired, don't send late
      event.checkinStatus = "expired";
      await event.save();
      continue;
    }

    if (now < sendAt) continue; // not time yet

    const photographers = (event.assignedMembersList || []).filter(
      (m) => m.email && isPhotographerRole(m)
    );

    if (!photographers.length) {
      // nothing to send to, but don't re-check this event every 5 min forever
      event.checkinStatus = "sent";
      event.checkinEmailSentAt = new Date();
      await event.save();
      continue;
    }

    for (const p of photographers) {
      const token = sign(event._id.toString(), p.email, startTs);
      const link = `${process.env.APP_PUBLIC_URL}/checkin/${token}`;
      try {
        await sendCheckInEmail(p.email, p.name, event, link);
      } catch (err) {
        console.error(`check-in email failed for ${p.email} (event ${event._id}):`, err.message);
      }
    }

    event.checkinStatus = "sent";
    event.checkinEmailSentAt = new Date();
    await event.save();
  }
}

function startCheckinScheduler() {
  // Every 5 minutes — tight enough that the "1 hour before" send is never late by more than that.
  cron.schedule("*/5 * * * *", () => {
    runOnce().catch((err) => console.error("checkinScheduler run failed:", err));
  });
}

module.exports = startCheckinScheduler;

/**
 * Wiring (in your main server file, after mongoose.connect resolves):
 *
 *   const startCheckinScheduler = require("./cron/checkinScheduler");
 *   startCheckinScheduler();
 *
 * Requires: npm install node-cron
 * Requires env: APP_PUBLIC_URL (e.g. https://app.aperturexstudios.com — no trailing slash)
 */