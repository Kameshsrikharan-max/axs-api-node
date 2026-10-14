const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },

    action: { type: String, required: true, index: true }, // e.g. "registration.approve"
    category: {
      type: String,
      enum: ["auth", "registration", "delete_request", "checkin", "admin", "system"],
      default: "system",
      index: true,
    },
    summary: { type: String, default: "" },

    method: { type: String, default: "" },
    path: { type: String, default: "" },
    statusCode: { type: Number, default: 0 },
    outcome: { type: String, enum: ["success", "failure"], default: "success", index: true },

    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);