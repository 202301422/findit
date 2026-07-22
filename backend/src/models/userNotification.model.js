import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
      enum: ["broadcast", "emergency", "listing_update", "admin_message", "system"],
      default: "system",
    },
    relatedEntityId: {
      type: String,
    },
    relatedEntityType: {
      type: String,
      enum: ["SellProduct", "FoundProduct", "Pass", "Ticket", "Broadcast", "EmergencyAlert", "User"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userNotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const UserNotification = mongoose.model("UserNotification", userNotificationSchema);

export default UserNotification;
