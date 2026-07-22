import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markRead,
  getTotalUnread,
  deleteMessage,
  reportMessage,
} from "../controllers/chat.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { chatMessageRateLimiter } from "../middleware/security.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/unread", getTotalUnread);
router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", chatMessageRateLimiter, upload.single("image"), sendMessage);
router.patch("/conversations/:id/read", markRead);
router.delete("/conversations/messages/:messageId", deleteMessage);
router.post("/conversations/messages/:messageId/report", reportMessage);

export default router;
