import Broadcast from "../models/broadcast.model.js";
import EmergencyAlert from "../models/emergencyAlert.model.js";
import UserNotification from "../models/userNotification.model.js";
import ApiError from "../utils/ApiError.js";

// Fetch active emergency alerts for user on app open
export const getActiveEmergencyAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const alerts = await EmergencyAlert.find({
      isActive: true,
      activeUntil: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email avatar");

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// User acknowledges an emergency alert ("I Understand")
export const acknowledgeEmergencyAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      throw new ApiError(404, "Emergency alert not found");
    }

    if (!alert.acknowledgedBy.includes(req.user._id)) {
      alert.acknowledgedBy.push(req.user._id);
      await alert.save();
    }

    return res.status(200).json({
      success: true,
      message: "Emergency alert acknowledged",
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// Aggregated Unified User Notifications Center
export const getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "15", 10);
    const filter = req.query.filter || "all"; // 'all' | 'broadcast' | 'emergency' | 'system'
    const search = req.query.search || "";

    const userId = req.user._id;
    const now = new Date();

    let broadcasts = [];
    let emergencyAlerts = [];
    let systemNotifications = [];

    // 1. Fetch active broadcasts targeted to user
    if (filter === "all" || filter === "broadcast") {
      const broadcastQuery = {
        deletedFor: { $ne: userId },
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gt: now } },
        ],
      };

      if (search) {
        broadcastQuery.$and = [
          {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { message: { $regex: search, $options: "i" } },
            ],
          },
        ];
      }

      const allBroadcasts = await Broadcast.find(broadcastQuery)
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email avatar");

      broadcasts = allBroadcasts.map((b) => {
        const bObj = b.toObject();
        return {
          _id: `broadcast_${b._id}`,
          originalId: b._id,
          title: b.title,
          message: b.message,
          type: "broadcast",
          broadcastType: b.type,
          priority: b.priority,
          isRead: b.readBy?.some((id) => id.toString() === userId.toString()),
          createdAt: b.createdAt,
          createdBy: b.createdBy,
          expiryDate: b.expiryDate,
        };
      });
    }

    // 2. Fetch active emergency alerts
    if (filter === "all" || filter === "emergency") {
      const alertQuery = {
        isActive: true,
        activeUntil: { $gt: now },
      };

      if (search) {
        alertQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const allAlerts = await EmergencyAlert.find(alertQuery)
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email avatar");

      emergencyAlerts = allAlerts.map((a) => {
        const isAck = a.acknowledgedBy?.some((id) => id.toString() === userId.toString());
        return {
          _id: `emergency_${a._id}`,
          originalId: a._id,
          title: a.title,
          message: a.description,
          type: "emergency",
          severity: a.severity,
          category: a.category,
          requireAcknowledgement: a.requireAcknowledgement,
          isRead: isAck,
          createdAt: a.createdAt,
          createdBy: a.createdBy,
          activeUntil: a.activeUntil,
        };
      });
    }

    // 3. Fetch direct UserNotifications
    if (filter === "all" || filter === "system" || filter === "listing_update") {
      const sysQuery = { recipient: userId };
      if (search) {
        sysQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
        ];
      }
      if (filter === "listing_update") {
        sysQuery.type = "listing_update";
      }

      const allSys = await UserNotification.find(sysQuery).sort({ createdAt: -1 });
      systemNotifications = allSys.map((s) => ({
        _id: s._id.toString(),
        originalId: s._id,
        title: s.title,
        message: s.message,
        type: s.type,
        isRead: s.isRead,
        createdAt: s.createdAt,
        relatedEntityId: s.relatedEntityId,
        relatedEntityType: s.relatedEntityType,
      }));
    }

    // Combine & Sort by Date Descending
    const combined = [...emergencyAlerts, ...broadcasts, ...systemNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = combined.length;
    const paginated = combined.slice((page - 1) * limit, page * limit);

    const unreadCount = combined.filter((n) => !n.isRead).length;

    return res.status(200).json({
      success: true,
      data: {
        notifications: paginated,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (id.startsWith("broadcast_")) {
      const bId = id.replace("broadcast_", "");
      await Broadcast.findByIdAndUpdate(bId, { $addToSet: { readBy: userId } });
    } else if (id.startsWith("emergency_")) {
      const eId = id.replace("emergency_", "");
      await EmergencyAlert.findByIdAndUpdate(eId, { $addToSet: { acknowledgedBy: userId } });
    } else {
      await UserNotification.findByIdAndUpdate(id, { isRead: true });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications read for user
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      Broadcast.updateMany({ readBy: { $ne: userId } }, { $addToSet: { readBy: userId } }),
      UserNotification.updateMany({ recipient: userId, isRead: false }, { isRead: true }),
    ]);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification for user
export const deleteUserNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (id.startsWith("broadcast_")) {
      const bId = id.replace("broadcast_", "");
      await Broadcast.findByIdAndUpdate(bId, { $addToSet: { deletedFor: userId } });
    } else if (!id.startsWith("emergency_")) {
      await UserNotification.findOneAndDelete({ _id: id, recipient: userId });
    }

    return res.status(200).json({
      success: true,
      message: "Notification removed",
    });
  } catch (error) {
    next(error);
  }
};
