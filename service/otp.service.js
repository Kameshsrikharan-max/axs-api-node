const { sendOtpEmail } = require("../utils/mailer");
const { saveOtp, getOtpEntry, deleteOtp, incrementAttempts, MAX_ATTEMPTS } = require("../utils/otpStore");
const { generateOtp } = require("../utils/token");
const AppError = require("../config/errors/AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

async function requestOtp(email) {
  const otp = generateOtp();
  saveOtp(email, otp);

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("sendOtpEmail failed:", err);
    throw new AppError("Failed to send OTP. Please try again.", 500);
  }
}

function verifyOtp(email, otp) {
  const entry = getOtpEntry(email);

  if (!entry) {
    throw new AppError("No OTP found. Please request a new one.", 400);
  }

  if (Date.now() > entry.expiresAt) {
    deleteOtp(email);
    throw new AppError("OTP expired. Please request a new one.", 400);
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    deleteOtp(email);
    throw new AppError("Too many attempts. Please request a new OTP.", 429);
  }

  if (entry.otp !== otp) {
    incrementAttempts(email);
    throw new AppError("Incorrect OTP. Please try again.", 400);
  }

  deleteOtp(email);
}

module.exports = { isValidEmail, requestOtp, verifyOtp };
