import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { processAssistantChat } from "../services/assistant.service.js";

/**
 * @desc    Process user natural-language chat request and return search results / help / comparison
 * @route   POST /api/assistant/chat
 * @access  Private (Requires authentication and rate limiting)
 */
export const handleAssistantChat = asyncHandler(async (req, res) => {
  const result = await processAssistantChat(req.body);
  res.status(200).json(new ApiResponse(200, result, "Assistant chat response generated successfully"));
});
