import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Optional: link conversation to a specific listing
    item: {
      itemId: { type: mongoose.Schema.Types.ObjectId },
      itemType: {
        type: String,
        enum: ["sell", "found", "ticket", "pass"],
      },
      itemName: { type: String, default: "" },
      itemImage: { type: String, default: "" },
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    // Map of userId -> unread count
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index so we can quickly find conversations between two users for a given item
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
