const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const auditLogController = require("../controller/auditLog.controller");

const router = express.Router();

router.get("/admin/audit-logs", authenticate, requireSuperAdmin, auditLogController.list);
router.get("/admin/audit-logs/stats", authenticate, requireSuperAdmin, auditLogController.stats);

module.exports = router;