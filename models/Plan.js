const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "\u20b9" },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    features: { type: [String], default: [] },
    highlighted: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Plan || mongoose.model("Plan", planSchema);