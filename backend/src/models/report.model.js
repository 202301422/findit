import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
