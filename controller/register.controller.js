const registerService = require("../service/register.service");

async function registerStudioAdmin(req, res, next) {
  try {
    const { user, profile, token } = await registerService.registerStudioAdmin(req.body);
    res.status(201).json({ success: true, user, profile, token });
  } catch (err) {
    next(err);
  }
}

async function registerFreelancePhotographer(req, res, next) {
  try {
    const { user, profile, token } = await registerService.registerFreelancePhotographer(req.body);
    res.status(201).json({ success: true, user, profile, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerStudioAdmin, registerFreelancePhotographer };