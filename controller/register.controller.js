const registerService = require("../service/register.service");

async function registerStudioAdmin(req, res, next) {
  try {
    const { user, profile } = await registerService.registerStudioAdmin(req.body);
    res.status(201).json({
      success: true,
      message: "Registration submitted. A super admin will review your account before you can log in.",
      user,
      profile,
    });
  } catch (err) {
    next(err);
  }
}

async function registerFreelancePhotographer(req, res, next) {
  try {
    const { user, profile } = await registerService.registerFreelancePhotographer(req.body);
    res.status(201).json({
      success: true,
      message: "Registration submitted. A super admin will review your account before you can log in.",
      user,
      profile,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerStudioAdmin, registerFreelancePhotographer };