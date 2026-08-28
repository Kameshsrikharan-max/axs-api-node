const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "user"],
      default: "user",
    },
    deleteStatus: {
      type: String,
      enum: ["none", "pending", "rejected"],
      default: "none",
    },
    deleteRequestedAt: { type: Date, default: null },
    deleteReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);