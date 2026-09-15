const express = require("express");
const router = express.Router();
const { sendReceipt } = require("../controller/receipt.controller");

router.post("/send-receipt-email", sendReceipt);

module.exports = router;