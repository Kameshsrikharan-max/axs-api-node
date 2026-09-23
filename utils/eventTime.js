/**
 * Event.date / Event.time are stored as free-form strings, so this tries the
 * common shapes in order rather than assuming one. Returns epoch ms, or null
 * if nothing parseable was found.
 *
 * Handles:
 *  - date: "YYYY-MM-DD" (primary assumption) or anything Date() can parse
 *  - time: "HH:mm" (24h) or "h:mm AM/PM"
 *
 * If your app stores date/time differently, this is the only file that needs
 * to change — nothing else touches raw date/time strings.
 */
function parseEventStart(dateStr, timeStr) {
  if (!dateStr) return null;

  const base = new Date(dateStr);
  if (isNaN(base.getTime())) return null;

  let hours = 0;
  let minutes = 0;

  const raw = (timeStr || "").trim();
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);

  if (ampmMatch) {
    hours = parseInt(ampmMatch[1], 10);
    minutes = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  }

  base.setHours(hours, minutes, 0, 0);
  return base.getTime();
}

module.exports = { parseEventStart };