const mongoose = require("mongoose");

const defaultItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
  },
  { _id: true }
);

const equipmentDefaultListSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [defaultItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EquipmentDefaultList", equipmentDefaultListSchema);