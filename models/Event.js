const mongoose = require("mongoose");

const assignedMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: { type: String, lowercase: true, trim: true },
    mobile: String,
    city: String,
    role: String,
    assignRole: String,
    service: String,
    status: { type: String, default: "Confirmed" },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, default: "Event" },
    date: String,
    time: String,
    address: String,
    city: String,
    state: String,
    customer: String,
    customerPhone: String,
    customerEmail: String,
    status: { type: String, default: "DRAFT" },
    pipeline: { type: String, default: "Proposal" },
    members: { type: Number, default: 0 },
    budget: String,
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    },
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    selectedServices: { type: [String], default: [] },
    albumData: { type: mongoose.Schema.Types.Mixed, default: {} },
    assignedMembersList: { type: [assignedMemberSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Pre-event check-in tracking
    checkinStatus: {
      type: String,
      enum: ["not_sent", "sent", "expired"],
      default: "not_sent",
    },
    checkinEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);