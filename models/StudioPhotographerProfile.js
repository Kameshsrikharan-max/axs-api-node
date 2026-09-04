const mongoose = require("mongoose");

const studioPhotographerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    studioOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    basicInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      agreedToTerms: { type: Boolean, default: false },
    },

    kyc: {
      documentType: { type: String, default: "aadhaar" },
      consentGiven: { type: Boolean, default: false },
      skipped: { type: Boolean, default: false },
    },

    photographerDetails: {
      yearsExperience: { type: String, default: "" },
      specializations: { type: [String], default: [] },
      equipment: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["pending_review", "active", "rejected"],
      default: "pending_review",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudioPhotographerProfile", studioPhotographerProfileSchema);