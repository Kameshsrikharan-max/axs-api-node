const registrationApprovalService = require("../service/registrationApproval.service");

async function listPending(req, res, next) {
  try {
    const registrations = await registrationApprovalService.listPendingRegistrations();
    res.json({ success: true, registrations });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const { type, profileId } = req.params;
    const result = await registrationApprovalService.approveRegistration(type, profileId);
    res.json({ success: true, message: `${result.email} approved and activated`, ...result });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const { type, profileId } = req.params;
    const result = await registrationApprovalService.rejectRegistration(type, profileId);
    res.json({ success: true, message: `Registration for ${result.email} rejected`, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPending, approve, reject };