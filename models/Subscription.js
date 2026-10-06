const mongoose = require("mongoose");

// One subscription document per user; plan changes overwrite it,
// every payment stays in the Payment collection as history.
const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ["active", "cancelled", "expired"], default: "active", index: true },
    autoRenewal: { type: Boolean, default: true },
    cycleStart: { type: Date, required: true },
    cycleEnd: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
    lastTxnId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);