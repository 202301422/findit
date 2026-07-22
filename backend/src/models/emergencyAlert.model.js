import mongoose from "mongoose";

const emergencyAlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Emergency alert title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Emergency alert description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "campus",
        "security",
        "weather",
        "medical",
        "fire",
        "maintenance",
        "power",
        "internet",
        "event_cancellation",
      ],
      default: "campus",
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "critical",
    },
    activeUntil: {
      type: Date,
      required: [true, "Active until date is required"],
    },
    requireAcknowledgement: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acknowledgedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ isActive: 1, activeUntil: 1 });
emergencyAlertSchema.index({ createdAt: -1 });

const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);

export default EmergencyAlert;
