const express = require("express");
const authenticate = require("../middleware/authenticate");
const checkinController = require("../controller/checkin.controller");

const router = express.Router();

// Public — reached from the emailed link, no auth (the token itself is the credential)
router.get("/checkin/:token", checkinController.getContext);
router.post("/checkin/:token", checkinController.submit);

// Authenticated — studio/super admin dashboard polls this for the in-app notification
router.get("/checkins/recent", authenticate, checkinController.recent);

// Authenticated — event-list badges (bulk, lightweight) and event-detail panel (single, with photo)
router.get("/checkins/status", authenticate, checkinController.statusForEvents);
router.get("/checkins/status/:eventId", authenticate, checkinController.statusForEvent);

// Authenticated — admin manually re-sends the check-in email for one photographer
router.post("/checkins/resend/:eventId", authenticate, checkinController.resend);

module.exports = router;

/**
 * Wiring: add to route/index.js alongside the other *.routes requires:
 *
 *   const checkinRoutes = require("./checkin.routes");
 *   router.use("/", checkinRoutes);
 *
 * (Routes are mounted at root via app.use("/", routes) in your main server
 * file, so these paths are reachable as /checkin/:token, /checkins/recent,
 * /checkins/status, /checkins/status/:eventId — no /api prefix.)
 *
 * Also make sure the JSON body parser allows a large enough payload for the
 * base64 photo, e.g.:
 *
 *   app.use(express.json({ limit: "8mb" }));
 */