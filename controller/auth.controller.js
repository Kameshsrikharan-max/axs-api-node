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
    const result = await authService.verifyLoginOtp(email, otp);

    if (result.needsSignup) {
      return res.json({
        success: true,
        needsSignup: true,
        email: result.email,
        signupToken: result.signupToken,
      });
    }

    res.json({
      success: true,
      needsSignup: false,
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
}

async function completeSignup(req, res, next) {
  try {
    const { signupToken, name, phone } = req.body;
    const { user, token } = await authService.completeSignup(signupToken, { name, phone });
    res.json({ success: true, user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp, completeSignup };