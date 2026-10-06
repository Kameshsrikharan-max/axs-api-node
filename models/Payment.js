const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    txnId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: String, required: true },
    // Frozen copy so old receipts never change when plans are edited.
    planSnapshot: {
      name: String,
      description: String,
      price: Number,
      currencySymbol: String,
      billingCycle: String,
      features: [String],
      highlighted: Boolean,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "\u20b9" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },
    invoiceNo: { type: String, default: null },
    upiString: { type: String, default: null },
    gatewayRef: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    receiptEmail: {
      status: { type: String, enum: ["idle", "sent", "error", "skipped"], default: "idle" },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null },
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, status: 1, paidAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);