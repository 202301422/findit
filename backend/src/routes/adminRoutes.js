import express from "express";
import { authenticateUser, authorizeAdmin } from "../middleware/auth.middleware.js";
import {
  getDashboardStats,
  getAnalytics,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  toggleUserVerification,
  deleteUser,
  getSellProducts,
  updateSellProductStatus,
  deleteSellProduct,
  bulkDeleteSellProducts,
  getFoundProducts,
  updateFoundProductStatus,
  deleteFoundProduct,
  getTicketsAndPasses,
  updateTicketOrPassStatus,
  deleteTicketOrPass,
  getChatStats,
  deleteConversation,
  getReports,
  updateReportStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sendBroadcastNotification,
  createBroadcast,
  getBroadcasts,
  updateBroadcast,
  deleteBroadcast,
  getBroadcastAnalytics,
  createEmergencyAlert,
  getEmergencyAlerts,
  toggleEmergencyAlert,
  deleteEmergencyAlert,
  getSettings,
  updateSettings,
  getAuditLogs,
  globalAdminSearch,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply Auth & Admin Check to all Admin routes
router.use(authenticateUser, authorizeAdmin);

// Dashboard & Analytics
router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/search", globalAdminSearch);
router.get("/audit-logs", getAuditLogs);

// Users Management
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/verify", toggleUserVerification);
router.delete("/users/:id", deleteUser);

// Marketplace Products Management
router.get("/products", getSellProducts);
router.patch("/products/:id/status", updateSellProductStatus);
router.delete("/products/:id", deleteSellProduct);
router.post("/products/bulk-delete", bulkDeleteSellProducts);

// Lost & Found Moderation
router.get("/found", getFoundProducts);
router.patch("/found/:id/status", updateFoundProductStatus);
router.delete("/found/:id", deleteFoundProduct);

// Pass & Ticket Management
router.get("/tickets-passes", getTicketsAndPasses);
router.patch("/tickets-passes/:type/:id/status", updateTicketOrPassStatus);
router.delete("/tickets-passes/:type/:id", deleteTicketOrPass);

// Broadcast Management
router.post("/broadcasts", createBroadcast);
router.get("/broadcasts", getBroadcasts);
router.get("/broadcasts/analytics", getBroadcastAnalytics);
router.put("/broadcasts/:id", updateBroadcast);
router.delete("/broadcasts/:id", deleteBroadcast);

// Emergency Alert Management
router.post("/emergency-alerts", createEmergencyAlert);
router.get("/emergency-alerts", getEmergencyAlerts);
router.patch("/emergency-alerts/:id/toggle", toggleEmergencyAlert);
router.delete("/emergency-alerts/:id", deleteEmergencyAlert);

// Chat & Moderation
router.get("/chats", getChatStats);
router.delete("/chats/:id", deleteConversation);

// Report Handling
router.get("/reports", getReports);
router.patch("/reports/:id/status", updateReportStatus);

// Category Management
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Legacy Notifications Broadcast
router.post("/notifications", sendBroadcastNotification);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

export default router;
