const express = require("express");
const authenticate = require("../middleware/authenticate");
const equipmentChecklistController = require("../service/equipmentChecklist.controller");

const router = express.Router();

// Studio/user-level customizable default packing list
router.get(
  "/studio/equipment/default-list",
  authenticate,
  equipmentChecklistController.getDefaultList
);
router.put(
  "/studio/equipment/default-list",
  authenticate,
  equipmentChecklistController.saveDefaultList
);

// Per-event checklist (auto-seeded from the default list the first time it's opened)
router.get(
  "/studio/events/:eventId/equipment-checklist",
  authenticate,
  equipmentChecklistController.getChecklist
);
router.post(
  "/studio/events/:eventId/equipment-checklist/items",
  authenticate,
  equipmentChecklistController.addItem
);
router.delete(
  "/studio/events/:eventId/equipment-checklist/items/:itemId",
  authenticate,
  equipmentChecklistController.removeItem
);
router.patch(
  "/studio/events/:eventId/equipment-checklist/items/:itemId",
  authenticate,
  equipmentChecklistController.setItemChecked
);

module.exports = router;