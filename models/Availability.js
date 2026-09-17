const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    photographerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      required: true,
    },
    category: {
      type: String,
      enum: ["travel", "personal", "booked", "rest", "other"],
      default: "other",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

availabilitySchema.index({ photographerEmail: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema);