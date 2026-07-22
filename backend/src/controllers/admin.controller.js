import User from "../models/user.model.js";
import sellProduct from "../models/SellProduct.js";
import FoundProduct from "../models/foundProductModel.js";
import pass from "../models/expirable_item/passModel.js";
import ticketModel from "../models/expirable_item/ticketModel.js";
import Report from "../models/report.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Category from "../models/category.model.js";
import Settings from "../models/settings.model.js";
import AuditLog from "../models/auditLog.model.js";
import AdminNotification from "../models/adminNotification.model.js";
import Broadcast from "../models/broadcast.model.js";
import EmergencyAlert from "../models/emergencyAlert.model.js";
import ApiError from "../utils/ApiError.js";

// Helper to log admin actions
const createAuditLog = async (adminId, action, targetType, targetId = "", details = "", ipAddress = "") => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      activeUsers,
      totalSellProducts,
      totalFoundProducts,
      totalTickets,
      totalPasses,
      openReports,
      messagesToday,
      recentUsers,
      recentListings,
      recentLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ accountStatus: "active" }),
      sellProduct.countDocuments(),
      FoundProduct.countDocuments(),
      ticketModel.countDocuments(),
      pass.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      Message.countDocuments({ createdAt: { $gte: todayStart } }),
      User.find().sort({ createdAt: -1 }).limit(5).select("_id name email avatar role createdAt accountStatus"),
      sellProduct.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email avatar"),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).populate("admin", "name email avatar"),
    ]);

    // Calculate approximate storage usage (fix: separate awaits to avoid operator precedence bug)
    const sellImageCount = (await sellProduct.aggregate([{ $project: { count: { $size: { $ifNull: ["$images", []] } } } }, { $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
    const foundImageCount = (await FoundProduct.aggregate([{ $project: { count: { $size: { $ifNull: ["$images", []] } } } }, { $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
    const totalImageCount = sellImageCount + foundImageCount;
    
    // Approx 350KB per image asset
    const storageUsageMB = Math.round((totalImageCount * 0.35) * 10) / 10;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          newUsersToday,
          activeUsers,
          totalListings: totalSellProducts,
          totalFoundItems: totalFoundProducts,
          totalTickets,
          totalPasses,
          openReports,
          chatsToday: messagesToday,
          revenue: 0, // Placeholder for future payments
          storageUsageMB,
        },
        recentUsers,
        recentListings,
        recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ANALYTICS ─────────────────────────────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User growth aggregation by date
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Listings growth aggregation by date
    const listingsGrowth = await sellProduct.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          listings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category distribution
    const categoryDistribution = await sellProduct.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Lost vs Found breakdown
    const lostCount = await sellProduct.countDocuments(); // Marketplace
    const foundCount = await FoundProduct.countDocuments(); // Lost & Found

    return res.status(200).json({
      success: true,
      data: {
        userGrowth: userGrowth.map((u) => ({ date: u._id, users: u.users })),
        listingsGrowth: listingsGrowth.map((l) => ({ date: l._id, listings: l.listings })),
        categoryDistribution: categoryDistribution.map((c) => ({ category: c._id || "Uncategorized", count: c.count })),
        lostVsFoundRatio: {
          marketplace: lostCount,
          found: foundCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.accountStatus = status;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password");

    // Enhance users with listings count & messages count
    const enhancedUsers = await Promise.all(
      users.map(async (u) => {
        const uObj = u.toObject();
        const listingsCount = await sellProduct.countDocuments({ user: u._id });
        const messagesCount = await Message.countDocuments({ senderId: u._id });
        return {
          ...uObj,
          listingsCount,
          messagesCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        users: enhancedUsers,
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

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const [listings, foundItems, tickets, passes, reports] = await Promise.all([
      sellProduct.find({ user: user._id }),
      FoundProduct.find({ user: user._id }),
      ticketModel.find({ user: user._id }),
      pass.find({ user: user._id }),
      Report.find({ reportedBy: user._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        listings,
        foundItems,
        tickets,
        passes,
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active' | 'suspended' | 'banned' | 'deleted'
    if (!["active", "suspended", "banned", "deleted"].includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await createAuditLog(
      req.user._id,
      `User Status Updated to ${status}`,
      "User",
      user._id.toString(),
      `Target User: ${user.email}`
    );

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body; // 'user' | 'admin'
    if (!["user", "admin"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await createAuditLog(
      req.user._id,
      `User Role Changed to ${role}`,
      "User",
      user._id.toString(),
      `Target User: ${user.email}`
    );

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.isVerified = !user.isVerified;
    await user.save();

    await createAuditLog(
      req.user._id,
      `User Verification Toggled to ${user.isVerified}`,
      "User",
      user._id.toString(),
      `Target User: ${user.email}`
    );

    return res.status(200).json({
      success: true,
      message: `User verification status updated to ${user.isVerified}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await User.findByIdAndDelete(req.params.id);
    await createAuditLog(
      req.user._id,
      "Permanently Deleted User",
      "User",
      req.params.id,
      `Target User: ${user.email}`
    );

    return res.status(200).json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ─── MARKETPLACE MANAGEMENT ───────────────────────────────────────────────────
export const getSellProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = req.query.search || "";
    const category = req.query.category || "";
    const status = req.query.status || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const total = await sellProduct.countDocuments(query);
    const products = await sellProduct.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email avatar phone");

    return res.status(200).json({
      success: true,
      data: {
        products,
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

export const updateSellProductStatus = async (req, res, next) => {
  try {
    const { status, isFeatured } = req.body;

    // Fetch current product to validate status transitions
    const currentProduct = await sellProduct.findById(req.params.id);
    if (!currentProduct) {
      throw new ApiError(404, "Listing not found");
    }

    // Sold products are completed transactions — status cannot be reverted
    if (currentProduct.status === "sold" && status && status !== "sold") {
      throw new ApiError(400, "Cannot change status of a sold product. Sold transactions are final.");
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isFeatured === "boolean") updateData.isFeatured = isFeatured;

    const product = await sellProduct.findByIdAndUpdate(currentProduct._id, updateData, { new: true });

    // Emit real-time socket update to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("item_status_updated", {
        itemType: "sellProduct",
        itemId: product._id.toString(),
        status: product.status,
        product,
      });
    }

    await createAuditLog(req.user._id, "Updated Product Status", "SellProduct", product._id.toString(), JSON.stringify(updateData));

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSellProduct = async (req, res, next) => {
  try {
    const product = await sellProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    await createAuditLog(req.user._id, "Deleted Sell Product", "SellProduct", req.params.id, product.name);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteSellProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "IDs array required");
    }

    await sellProduct.deleteMany({ _id: { $in: ids } });
    await createAuditLog(req.user._id, "Bulk Deleted Sell Products", "SellProduct", "", `Count: ${ids.length}`);

    return res.status(200).json({
      success: true,
      message: `${ids.length} products deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOST & FOUND MANAGEMENT ─────────────────────────────────────────────────
export const getFoundProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = req.query.search || "";
    const category = req.query.category || "";
    const status = req.query.status || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const total = await FoundProduct.countDocuments(query);
    const products = await FoundProduct.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email avatar phone");

    return res.status(200).json({
      success: true,
      data: {
        products,
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

export const updateFoundProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const product = await FoundProduct.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!product) {
      throw new ApiError(404, "Found item not found");
    }

    // Emit real-time socket update
    const io = req.app.get("io");
    if (io) {
      io.emit("item_status_updated", {
        itemType: "foundProduct",
        itemId: product._id.toString(),
        status: product.status,
        product,
      });
    }

    await createAuditLog(req.user._id, "Updated Found Product Status", "FoundProduct", product._id.toString(), status);

    return res.status(200).json({
      success: true,
      message: "Found product updated",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFoundProduct = async (req, res, next) => {
  try {
    const product = await FoundProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new ApiError(404, "Item not found");
    }

    await createAuditLog(req.user._id, "Deleted Found Product", "FoundProduct", req.params.id, product.name);

    return res.status(200).json({
      success: true,
      message: "Found item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ─── TICKET & PASS MANAGEMENT ────────────────────────────────────────────────
export const getTicketsAndPasses = async (req, res, next) => {
  try {
    const type = req.query.type || "all"; // 'all' | 'ticket' | 'pass'
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);

    let passesList = [];
    let ticketsList = [];

    if (type === "all" || type === "pass") {
      passesList = await pass.find().sort({ createdAt: -1 }).populate("user", "name email avatar");
    }

    if (type === "all" || type === "ticket") {
      ticketsList = await ticketModel.find().sort({ createdAt: -1 }).populate("user", "name email avatar");
    }

    const items = [
      ...passesList.map((p) => ({ ...p.toObject(), itemType: "pass" })),
      ...ticketsList.map((t) => ({ ...t.toObject(), itemType: "ticket" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      data: {
        items: paginatedItems,
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

export const deleteTicketOrPass = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (type === "pass") {
      await pass.findByIdAndDelete(id);
    } else {
      await ticketModel.findByIdAndDelete(id);
    }

    await createAuditLog(req.user._id, `Deleted ${type}`, type === "pass" ? "Pass" : "Ticket", id);

    return res.status(200).json({
      success: true,
      message: `${type} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketOrPassStatus = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body; // 'active' | 'closed'

    let item;
    if (type === "pass") {
      item = await pass.findById(id);
    } else {
      item = await ticketModel.findById(id);
    }

    if (!item) {
      throw new ApiError(404, `${type} not found`);
    }

    // Sold items are final
    if (item.status === "sold" && status && status !== "sold") {
      throw new ApiError(400, "Cannot change status of a sold item. Sold transactions are final.");
    }

    item.status = status;
    await item.save();

    // Emit real-time socket update
    const io = req.app.get("io");
    if (io) {
      io.emit("item_status_updated", {
        itemType: type,
        itemId: item._id.toString(),
        status: item.status,
        product: item,
      });
    }

    await createAuditLog(req.user._id, `Updated ${type} status to ${status}`, type === "pass" ? "Pass" : "Ticket", id);

    return res.status(200).json({
      success: true,
      message: `${type} status updated to ${status}`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CHAT MANAGEMENT ──────────────────────────────────────────────────────────
export const getChatStats = async (req, res, next) => {
  try {
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate("participants", "name email avatar");

    return res.status(200).json({
      success: true,
      data: {
        totalConversations,
        totalMessages,
        conversations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ conversationId: req.params.id });

    await createAuditLog(req.user._id, "Deleted Conversation", "Conversation", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Conversation deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ─── REPORT MANAGEMENT ───────────────────────────────────────────────────────
export const getReports = async (req, res, next) => {
  try {
    const status = req.query.status || "";
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate("reportedBy", "name email avatar")
      .populate("reportedMessageId")
      .populate("reportedUser", "name email avatar");

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        resolvedBy: req.user._id,
      },
      { new: true }
    );

    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    await createAuditLog(req.user._id, `Updated Report status to ${status}`, "Report", report._id.toString(), notes);

    return res.status(200).json({
      success: true,
      message: `Report marked as ${status}`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CATEGORY MANAGEMENT ─────────────────────────────────────────────────────
export const getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

    // Seed default categories if none exist
    if (categories.length === 0) {
      const defaults = [
        { name: "Electronics", slug: "electronics", type: "sell", icon: "Laptop", color: "#3B82F6" },
        { name: "Books & Notes", slug: "books-notes", type: "sell", icon: "BookOpen", color: "#10B981" },
        { name: "Furniture", slug: "furniture", type: "sell", icon: "Armchair", color: "#F59E0B" },
        { name: "Clothing", slug: "clothing", type: "sell", icon: "Shirt", color: "#EC4899" },
        { name: "Lost & Found", slug: "lost-found", type: "found", icon: "Search", color: "#8B5CF6" },
        { name: "Event Tickets", slug: "event-tickets", type: "ticket", icon: "Ticket", color: "#EF4444" },
        { name: "Bus Passes", slug: "bus-passes", type: "pass", icon: "Bus", color: "#06B6D4" },
      ];
      categories = await Category.insertMany(defaults);
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const category = await Category.create({ name, slug, type, icon, color });
    await createAuditLog(req.user._id, "Created Category", "Category", category._id.toString(), name);

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color, isActive } = req.body;
    const update = { name, type, icon, color, isActive };
    if (name) {
      update.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    await createAuditLog(req.user._id, "Updated Category", "Category", category._id.toString(), name);

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await createAuditLog(req.user._id, "Deleted Category", "Category", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ─── NOTIFICATION MANAGEMENT ─────────────────────────────────────────────────
export const sendBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetAudience } = req.body;

    const notification = await AdminNotification.create({
      title,
      message,
      type: type || "announcement",
      targetAudience: targetAudience || "everyone",
      createdBy: req.user._id,
    });

    // Also create Broadcast record for unified system
    const broadcast = await Broadcast.create({
      title,
      message,
      type: type || "announcement",
      priority: type === "alert" ? "urgent" : "medium",
      targetAudience: targetAudience || "everyone",
      createdBy: req.user._id,
    });

    const populatedBroadcast = await Broadcast.findById(broadcast._id).populate("createdBy", "name email avatar");

    // Real-time socket broadcast
    const io = req.app.get("io");
    if (io) {
      io.emit("admin_broadcast", {
        id: notification._id,
        title,
        message,
        type,
        createdAt: notification.createdAt,
      });

      io.emit("broadcast_message", {
        broadcast: populatedBroadcast,
      });
    }

    await createAuditLog(req.user._id, "Sent Broadcast Notification", "AdminNotification", notification._id.toString(), title);

    return res.status(201).json({
      success: true,
      message: "Notification sent successfully to users",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// ─── SETTINGS MANAGEMENT ──────────────────────────────────────────────────────
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    await createAuditLog(req.user._id, "Updated System Settings", "Settings", settings._id.toString());

    return res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "15", 10);

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("admin", "name email avatar");

    return res.status(200).json({
      success: true,
      data: {
        logs,
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

// ─── GLOBAL ADMIN SEARCH ─────────────────────────────────────────────────────
export const globalAdminSearch = async (req, res, next) => {
  try {
    const query = req.query.q || "";
    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        data: { users: [], products: [], foundItems: [], ticketsPasses: [], reports: [] },
      });
    }

    const regex = new RegExp(query, "i");

    const [users, products, foundItems, passesList, ticketsList, reports] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }, { username: regex }] }).limit(5).select("_id name email avatar role"),
      sellProduct.find({ $or: [{ name: regex }, { category: regex }] }).limit(5).select("_id name category sellingPrice images status"),
      FoundProduct.find({ $or: [{ name: regex }, { venue: regex }] }).limit(5).select("_id name category venue images status"),
      pass.find({ name: regex }).limit(5).select("_id name category price status"),
      ticketModel.find({ description: regex }).limit(5).select("_id origin destination price status"),
      Report.find({ reason: regex }).limit(5).populate("reportedBy", "name email"),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        products,
        foundItems,
        ticketsPasses: [...passesList, ...ticketsList],
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── BROADCAST MANAGEMENT ──────────────────────────────────────────────────
export const createBroadcast = async (req, res, next) => {
  try {
    const { title, message, type, priority, targetAudience, selectedUsers, selectedDepartments, expiryDate } = req.body;

    if (!title || !message) {
      throw new ApiError(400, "Title and message content are required");
    }

    const broadcast = await Broadcast.create({
      title,
      message,
      type: type || "announcement",
      priority: priority || "medium",
      targetAudience: targetAudience || "everyone",
      selectedUsers: selectedUsers || [],
      selectedDepartments: selectedDepartments || [],
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      createdBy: req.user._id,
    });

    const populated = await Broadcast.findById(broadcast._id).populate("createdBy", "name email avatar");

    // Real-time Socket Emission
    const io = req.app.get("io");
    if (io) {
      io.emit("broadcast_message", {
        broadcast: populated,
      });
    }

    await createAuditLog(req.user._id, "Created Broadcast Message", "Broadcast", broadcast._id.toString(), title);

    return res.status(201).json({
      success: true,
      message: "Broadcast sent successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getBroadcasts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = req.query.search || "";
    const type = req.query.type || "";
    const priority = req.query.priority || "";

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const total = await Broadcast.countDocuments(query);
    const broadcasts = await Broadcast.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name email avatar");

    return res.status(200).json({
      success: true,
      data: {
        broadcasts,
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

export const updateBroadcast = async (req, res, next) => {
  try {
    const { title, message, type, priority, targetAudience, expiryDate } = req.body;
    const broadcast = await Broadcast.findByIdAndUpdate(
      req.params.id,
      { title, message, type, priority, targetAudience, expiryDate },
      { new: true }
    ).populate("createdBy", "name email avatar");

    if (!broadcast) {
      throw new ApiError(404, "Broadcast not found");
    }

    // Re-emit broadcast updated
    const io = req.app.get("io");
    if (io) {
      io.emit("broadcast_message", { broadcast });
    }

    await createAuditLog(req.user._id, "Updated Broadcast", "Broadcast", broadcast._id.toString(), title);

    return res.status(200).json({
      success: true,
      message: "Broadcast updated successfully",
      data: broadcast,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBroadcast = async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findByIdAndDelete(req.params.id);
    if (!broadcast) {
      throw new ApiError(404, "Broadcast not found");
    }

    await createAuditLog(req.user._id, "Deleted Broadcast", "Broadcast", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Broadcast deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getBroadcastAnalytics = async (req, res, next) => {
  try {
    const [totalBroadcasts, totalUsers, typeStats, audienceStats] = await Promise.all([
      Broadcast.countDocuments(),
      User.countDocuments(),
      Broadcast.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Broadcast.aggregate([{ $group: { _id: "$targetAudience", count: { $sum: 1 } } }]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalBroadcasts,
        totalUsers,
        typeDistribution: typeStats.map((t) => ({ type: t._id, count: t.count })),
        audienceDistribution: audienceStats.map((a) => ({ audience: a._id, count: a.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── EMERGENCY ALERT MANAGEMENT ─────────────────────────────────────────────
export const createEmergencyAlert = async (req, res, next) => {
  try {
    const { title, description, category, severity, activeUntil, requireAcknowledgement } = req.body;

    if (!title || !description || !activeUntil) {
      throw new ApiError(400, "Title, description, and activeUntil date are required");
    }

    const alert = await EmergencyAlert.create({
      title,
      description,
      category: category || "campus",
      severity: severity || "critical",
      activeUntil: new Date(activeUntil),
      requireAcknowledgement: !!requireAcknowledgement,
      isActive: true,
      createdBy: req.user._id,
    });

    const populated = await EmergencyAlert.findById(alert._id).populate("createdBy", "name email avatar");

    // Highest Priority Socket Broadcast to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency_alert", {
        alert: populated,
      });
    }

    await createAuditLog(req.user._id, "Triggered Emergency Alert", "EmergencyAlert", alert._id.toString(), title);

    return res.status(201).json({
      success: true,
      message: "Emergency alert triggered successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyAlerts = async (req, res, next) => {
  try {
    const alerts = await EmergencyAlert.find()
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

export const toggleEmergencyAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      throw new ApiError(404, "Emergency alert not found");
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("emergency_alert_toggled", {
        alertId: alert._id.toString(),
        isActive: alert.isActive,
      });
    }

    await createAuditLog(req.user._id, `Toggled Emergency Alert to ${alert.isActive}`, "EmergencyAlert", alert._id.toString());

    return res.status(200).json({
      success: true,
      message: `Emergency alert ${alert.isActive ? "activated" : "deactivated"}`,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmergencyAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findByIdAndDelete(req.params.id);
    if (!alert) {
      throw new ApiError(404, "Emergency alert not found");
    }

    await createAuditLog(req.user._id, "Deleted Emergency Alert", "EmergencyAlert", req.params.id);

    return res.status(200).json({
      success: true,
      message: "Emergency alert deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

