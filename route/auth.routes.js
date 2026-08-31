const express = require("express");
const authController = require("../controller/auth.controller");

const router = express.Router();

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/complete-signup", authController.completeSignup);

module.exports = router;