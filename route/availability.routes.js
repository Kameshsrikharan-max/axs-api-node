const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const availabilityController = require("../controller/availability.controller");

router.use(authenticate);

// Photographer's own calendar
router.get("/studio/availability/me", availabilityController.getMine);
router.post("/studio/availability/me", availabilityController.setMine);
router.post("/studio/availability/me/bulk", availabilityController.bulkSetMine);
router.delete("/studio/availability/me/:date", availabilityController.clearMine);

// Studio Admin: bulk-check a list of photographers for one date (TeamAssignmentPage)
router.post("/studio/availability/check", availabilityController.checkAvailability);

module.exports = router;