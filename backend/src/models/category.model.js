import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["sell", "found", "ticket", "pass", "general"],
      default: "sell",
    },
    icon: {
      type: String,
      default: "Tag",
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1, type: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
