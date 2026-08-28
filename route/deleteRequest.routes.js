const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const deleteRequestController = require("../service/deleteRequest.controller");

const router = express.Router();

// Any logged-in user requests deletion of their own account
router.post("/account/delete-request", authenticate, deleteRequestController.requestDelete);

// Super admin only: view + resolve pending requests
router.get(
  "/admin/delete-requests",
  authenticate,
  requireSuperAdmin,
  deleteRequestController.listPending
);
router.post(
  "/admin/delete-requests/:userId/approve",
  authenticate,
  requireSuperAdmin,
  deleteRequestController.approve
);
router.post(
  "/admin/delete-requests/:userId/reject",
  authenticate,
  requireSuperAdmin,
  deleteRequestController.reject
);

module.exports = router;