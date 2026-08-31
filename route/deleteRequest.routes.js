const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const deleteRequestController = require("../service/deleteRequest.controller");

const router = express.Router();


router.post("/account/delete-request", authenticate, deleteRequestController.requestDelete);


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