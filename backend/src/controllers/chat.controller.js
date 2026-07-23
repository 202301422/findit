import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Report from "../models/report.model.js";
import UserNotification from "../models/userNotification.model.js";
import { uploadImage } from "../utils/cloudinary.js";

// ─── GET OR CREATE CONVERSATION ─────────────────────────────────────────────
// POST /api/chat/conversations
// Body: { recipientId, itemId?, itemType?, itemName?, itemImage? }
export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { recipientId, itemId, itemType, itemName, itemImage } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: "recipientId is required" });
    }

    if (currentUserId === recipientId) {
      return res.status(400).json({ success: false, message: "Cannot start a conversation with yourself" });
    }

    // Build the query — find an existing conversation between these two users
    // If an itemId is provided, scope it to that item too
    const query = {
      participants: { $all: [currentUserId, recipientId] },
    };

    if (itemId) {
      query["item.itemId"] = itemId;
    }

    let conversation = await Conversation.findOne(query).populate(
      "participants",
      "name username avatar"
    );

    let isNewConversation = false;
    if (!conversation) {
      isNewConversation = true;
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        item: itemId
          ? { itemId, itemType: itemType || "sell", itemName: itemName || "", itemImage: itemImage || "" }
          : undefined,
        unreadCounts: { [recipientId]: 0, [currentUserId]: 0 },
      });
      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "name username avatar"
      );
    }

    const enrichedConv = {
      ...(conversation.toObject ? conversation.toObject() : conversation),
      myUnread: conversation.unreadCounts?.[currentUserId] || 0,
      otherParticipant: (conversation.participants || []).find(
        (p) => p && p._id && p._id.toString() !== currentUserId
      ) || null,
    };

    return res.json({ success: true, data: { conversation: enrichedConv } });
  } catch (err) {
    console.error("getOrCreateConversation error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET ALL CONVERSATIONS FOR CURRENT USER ──────────────────────────────────
// GET /api/chat/conversations
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const total = await Conversation.countDocuments({ participants: currentUserId });

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("participants", "name username avatar")
      .lean();

    // Attach the per-user unread count as a plain number
    const enriched = conversations.map((conv) => {
      const participants = (conv.participants || []).filter(Boolean);
      const otherParticipant = participants.find(
        (p) => p && p._id && p._id.toString() !== currentUserId
      ) || { name: "User", username: "", avatar: "" };

      return {
        ...conv,
        myUnread: conv.unreadCounts?.[currentUserId] || 0,
        otherParticipant,
      };
    });

    return res.json({
      success: true,
      data: {
        conversations: enriched,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + conversations.length < total,
      }
    });
  } catch (err) {
    console.error("getConversations error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ─── GET MESSAGES FOR A CONVERSATION ────────────────────────────────────────
// GET /api/chat/conversations/:id/messages?page=1&limit=50
export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { id: conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    // Security: ensure the user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    if (!conversation.participants.map(String).includes(currentUserId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const total = await Message.countDocuments({ conversationId });
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name username avatar")
      .lean();

    return res.json({
      success: true,
      data: { messages, total, page, limit },
    });
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── SEND A MESSAGE ──────────────────────────────────────────────────────────
// POST /api/chat/conversations/:id/messages
// Body: { text }
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { id: conversationId } = req.params;
    const { text } = req.body;
    let textToSave = text ? text.trim() : "";
    let imageUrl = "";

    // Upload image to Cloudinary if provided
    if (req.file) {
      const uploaded = await uploadImage(req.file, "findit/chat_images");
      if (uploaded) {
        imageUrl = uploaded.url;
      } else {
        return res.status(500).json({ success: false, message: "Failed to upload image" });
      }
    }

    if (!textToSave && !imageUrl) {
      return res.status(400).json({ success: false, message: "Message text or image is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    if (!conversation.participants.map(String).includes(currentUserId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const message = await Message.create({
      conversationId,
      sender: currentUserId,
      text: textToSave,
      imageUrl,
    });

    // Update the conversation's last message and bump unread for the OTHER participant
    const unreadCounts = conversation.unreadCounts || new Map();
    conversation.participants.forEach((participantId) => {
      const pid = participantId.toString();
      if (pid !== currentUserId) {
        unreadCounts.set(pid, (unreadCounts.get(pid) || 0) + 1);
      }
    });

    conversation.lastMessage = imageUrl && !textToSave ? "📷 Photo" : textToSave;
    conversation.lastMessageAt = new Date();
    conversation.unreadCounts = unreadCounts;
    await conversation.save();

    // Populate sender info before emitting / returning
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username avatar")
      .lean();

    // If this is the very first message sent in this conversation, notify the recipient
    const totalMsgCount = await Message.countDocuments({ conversationId });
    if (totalMsgCount === 1) {
      const recipientId = conversation.participants.find((p) => p.toString() !== currentUserId);
      if (recipientId) {
        try {
          const itemTitle = conversation.item?.itemName || "your listing";
          const snippet = textToSave || (imageUrl ? "📷 Sent an image" : "");
          await UserNotification.create({
            recipient: recipientId,
            title: `Someone is interested in "${itemTitle}"!`,
            message: `${req.user.name} is interested in your listing "${itemTitle}" and messaged: "${snippet}"`,
            type: "chat_inquiry",
            relatedEntityId: conversation._id.toString(),
            relatedEntityType: "SellProduct",
          });
        } catch (notifErr) {
          console.error("Failed to create user notification on first message:", notifErr);
        }
      }
    }

    // Emit via socket.io if available (attached to app by server.js)
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("new_message", populatedMessage);
    }

    return res.status(201).json({ success: true, data: { message: populatedMessage } });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── MARK CONVERSATION AS READ ───────────────────────────────────────────────
// PATCH /api/chat/conversations/:id/read
export const markRead = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    if (!conversation.participants.map(String).includes(currentUserId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Reset unread count for this user
    const unreadCounts = conversation.unreadCounts || new Map();
    unreadCounts.set(currentUserId, 0);
    conversation.unreadCounts = unreadCounts;
    await conversation.save();

    // Mark all unread messages in this conversation as read
    await Message.updateMany(
      { conversationId, sender: { $ne: currentUserId }, read: false },
      { $set: { read: true } }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("markRead error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET TOTAL UNREAD MESSAGES ───────────────────────────────────────────────
// GET /api/chat/unread
export const getTotalUnread = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const conversations = await Conversation.find({ participants: currentUserId });

    let total = 0;
    for (const c of conversations) {
      if (c.unreadCounts && c.unreadCounts.has(currentUserId)) {
        total += c.unreadCounts.get(currentUserId);
      }
    }

    return res.status(200).json({ success: true, data: { totalUnread: total } });
  } catch (err) {
    console.error("getTotalUnread error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE MESSAGE ──────────────────────────────────────────────────────────
// DELETE /api/chat/conversations/messages/:messageId
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id.toString();

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own messages" });
    }

    const conversationId = message.conversationId;
    await Message.findByIdAndDelete(messageId);

    // Emit socket event to notify other user
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId.toString()).emit("message_deleted", { messageId });
    }

    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (err) {
    console.error("deleteMessage error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── REPORT MESSAGE ──────────────────────────────────────────────────────────
// POST /api/chat/conversations/messages/:messageId/report
export const reportMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id.toString();
    const { reason } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    await Report.create({
      reportedMessageId: messageId,
      reportedBy: currentUserId,
      reason: reason || "Inappropriate content",
    });

    return res.status(201).json({ success: true, message: "Message reported successfully" });
  } catch (err) {
    console.error("reportMessage error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
