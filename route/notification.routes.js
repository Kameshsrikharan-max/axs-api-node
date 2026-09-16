const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const notificationController = require("../controller/notification.controller");

router.use(authenticate);

router.post("/studio/notifications", notificationController.create);
router.get("/studio/notifications", notificationController.list);
router.patch("/studio/notifications/read-all", notificationController.markAllRead);
router.patch("/studio/notifications/:id/read", notificationController.markRead);
router.delete("/studio/notifications/:id", notificationController.remove);
router.delete("/studio/notifications", notificationController.clearAll);

module.exports = router;