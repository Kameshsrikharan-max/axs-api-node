const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["studio_manager", "studio_photographer"], required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studioName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "cancelled"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);