import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Broadcast title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Broadcast message content is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "announcement", "reminder", "update", "warning", "success", "maintenance"],
      default: "announcement",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    targetAudience: {
      type: String,
      enum: [
        "everyone",
        "all_students",
        "marketplace_users",
        "lost_found_users",
        "ticket_users",
        "pass_users",
        "selected_users",
        "selected_departments",
      ],
      default: "everyone",
    },
    selectedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    selectedDepartments: [
      {
        type: String,
      },
    ],
    expiryDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

broadcastSchema.index({ createdAt: -1 });
broadcastSchema.index({ expiryDate: 1 });

const Broadcast = mongoose.model("Broadcast", broadcastSchema);

export default Broadcast;
