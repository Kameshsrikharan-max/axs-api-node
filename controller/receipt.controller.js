const { sendReceiptEmail } = require("../utils/mailer");

async function sendReceipt(req, res) {
  const { to, receipt } = req.body;

  if (!to || !receipt) {
    return res.status(400).json({ error: "Missing 'to' or 'receipt' in request body" });
  }

  if (!receipt.transactionId || !receipt.plan || typeof receipt.amount !== "number") {
    return res.status(400).json({ error: "Malformed receipt payload" });
  }

  try {
    await sendReceiptEmail(to, receipt);
    return res.json({ success: true });
  } catch (err) {
    console.error("sendReceiptEmail failed:", err);
    return res.status(500).json({ error: "Failed to send receipt email" });
  }
}

module.exports = { sendReceipt };