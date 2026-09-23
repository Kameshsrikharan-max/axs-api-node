const crypto = require("crypto");

// Reuse SMTP_PASS as a fallback secret only if CHECKIN_TOKEN_SECRET isn't set.
// Set CHECKIN_TOKEN_SECRET explicitly in .env for production.
const SECRET = process.env.CHECKIN_TOKEN_SECRET || process.env.SMTP_PASS || "axs-checkin-fallback-secret";

/**
 * eventTimestamp is the event's resolved start time (ms epoch) at the moment the
 * email was sent. If the event gets rescheduled afterwards, the token silently
 * stops matching (see checkin.service.js) instead of trusting a stale time.
 */
function sign(eventId, photographerEmail, eventTimestamp) {
  const payload = `${eventId}:${photographerEmail.toLowerCase()}:${eventTimestamp}`;
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("hex");

  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  let payload;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const [eventId, photographerEmail, eventTimestampStr] = payload.split(":");
  const eventTimestamp = Number(eventTimestampStr);
  if (!eventId || !photographerEmail || !Number.isFinite(eventTimestamp)) return null;

  return { eventId, photographerEmail, eventTimestamp };
}

module.exports = { sign, verify };