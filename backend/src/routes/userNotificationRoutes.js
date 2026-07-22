import express from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  getActiveEmergencyAlerts,
  acknowledgeEmergencyAlert,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
} from "../controllers/userNotification.controller.js";

const router = express.Router();

// Apply Auth check to user notification routes
router.use(authenticateUser);

router.get("/", getUserNotifications);
router.get("/emergency-alerts/active", getActiveEmergencyAlerts);
router.post("/emergency-alerts/:id/acknowledge", acknowledgeEmergencyAlert);
router.patch("/mark-all-read", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteUserNotification);

export default router;
