import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["message", "sellProduct", "foundProduct", "user", "ticket", "pass"],
      default: "message",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    reportedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: false,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
