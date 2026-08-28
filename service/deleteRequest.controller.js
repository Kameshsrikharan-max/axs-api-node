const deleteRequestService = require("../service/deleteRequest.service");

async function requestDelete(req, res, next) {
  try {
    const userId = req.user._id;
    const reason = (req.body.reason || "").trim();
    const user = await deleteRequestService.requestDeletion(userId, reason);
    res.json({
      success: true,
      message: "Delete request submitted. A super admin will review it.",
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function listPending(req, res, next) {
  try {
    const users = await deleteRequestService.listPendingRequests();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const { userId } = req.params;
    const result = await deleteRequestService.approveDeletion(userId);
    res.json({
      success: true,
      message: `Account for ${result.email} permanently deleted`,
    });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await deleteRequestService.rejectDeletion(userId);
    res.json({ success: true, message: "Delete request rejected", user });
  } catch (err) {
    next(err);
  }
}

module.exports = { requestDelete, listPending, approve, reject };