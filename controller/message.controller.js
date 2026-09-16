const messageService = require("../service/message.service");

async function create(req, res, next) {
  try {
    const message = await messageService.postMessage({
      eventId: req.body.eventId,
      senderEmail: req.user.email,
      senderName: req.user.name || req.user.email,
      senderRole: req.user.role || "",
      text: req.body.text,
      attachments: req.body.attachments,
      mentions: req.body.mentions,
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
}

async function listByEvent(req, res, next) {
  try {
    const messages = await messageService.listForEvent(req.params.eventId);
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const message = await messageService.editMessage(req.params.id, req.user.email, req.body.text);
    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await messageService.deleteMessage(req.params.id, req.user.email, req.user.role);
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listByEvent, update, remove };