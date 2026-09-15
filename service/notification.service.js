const notificationRepository = require("../repository/notification.repository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function createNotification(payload) {
  if (!payload.recipientEmail) throw httpError("recipientEmail is required", 400);
  if (!payload.title) throw httpError("title is required", 400);

  return notificationRepository.create({
    recipientEmail: payload.recipientEmail,
    notifCategory: payload.notifCategory || "eventAssignment",
    category: payload.category || "Event Assignment",
    title: payload.title,
    description: payload.description || "",
    date: payload.date,
    time: payload.time || "",
    priority: payload.priority || "normal",
    triggeredBy: payload.triggeredBy || "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    isActionable: Boolean(payload.isActionable),
    extraDetails: Array.isArray(payload.extraDetails) ? payload.extraDetails : [],
    eventId: payload.eventId || null,
    payload: payload.payload || null,
    read: false,
  });
}

async function listForUser(email) {
  return notificationRepository.findByRecipient(email);
}

async function markRead(id, requesterEmail) {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw httpError("Notification not found", 404);
  if (notification.recipientEmail !== requesterEmail.toLowerCase()) {
    throw httpError("Not authorized to modify this notification", 403);
  }
  return notificationRepository.markRead(id);
}

async function markAllRead(email) {
  return notificationRepository.markAllRead(email);
}

async function deleteOne(id, requesterEmail) {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw httpError("Notification not found", 404);
  if (notification.recipientEmail !== requesterEmail.toLowerCase()) {
    throw httpError("Not authorized to delete this notification", 403);
  }
  return notificationRepository.deleteById(id);
}

async function clearAll(email) {
  return notificationRepository.deleteAllForRecipient(email);
}

module.exports = {
  createNotification,
  listForUser,
  markRead,
  markAllRead,
  deleteOne,
  clearAll,
};