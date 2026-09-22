const express = require("express");
const authRoutes = require("./auth.routes");
const deleteRequestRoutes = require("./deleteRequest.routes");
const registerRoutes = require("./register.routes");
const registrationApprovalRoutes = require("./registrationApproval.routes");
const inviteRoutes = require("./invite.routes");
const notificationRoutes = require("./notification.routes");
const messageRoutes = require("./message.routes");
const eventRoutes = require("./event.routes");
const availabilityRoutes = require("./availability.routes");
const equipmentChecklistRoutes = require("./equipmentChecklist.routes");

const router = express.Router();

router.use("/", authRoutes);
router.use("/", deleteRequestRoutes);
router.use("/", registerRoutes);
router.use("/", registrationApprovalRoutes);
router.use("/", inviteRoutes);
router.use("/", notificationRoutes);
router.use("/", messageRoutes);
router.use("/", eventRoutes);
router.use("/", availabilityRoutes);
router.use("/", equipmentChecklistRoutes);

module.exports = router;