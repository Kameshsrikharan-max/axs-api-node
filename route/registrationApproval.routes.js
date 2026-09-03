const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const registrationApprovalController = require("../controller/registrationApproval.controller");

const router = express.Router();

router.get(
  "/admin/registrations",
  authenticate,
  requireSuperAdmin,
  registrationApprovalController.listPending
);
router.post(
  "/admin/registrations/:type/:profileId/approve",
  authenticate,
  requireSuperAdmin,
  registrationApprovalController.approve
);
router.post(
  "/admin/registrations/:type/:profileId/reject",
  authenticate,
  requireSuperAdmin,
  registrationApprovalController.reject
);

module.exports = router;