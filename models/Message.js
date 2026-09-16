const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    mentions: {
      type: [String],
      default: [],
    },
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);