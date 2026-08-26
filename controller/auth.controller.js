const authService = require("../service/auth.service");

async function sendOtp(req, res, next) {
  try {
    const email = (req.body.email || "").trim();
    await authService.sendLoginOtp(email);
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const email = (req.body.email || "").trim();
    const otp = (req.body.otp || "").trim();
    const { user, token } = await authService.verifyLoginOtp(email, otp);
    res.json({ success: true, user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp };
