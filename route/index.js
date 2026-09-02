const express = require("express");
const authRoutes = require("./auth.routes");
const deleteRequestRoutes = require("./deleteRequest.routes");
const registerRoutes = require("./register.routes");

const router = express.Router();

router.use("/", authRoutes);
router.use("/", deleteRequestRoutes);
router.use("/", registerRoutes);
// As you add more resources (e.g. studios, events), mount their routers here:
// router.use("/events", eventRoutes);

module.exports = router;