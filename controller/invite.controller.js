const inviteService = require("../service/invite.service");

async function sendInvite(req, res, next) {
  try {
    const { email, role } = req.body;
    const { invite, inviteLink } = await inviteService.sendInvite(req.user._id, { email, role });
    res.status(201).json({
      success: true,
      message: `Invite sent to ${invite.email}`,
      invite,
      inviteLink,
    });
  } catch (err) {
    next(err);
  }
}

async function getInvite(req, res, next) {
  try {
    const { token } = req.params;
    const invite = await inviteService.getInviteByToken(token);
    res.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        studioName: invite.studioName,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function acceptInvite(req, res, next) {
  try {
    const { token } = req.params;
    const { user, profile } = await inviteService.registerViaInvite(token, req.body);
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

module.exports = { sendInvite, getInvite, acceptInvite };