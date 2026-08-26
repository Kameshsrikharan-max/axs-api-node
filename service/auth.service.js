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

  let user = await userRepository.findByEmail(email);
  if (!user) {
    user = await userRepository.createUser({ name: nameFromEmail(email), email });
  }

  const token = makeToken(email);
  return { user, token };
}

module.exports = { sendLoginOtp, verifyLoginOtp };
