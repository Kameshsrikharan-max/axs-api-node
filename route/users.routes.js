const express = require("express");
const authenticate = require("../middleware/authenticate");
const requireAdminAccess = require("../middleware/requireAdminAccess");
const usersController = require("../controller/users.controller");

const router = express.Router();

router.get("/studio/users", authenticate, requireAdminAccess, usersController.listUsers);

module.exports = router;