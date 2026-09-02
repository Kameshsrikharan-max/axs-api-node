const express = require("express");
const registerController = require("../controller/register.controller");

const router = express.Router();

router.post("/register/studio-admin", registerController.registerStudioAdmin);
router.post("/register/freelance-photographer", registerController.registerFreelancePhotographer);

module.exports = router;