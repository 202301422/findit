import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { assistantRateLimiter } from "../middleware/security.middleware.js";
import { handleAssistantChat } from "../controllers/assistant.controller.js";

const router = express.Router();

/**
 * @route   POST /api/assistant/chat
 * @desc    Submit a natural-language message to GetIt AI Assistant
 * @access  Private (Requires JWT token & user-level rate limiting)
 */
router.post("/chat", authenticate, assistantRateLimiter, handleAssistantChat);

export default router;
