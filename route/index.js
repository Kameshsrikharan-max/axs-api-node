const express = require("express");
const authRoutes = require("./auth.routes");

const router = express.Router();

router.use("/", authRoutes);
// As you add more resources (e.g. studios, events), mount their routers here:
// router.use("/events", eventRoutes);

module.exports = router;
