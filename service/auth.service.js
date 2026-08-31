const userRepository = require("../repository/user.repository");
const otpService = require("./otp.service");
const { makeToken, nameFromEmail } = require("../utils/token");
const AppError = require("../config/errors/AppError");

async function sendLoginOtp(email) {
  if (!email || !otpService.isValidEmail(email)) {
    throw new AppError("Please enter a valid email address", 400);
  }
  await otpService.requestOtp(email);
}

async function verifyLoginOtp(email, otp) {
  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  otpService.verifyOtp(email, otp);

  const user = await userRepository.findByEmail(email);

  if (!user) {
    // Email ownership is verified, but there's no account for it (this
    // covers both brand-new users and users whose account was previously
    // deleted). Do NOT auto-create an account here — issue a short-lived
    // signup token instead. The frontend must send the user through
    // onboarding and call completeSignup() with this token before an
    // account is actually created.
    const signupToken = makeToken(email);
    return { needsSignup: true, email, signupToken };
  }

  const token = makeToken(email);
  return { needsSignup: false, user, token };
}

async function completeSignup(signupToken, profile) {
  if (!signupToken) {
    throw new AppError("Signup token is required", 400);
  }

  let email;
  try {
    const decoded = Buffer.from(signupToken, "base64").toString("utf8");
    email = decoded.split(":")[0];
  } catch {
    throw new AppError("Invalid signup token", 400);
  }

  if (!email) {
    throw new AppError("Invalid signup token", 400);
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    // Covers a race where the account was created between verify-otp and
    // this call (e.g. two tabs completing signup at once).
    throw new AppError("An account with this email already exists", 409);
  }

  const user = await userRepository.createUser({
    name: (profile && profile.name) || nameFromEmail(email),
    email,
  });

  const token = makeToken(email);
  return { user, token };
}

module.exports = { sendLoginOtp, verifyLoginOtp, completeSignup };