const messageRepository = require("../repository/message.repository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function postMessage(payload) {
  if (!payload.eventId) throw httpError("eventId is required", 400);
  if (!payload.senderEmail) throw httpError("senderEmail is required", 400); // now guaranteed by controller, kept as a safety net
  if (!payload.senderName) throw httpError("senderName is required", 400);   // same
  if (!payload.text || !payload.text.trim()) throw httpError("text is required", 400);


  // No backend-persisted assignment data exists yet (TeamAssignmentPage
  // only stores assignments in sessionStorage). Authorization here relies
  // on the requireAuthenticated middleware at the route level — any logged-in
  // user can post. Revisit once assignments are persisted to Mongo.

  return messageRepository.create({
    eventId: payload.eventId,
    senderEmail: payload.senderEmail,
    senderName: payload.senderName,
    senderRole: payload.senderRole || "",
    text: payload.text.trim(),
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    mentions: Array.isArray(payload.mentions) ? payload.mentions : [],
  });
}

async function listForEvent(eventId) {
  if (!eventId) throw httpError("eventId is required", 400);
  return messageRepository.findByEvent(eventId);
}

async function editMessage(id, requesterEmail, text) {
  if (!text || !text.trim()) throw httpError("text is required", 400);

  const message = await messageRepository.findById(id);
  if (!message || message.deleted) throw httpError("Message not found", 404);
  if (message.senderEmail !== requesterEmail.toLowerCase()) {
    throw httpError("Not authorized to edit this message", 403);
  }
  return messageRepository.updateText(id, text.trim());
}

async function deleteMessage(id, requesterEmail, requesterRole) {
  const message = await messageRepository.findById(id);
  if (!message || message.deleted) throw httpError("Message not found", 404);

  const isOwner = message.senderEmail === requesterEmail.toLowerCase();
  const isSuperAdmin = requesterRole === "super_admin";
  if (!isOwner && !isSuperAdmin) {
    throw httpError("Not authorized to delete this message", 403);
  }
  return messageRepository.softDeleteById(id);
}

module.exports = {
  postMessage,
  listForEvent,
  editMessage,
  deleteMessage,
};