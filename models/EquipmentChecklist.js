const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    checked: { type: Boolean, default: false },
    checkedBy: { type: String, default: "" },
    checkedAt: { type: Date, default: null },
  },
  { _id: true }
);

const equipmentChecklistSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true,
    },
    items: { type: [checklistItemSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EquipmentChecklist", equipmentChecklistSchema);