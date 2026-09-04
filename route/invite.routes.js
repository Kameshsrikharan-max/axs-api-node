const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireStudioAdmin = require("../middleware/requireStudioAdmin");
const inviteController = require("../controller/invite.controller");

const router = express.Router();

// Studio Admin sends an invite — authenticated + role-gated.
router.post("/studio/invite", authenticate, requireStudioAdmin, inviteController.sendInvite);

// Public — the invited person hasn't logged in yet.
router.get("/invite/:token", inviteController.getInvite);
router.post("/invite/:token/register", inviteController.acceptInvite);

module.exports = router;