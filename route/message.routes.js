const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const messageController = require("../controller/message.controller");

// All message routes require a logged-in user — req.user is attached
// by authenticate.js the same way it is for /studio/notifications.
router.use(authenticate);

// Post a new message to an event's thread. senderEmail/senderName/senderRole
// come from req.user (see message.controller.js), never from the body.
router.post("/studio/messages", messageController.create);

// Fetch a single event's thread, oldest first.
router.get("/studio/messages/:eventId", messageController.listByEvent);

// Edit a message (must belong to the requester).
router.patch("/studio/messages/:id", messageController.update);

// Delete a message (own message, or super_admin — see message.service.js).
router.delete("/studio/messages/:id", messageController.remove);

module.exports = router;