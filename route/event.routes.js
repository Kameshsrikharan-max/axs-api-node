const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const requireAdminAccess = require("../middleware/requireAdminAccess");
const eventController = require("../controller/event.controller");

router.use(authenticate);

router.post("/studio/events", requireAdminAccess, eventController.create);
router.get("/studio/events", eventController.list);
router.get("/studio/events/:id", eventController.getOne);
router.patch("/studio/events/:id", requireAdminAccess, eventController.update);
router.patch("/studio/events/:id/assign-team", requireAdminAccess, eventController.assignTeam);

module.exports = router;