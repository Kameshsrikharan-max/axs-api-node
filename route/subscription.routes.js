const express = require("express");
const authMod = require("../middleware/authenticate");
const controller = require("../controller/subscription.controller");

const authenticate = authMod.authenticate || authMod;
const router = express.Router();

// Public
router.get("/plans", controller.getPlans);
router.post("/contact-sales", controller.contactSales);

// Authenticated
router.use(authenticate);
router.get("/me", controller.getMe);
router.post("/checkout", controller.createCheckout);
router.post("/checkout/:txnId/confirm", controller.confirmPayment);
router.post("/cancel", controller.cancel);
router.post("/reactivate", controller.reactivate);
router.patch("/auto-renewal", controller.setAutoRenewal);
router.post("/receipts/:txnId/email", controller.resendReceipt);

module.exports = router;