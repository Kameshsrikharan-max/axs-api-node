const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const eventController = require("../controller/event.controller");

// Same convention as notification.routes.js: this router is mounted at "/"
// in route/index.js, so paths bake in the "/studio" prefix themselves.
router.use(authenticate);

router.get("/studio/events", eventController.list);
router.get("/studio/events/:id", eventController.get);
router.post("/studio/events", eventController.create);
router.patch("/studio/events/:id", eventController.update);
router.patch("/studio/events/:id/assign", eventController.assignTeam);
router.delete("/studio/events/:id", eventController.remove);

module.exports = router;