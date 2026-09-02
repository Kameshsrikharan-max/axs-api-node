const mongoose = require("mongoose");

const photographerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

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
      referral: { type: String, default: null },
      agreedToTerms: { type: Boolean, default: false },
    },

    kyc: {
      documentType: { type: String, default: "aadhaar" },
      consentGiven: { type: Boolean, default: false },
      skipped: { type: Boolean, default: false },
    },

    photographerDetails: {
      displayName: { type: String, default: "" },
      phone: { type: String, default: "" },
      bio: { type: String, default: "" },
      yearsExperience: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      // File uploads aren't wired up yet on the frontend (media is dropped
      // before the autosave draft is serialized) — these are placeholders
      // expecting URLs once a file-upload endpoint exists.
      media: { type: [String], default: [] },
      service: { type: String, default: "" },
      specializations: { type: [String], default: [] },
      equipment: { type: String, default: "" },
      instagramLink: { type: String, default: "" },
      portfolioLink: { type: String, default: "" },
    },

    workArea: {
      mapsLink: { type: String, default: "" },
      travelRadius: { type: String, default: "" },
      documentType: { type: String, default: "" },
      // Same file-upload caveat as photographerDetails.media above.
      documentFile: { type: String, default: null },
    },

    status: {
      type: String,
      enum: ["pending_review", "active", "rejected"],
      default: "pending_review",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhotographerProfile", photographerProfileSchema);