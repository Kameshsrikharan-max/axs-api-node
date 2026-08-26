const store = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function saveOtp(email, otp) {
  store.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });
}

function getOtpEntry(email) {
  return store.get(email.toLowerCase()) || null;
}

function deleteOtp(email) {
  store.delete(email.toLowerCase());
}

function incrementAttempts(email) {
  const entry = store.get(email.toLowerCase());
  if (entry) entry.attempts += 1;
}

module.exports = { saveOtp, getOtpEntry, deleteOtp, incrementAttempts, MAX_ATTEMPTS };
