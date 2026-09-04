const userRepository = require("../repository/user.repository");
const otpService = require("./otp.service");
const { makeToken, nameFromEmail } = require("../utils/token");
const AppError = require("../config/errors/AppError");
const StudioProfile = require("../models/StudioProfile");
const PhotographerProfile = require("../models/PhotographerProfile");
const StudioManagerProfile = require("../models/StudioManagerProfile");
const StudioPhotographerProfile = require("../models/StudioPhotographerProfile");

// Roles that require a super-admin-approved profile before they're allowed
// to log in. super_admin/admin/user have no profile gate.
const PROFILE_MODEL_BY_ROLE = {
  studio_admin: StudioProfile,
  freelance_photographer: PhotographerProfile,
  studio_manager: StudioManagerProfile,
  studio_photographer: StudioPhotographerProfile,
};

async function assertApproved(user) {
  const ProfileModel = PROFILE_MODEL_BY_ROLE[user.role];
  if (!ProfileModel) {
    return; // no approval gate for this role
  }

  const profile = await ProfileModel.findOne({ userId: user._id });
  if (!profile || profile.status !== "active") {
    throw new AppError(
      "Your registration is still awaiting admin approval. We'll notify you by email once it's reviewed.",
      403
    );
  }
}

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
    const signupToken = makeToken(email);
    return { needsSignup: true, email, signupToken };
  }

  await assertApproved(user);

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