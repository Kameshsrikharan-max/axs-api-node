const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    photographerEmail: { type: String, required: true, lowercase: true, trim: true },
    photographerName: { type: String, default: "" },
    arrivedConfirmed: { type: Boolean, default: false },
    photo: { type: String, required: true }, // base64 data URL, captured live from camera — never an uploaded file
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

checkInSchema.index({ eventId: 1, photographerEmail: 1 }, { unique: true });

module.exports = mongoose.model("CheckIn", checkInSchema);