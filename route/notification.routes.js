const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const notificationController = require("../controller/notification.controller");

// All notification routes require a logged-in user — req.user is attached
// by authenticate.js the same way it is for /studio/users.
router.use(authenticate);

// Create a notification for a specific recipient (called from
// TeamAssignmentPage when a photographer is assigned).
router.post("/notifications", notificationController.create);

// The logged-in user's own notifications, newest first.
router.get("/notifications", notificationController.list);

// Mark all of the logged-in user's notifications as read.
router.patch("/notifications/read-all", notificationController.markAllRead);

// Mark a single notification as read (must belong to the requester).
router.patch("/notifications/:id/read", notificationController.markRead);

// Delete a single notification (must belong to the requester).
router.delete("/notifications/:id", notificationController.remove);

// Clear all of the logged-in user's notifications.
router.delete("/notifications", notificationController.clearAll);

module.exports = router;