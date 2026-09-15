const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    notifCategory: {
      type: String,
      default: "eventAssignment",
    },
    category: {
      type: String,
      default: "Event Assignment",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: String,
    },
    time: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      default: "normal",
    },
    triggeredBy: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    isActionable: {
      type: Boolean,
      default: false,
    },
    extraDetails: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    eventId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);