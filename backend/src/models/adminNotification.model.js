import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "announcement",
        "emergency",
        "category",
        "user_specific",
        "update",
        "alert",
        "info",
        "reminder",
        "warning",
        "success",
        "maintenance",
      ],
      default: "announcement",
    },
    targetAudience: {
      type: String,
      default: "everyone", // 'everyone' | 'selected' | categoryName
    },
    targetUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminNotification", adminNotificationSchema);
