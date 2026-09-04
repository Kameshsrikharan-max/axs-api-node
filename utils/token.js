const crypto = require("crypto");

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function makeToken(email) {
  return Buffer.from(`${email}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`).toString("base64");
}

// Unrelated to makeToken above — this is a URL-safe random token for
// invite links, not tied to an email or decodable like the auth tokens.
function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

function nameFromEmail(email) {
  const prefix = email.split("@")[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

module.exports = { generateOtp, makeToken, generateInviteToken, nameFromEmail };