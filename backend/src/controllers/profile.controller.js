import User from "../models/user.model.js";
import UserNotification from "../models/userNotification.model.js";
import FoundProduct from "../models/foundProductModel.js";
import Pass from "../models/expirable_item/passModel.js";
import SellProduct from "../models/SellProduct.js";
import Ticket from "../models/expirable_item/ticketModel.js";
import bcrypt from "bcryptjs";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary, deleteImages } from "../utils/cloudinary.js";
import { validatePasswordPolicy } from "../utils/validators.js";

/**
 * GET /api/profile
 * Returns the currently authenticated user's full profile.
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -otp -otpExpiry -resetPasswordOtp -resetPasswordOtpExpiry -verificationExpiresAt -accessToken -refreshToken -__v"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.json(new ApiResponse(200, { user }, "Profile fetched successfully"));
});

/**
 * PUT /api/profile
 * Updates the authenticated user's profile fields.
 * Email is explicitly excluded from updates.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, phone, bio, college, city, state, country } = req.body;

  const updateData = {};

  // Name validation
  if (name !== undefined) {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      throw new ApiError(400, "Name must be between 2 and 50 characters");
    }
    updateData.name = trimmedName;
  }

  // Username validation
  if (username !== undefined) {
    if (username === "") {
      // Allow clearing username
      updateData.username = null;
    } else {
      const trimmedUsername = username.trim().toLowerCase();
      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        throw new ApiError(400, "Username must be between 3 and 30 characters");
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        throw new ApiError(400, "Username can only contain letters, numbers, and underscores");
      }

      // Check uniqueness (exclude current user)
      const existingUser = await User.findOne({ username: trimmedUsername, _id: { $ne: req.user._id } });
      if (existingUser) {
        throw new ApiError(409, "Username is already taken");
      }
      updateData.username = trimmedUsername;
    }
  }

  // Phone validation
  if (phone !== undefined) {
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone !== "" && !/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      throw new ApiError(400, "Phone number must be 10-15 digits");
    }
    updateData.phone = cleanPhone;
  }

  // Bio validation
  if (bio !== undefined) {
    if (bio.length > 500) {
      throw new ApiError(400, "Bio cannot exceed 500 characters");
    }
    updateData.bio = bio;
  }

  // Text field validations (college, city, state, country)
  const textFields = { college, city, state, country };
  for (const [field, value] of Object.entries(textFields)) {
    if (value !== undefined) {
      if (value.length > 100) {
        throw new ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} cannot exceed 100 characters`);
      }
      updateData[field] = value.trim();
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { returnDocument: "after", runValidators: true }
  ).select("-password -otp -otpExpiry -resetPasswordOtp -resetPasswordOtpExpiry -verificationExpiresAt -accessToken -refreshToken -__v");

  return res.json(new ApiResponse(200, { user: updatedUser }, "Profile updated successfully"));
});

/**
 * POST /api/profile/avatar
 * Uploads a new avatar image. Replaces existing avatar if present.
 * Uses existing multer middleware for file validation.
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Upload new avatar to Cloudinary
  const uploaded = await uploadOnCloudinary(req.file.buffer, "findit/avatars");
  if (!uploaded) {
    throw new ApiError(500, "Avatar upload failed. Please try again.");
  }

  // Delete old avatar if exists
  const oldAvatarPublicId = user.avatarPublicId;

  try {
    user.avatar = uploaded.secure_url;
    user.avatarPublicId = uploaded.public_id;
    await user.save();

    // Clean up old avatar after successful DB update
    if (oldAvatarPublicId) {
      await deleteFromCloudinary(oldAvatarPublicId);
    }
  } catch (error) {
    // Rollback: delete newly uploaded image if DB save fails
    console.error(`[ROLLBACK] Avatar DB save failed. Deleting uploaded asset '${uploaded.public_id}':`, error.message);
    await deleteFromCloudinary(uploaded.public_id);
    throw error;
  }

  return res.json(
    new ApiResponse(200, { avatar: user.avatar }, "Avatar uploaded successfully")
  );
});

/**
 * DELETE /api/profile/avatar
 * Removes the user's avatar from Cloudinary and clears the DB fields.
 */
export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.avatar && !user.avatarPublicId) {
    throw new ApiError(400, "No avatar to remove");
  }

  const avatarPublicId = user.avatarPublicId;

  // Clear DB fields first for consistent state
  user.avatar = "";
  user.avatarPublicId = "";
  await user.save();

  // Clean up Cloudinary asset
  if (avatarPublicId) {
    await deleteFromCloudinary(avatarPublicId);
  }

  return res.json(new ApiResponse(200, null, "Avatar removed successfully"));
});

/**
 * PATCH /api/profile/change-password
 * Changes the user's password after verifying the current password.
 * Only available for users with authProvider "local".
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All password fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirmation do not match");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.authProvider !== "local") {
    throw new ApiError(400, `Password change is not available for ${user.authProvider} accounts`);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from the current password");
  }

  validatePasswordPolicy(newPassword);

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json(new ApiResponse(200, null, "Password changed successfully"));
});

/**
 * DELETE /api/profile
 * Deletes the authenticated user's account and all associated data.
 * Requires password confirmation for local accounts.
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Require password confirmation for local auth users
  if (user.authProvider === "local") {
    if (!password) {
      throw new ApiError(400, "Password is required to delete account");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Incorrect password");
    }
  }

  // Delete all user's listings across all models
  const userId = user._id;

  // Delete found products and clean up their Cloudinary images (multi-image)
  const foundProducts = await FoundProduct.find({ user: userId });
  const foundImagePublicIds = foundProducts.flatMap(
    (product) => (product.images || []).map((img) => img.publicId)
  );
  if (foundImagePublicIds.length > 0) {
    await deleteImages(foundImagePublicIds);
  }
  await FoundProduct.deleteMany({ user: userId });

  // Delete sell products and clean up their Cloudinary images (multi-image)
  const sellProducts = await SellProduct.find({ user: userId });
  const sellImagePublicIds = sellProducts.flatMap(
    (product) => (product.images || []).map((img) => img.publicId)
  );
  if (sellImagePublicIds.length > 0) {
    await deleteImages(sellImagePublicIds);
  }
  await SellProduct.deleteMany({ user: userId });

  // Delete passes (passes don't use Cloudinary in current implementation)
  await Pass.deleteMany({ user: userId });

  // Delete user's avatar from Cloudinary
  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  // Delete the user document
  await User.findByIdAndDelete(userId);

  return res.json(new ApiResponse(200, null, "Account deleted successfully"));
});

/**
 * GET /api/profile/listings
 * Returns all listings created by the authenticated user, grouped by category.
 * Supports optional ?category query param to filter.
 */
export const getMyListings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { category } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);

  const result = {};

  // Fetch found products (Lost & Found)
  if (!category || category === "lost-found") {
    const foundProducts = await FoundProduct.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    result.lostFound = foundProducts.map((item) => ({
      _id: item._id,
      title: item.name,
      images: item.images || [],
      image: item.images?.[0]?.url || "",
      status: item.status || "active",
      createdAt: item.createdAt,
      category: "Lost & Found",
      type: "found"
    }));
  }

  // Fetch passes (Event Passes)
  if (!category || category === "event-passes") {
    const passes = await Pass.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    result.eventPasses = passes.map((item) => ({
      _id: item._id,
      title: item.name,
      image: item.imageUrl,
      price: item.price,
      status: item.status || "active",
      createdAt: item.createdAt,
      category: "Event Passes",
      type: "pass"
    }));
  }


  // Fetch sell products (Buy & Sell)
  if (!category || category === "buy-sell") {
    const sellProducts = await SellProduct.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    result.buySell = sellProducts.map((item) => ({
      _id: item._id,
      title: item.name,
      images: item.images || [],
      image: item.images?.[0]?.url || "",
      price: item.sellingPrice,
      status: item.status || "active",
      createdAt: item.createdAt,
      category: "Buy & Sell",
      type: "sell"
    }));
  }

  // Fetch travel tickets (Travelling Tickets)
  if (!category || category === "travelling-tickets") {
    const tickets = await Ticket.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    result.travellingTickets = tickets.map((item) => ({
      _id: item._id,
      title: `${item.ticketType} Ticket (${item.origin?.city || ''} → ${item.destination?.city || ''})`,
      ticketType: item.ticketType,
      origin: item.origin,
      destination: item.destination,
      price: item.price,
      quantity: item.quantity,
      status: item.status || "active",
      createdAt: item.createdAt,
      category: "Travelling Tickets",
      type: "ticket"
    }));
  }

  // Aggregate all listings for "all" view
  const allListingsUnsorted = [
    ...(result.buySell || []),
    ...(result.lostFound || []),
    ...(result.eventPasses || []),
    ...(result.travellingTickets || [])
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination to the flat list
  const total = allListingsUnsorted.length;
  const allListings = allListingsUnsorted.slice((page - 1) * limit, page * limit);

  return res.json(
    new ApiResponse(200, {
      listings: result,
      all: allListings,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    }, "Listings fetched successfully")
  );
});

/**
 * GET /api/profile/stats
 * Returns aggregated statistics for the authenticated user's profile.
 */
export const getProfileStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Count found products
  const totalFound = await FoundProduct.countDocuments({ user: userId });
  const activeFound = await FoundProduct.countDocuments({ user: userId, status: "active" });
  const closedFound = await FoundProduct.countDocuments({ user: userId, status: "closed" });

  // Count passes
  const totalPasses = await Pass.countDocuments({ user: userId });
  const activePasses = await Pass.countDocuments({ user: userId, status: "active" });
  const soldPasses = await Pass.countDocuments({ user: userId, status: "sold" });

  // Count sell products
  const totalSell = await SellProduct.countDocuments({ user: userId });
  const activeSell = await SellProduct.countDocuments({ user: userId, status: "active" });
  const soldSell = await SellProduct.countDocuments({ user: userId, status: "sold" });

  // Count tickets
  const totalTickets = await Ticket.countDocuments({ user: userId });
  const activeTickets = await Ticket.countDocuments({ user: userId, status: "active" });
  const soldTickets = await Ticket.countDocuments({ user: userId, status: "sold" });

  const stats = {
    totalListings: totalFound + totalPasses + totalSell + totalTickets,
    activeListings: activeFound + activePasses + activeSell + activeTickets,
    soldItems: soldPasses + soldSell,
    lostItemsReturned: closedFound,
    ticketsSold: soldTickets
  };

  return res.json(new ApiResponse(200, { stats }, "Stats fetched successfully"));
});

/**
 * POST /api/profile/saved
 * Toggles a saved/bookmarked post for the authenticated user.
 * Body: { itemId, itemType }
 * Returns: { saved: boolean }  — true if now saved, false if unsaved
 */
export const toggleSavedPost = asyncHandler(async (req, res) => {
  const { itemId, itemType } = req.body;

  if (!itemId || !itemType) {
    throw new ApiError(400, "itemId and itemType are required");
  }

  const validTypes = ["sell", "found", "ticket", "pass"];
  if (!validTypes.includes(itemType)) {
    throw new ApiError(400, `itemType must be one of: ${validTypes.join(", ")}`);
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const existingIdx = user.savedPosts.findIndex(
    (sp) => sp.itemId.toString() === String(itemId) && sp.itemType === itemType
  );

  let saved;
  if (existingIdx !== -1) {
    // Already saved — unsave it
    user.savedPosts.splice(existingIdx, 1);
    saved = false;
  } else {
    // Not saved — save it
    user.savedPosts.push({ itemId, itemType, savedAt: new Date() });
    saved = true;
  }

  await user.save();
  return res.json(new ApiResponse(200, { saved }, saved ? "Post saved" : "Post unsaved"));
});

/**
 * GET /api/profile/saved
 * Returns the authenticated user's saved/bookmarked posts with pagination.
 * Query: ?page=1&limit=20
 */
export const getSavedPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);

  const user = await User.findById(req.user._id).select("savedPosts");
  if (!user) throw new ApiError(404, "User not found");

  // Sort by most recently saved first
  const sorted = [...(user.savedPosts || [])].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  const total = sorted.length;
  const paginated = sorted.slice((page - 1) * limit, page * limit);

  const items = await Promise.all(
    paginated.map(async (sp) => {
      let itemDoc = null;
      if (sp.itemType === "sell") {
        itemDoc = await SellProduct.findById(sp.itemId).populate("user", "name avatar email phone college").lean();
      } else if (sp.itemType === "found") {
        itemDoc = await FoundProduct.findById(sp.itemId).populate("user", "name avatar email phone college").lean();
      } else if (sp.itemType === "pass") {
        itemDoc = await Pass.findById(sp.itemId).populate("user", "name avatar email phone college").lean();
      } else if (sp.itemType === "ticket") {
        itemDoc = await Ticket.findById(sp.itemId).populate("user", "name avatar email phone college").lean();
      }

      if (!itemDoc) return null;

      let tabLabel = "Buy & Sell";
      if (sp.itemType === "found") tabLabel = "Lost & Found";
      if (sp.itemType === "pass") tabLabel = "Event Passes";
      if (sp.itemType === "ticket") tabLabel = "Travelling Tickets";

      const itemTitle = itemDoc.name || (itemDoc.origin?.city && itemDoc.destination?.city ? `${itemDoc.origin.city} → ${itemDoc.destination.city}` : `${itemDoc.ticketType || 'Listing'} Ticket`);
      const itemPrice = itemDoc.sellingPrice ?? itemDoc.price;
      const primaryImage = itemDoc.images?.[0]?.url || itemDoc.imageUrl || "";

      return {
        ...itemDoc,
        _id: itemDoc._id,
        title: itemTitle,
        name: itemTitle,
        image: primaryImage,
        images: itemDoc.images || (primaryImage ? [{ url: primaryImage, publicId: 'primary' }] : []),
        price: itemPrice,
        sellingPrice: itemPrice,
        status: itemDoc.status || "active",
        type: sp.itemType,
        category: tabLabel,
        tabLabel,
        savedAt: sp.savedAt,
      };
    })
  );

  const validItems = items.filter(Boolean);

  return res.json(new ApiResponse(200, {
    savedPosts: validItems,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
  }, "Saved posts fetched successfully"));
});

/**
 * GET /api/profile/search-users
 * Searches active users by username (@username), full name, or email/student ID (e.g. 202301422).
 * Query: ?q=searchterm
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const query = (req.query.q || "").trim();

  if (!query || query.length < 1) {
    return res.json(new ApiResponse(200, { users: [] }, "Search query too short"));
  }

  // Strip leading '@' if user types '@jay_balar'
  const cleanQuery = query.startsWith("@") ? query.slice(1) : query;
  const regex = new RegExp(cleanQuery, "i");

  const users = await User.find({
    accountStatus: "active",
    _id: { $ne: req.user._id },
    $or: [
      { username: regex },
      { name: regex },
      { email: regex },
    ],
  })
    .select("_id name username email avatar college bio followers following createdAt")
    .limit(10)
    .lean();

  return res.json(new ApiResponse(200, { users }, "Users fetched successfully"));
});

/**
 * GET /api/profile/user/:userId
 * Returns public profile data and active listings for the specified user.
 */
export const getPublicUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId).select(
    "_id name username avatar bio college city state country createdAt authProvider accountStatus following followers"
  );

  if (!targetUser || targetUser.accountStatus === "deleted" || targetUser.accountStatus === "banned") {
    throw new ApiError(404, "User not found");
  }

  // Fetch target user's active listings
  const [foundProducts, passes, sellProducts, tickets] = await Promise.all([
    FoundProduct.find({ user: userId, status: "active" }).sort({ createdAt: -1 }).lean(),
    Pass.find({ user: userId, status: "active" }).sort({ createdAt: -1 }).lean(),
    SellProduct.find({ user: userId, status: "active" }).sort({ createdAt: -1 }).lean(),
    Ticket.find({ user: userId, status: "active" }).sort({ createdAt: -1 }).lean(),
  ]);

  const mappedFound = foundProducts.map((item) => ({
    ...item,
    title: item.name,
    image: item.images?.[0]?.url || "",
    category: "Lost & Found",
    type: "found",
  }));

  const mappedPasses = passes.map((item) => ({
    ...item,
    title: item.name,
    image: item.imageUrl,
    category: "Event Passes",
    type: "pass",
  }));

  const mappedSell = sellProducts.map((item) => ({
    ...item,
    title: item.name,
    image: item.images?.[0]?.url || "",
    price: item.sellingPrice,
    category: "Buy & Sell",
    type: "sell",
  }));

  const mappedTickets = tickets.map((item) => ({
    ...item,
    title: `${item.ticketType} Ticket (${item.origin?.city || ''} → ${item.destination?.city || ''})`,
    category: "Travelling Tickets",
    type: "ticket",
  }));

  const allListings = [...mappedSell, ...mappedFound, ...mappedPasses, ...mappedTickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const targetUserObj = targetUser.toObject ? targetUser.toObject() : targetUser;

  return res.json(
    new ApiResponse(
      200,
      {
        user: {
          ...targetUserObj,
          followersCount: (targetUser.followers || []).length,
          followingCount: (targetUser.following || []).length,
        },
        listings: allListings,
        stats: {
          totalActiveListings: allListings.length,
          sellCount: mappedSell.length,
          foundCount: mappedFound.length,
          passCount: mappedPasses.length,
          ticketCount: mappedTickets.length,
          followersCount: (targetUser.followers || []).length,
          followingCount: (targetUser.following || []).length,
        },
      },
      "Public profile fetched successfully"
    )
  );
});

/**
 * POST /api/profile/follow/:targetUserId
 * Toggles follow / unfollow for a target user.
 * Body: { notifyOnPost?: boolean }
 */
export const toggleFollowUser = asyncHandler(async (req, res) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user._id.toString();

  if (currentUserId === targetUserId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId),
  ]);

  if (!targetUser || targetUser.accountStatus !== "active") {
    throw new ApiError(404, "User not found");
  }

  const existingFollowingIdx = (currentUser.following || []).findIndex(
    (f) => f.user.toString() === targetUserId
  );

  let isFollowing;
  let notifyOnPost = req.body.notifyOnPost !== false;

  if (existingFollowingIdx !== -1) {
    // Unfollow
    currentUser.following.splice(existingFollowingIdx, 1);
    const followerIdx = (targetUser.followers || []).findIndex(
      (f) => f.user.toString() === currentUserId
    );
    if (followerIdx !== -1) {
      targetUser.followers.splice(followerIdx, 1);
    }
    isFollowing = false;
  } else {
    // Follow
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    currentUser.following.push({ user: targetUserId, notifyOnPost });
    targetUser.followers.push({ user: currentUserId, notifyOnPost });
    isFollowing = true;

    // Drop notification for targetUser
    try {
      await UserNotification.create({
        recipient: targetUserId,
        title: "New Follower! 👋",
        message: `${currentUser.name} (@${currentUser.username || 'user'}) started following you.`,
        type: "system",
        relatedEntityId: currentUserId,
        relatedEntityType: "User",
      });

      const io = req.app?.get?.("io");
      if (io) {
        io.to(targetUserId).emit("new_user_notification", {
          title: "New Follower! 👋",
          message: `${currentUser.name} started following you.`,
        });
      }
    } catch (nErr) {
      console.error("Failed to notify follow:", nErr);
    }
  }

  await Promise.all([currentUser.save(), targetUser.save()]);

  return res.json(
    new ApiResponse(
      200,
      {
        isFollowing,
        notifyOnPost: isFollowing ? notifyOnPost : false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      },
      isFollowing ? "User followed successfully" : "User unfollowed successfully"
    )
  );
});

/**
 * PATCH /api/profile/follow-notifications/:targetUserId
 * Toggles notifyOnPost setting for a followed user.
 * Body: { notifyOnPost: boolean }
 */
export const toggleFollowNotifications = asyncHandler(async (req, res) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user._id.toString();
  const notifyOnPost = Boolean(req.body.notifyOnPost);

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId),
  ]);

  if (!currentUser || !targetUser) throw new ApiError(404, "User not found");

  const followingItem = (currentUser.following || []).find(
    (f) => f.user.toString() === targetUserId
  );
  if (!followingItem) {
    throw new ApiError(400, "You are not following this user");
  }

  followingItem.notifyOnPost = notifyOnPost;

  const followerItem = (targetUser.followers || []).find(
    (f) => f.user.toString() === currentUserId
  );
  if (followerItem) {
    followerItem.notifyOnPost = notifyOnPost;
  }

  await Promise.all([currentUser.save(), targetUser.save()]);

  return res.json(
    new ApiResponse(
      200,
      { notifyOnPost },
      `Notifications ${notifyOnPost ? "enabled" : "disabled"} for ${targetUser.name}`
    )
  );
});

/**
 * GET /api/profile/followers/:userId
 */
export const getUserFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId)
    .populate("followers.user", "_id name username avatar college bio")
    .lean();

  if (!user) throw new ApiError(404, "User not found");

  const followers = (user.followers || [])
    .filter((f) => f.user)
    .map((f) => ({
      ...f.user,
      notifyOnPost: f.notifyOnPost,
      followedAt: f.followedAt,
    }));

  return res.json(new ApiResponse(200, { followers }, "Followers fetched"));
});

/**
 * GET /api/profile/following/:userId
 */
export const getUserFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId)
    .populate("following.user", "_id name username avatar college bio")
    .lean();

  if (!user) throw new ApiError(404, "User not found");

  const following = (user.following || [])
    .filter((f) => f.user)
    .map((f) => ({
      ...f.user,
      notifyOnPost: f.notifyOnPost,
      followedAt: f.followedAt,
    }));

  return res.json(new ApiResponse(200, { following }, "Following fetched"));
});

/**
 * GET /api/profile/feed/following
 * Returns active listings uploaded by users that current user follows.
 */
export const getFollowingFeed = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).lean();
  const followedUserIds = (currentUser.following || []).map((f) => f.user);

  if (!followedUserIds || followedUserIds.length === 0) {
    return res.json(new ApiResponse(200, { listings: [], page: 1, limit: 12, total: 0, hasNextPage: false }, "No followed users"));
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);

  const [foundProducts, passes, sellProducts, tickets] = await Promise.all([
    FoundProduct.find({ user: { $in: followedUserIds }, status: "active" })
      .populate("user", "name username avatar email college")
      .sort({ createdAt: -1 })
      .lean(),
    Pass.find({ user: { $in: followedUserIds }, status: "active" })
      .populate("user", "name username avatar email college")
      .sort({ createdAt: -1 })
      .lean(),
    SellProduct.find({ user: { $in: followedUserIds }, status: "active" })
      .populate("user", "name username avatar email college")
      .sort({ createdAt: -1 })
      .lean(),
    Ticket.find({ user: { $in: followedUserIds }, status: "active" })
      .populate("user", "name username avatar email college")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const mappedFound = foundProducts.map((item) => ({
    ...item,
    title: item.name,
    image: item.images?.[0]?.url || "",
    category: "Lost & Found",
    type: "found",
  }));

  const mappedPasses = passes.map((item) => ({
    ...item,
    title: item.name,
    image: item.imageUrl,
    category: "Event Passes",
    type: "pass",
  }));

  const mappedSell = sellProducts.map((item) => ({
    ...item,
    title: item.name,
    image: item.images?.[0]?.url || "",
    price: item.sellingPrice,
    category: "Buy & Sell",
    type: "sell",
  }));

  const mappedTickets = tickets.map((item) => ({
    ...item,
    title: `${item.ticketType} Ticket (${item.origin?.city || ''} → ${item.destination?.city || ''})`,
    category: "Travelling Tickets",
    type: "ticket",
  }));

  const allListings = [...mappedSell, ...mappedFound, ...mappedPasses, ...mappedTickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const total = allListings.length;
  const paginated = allListings.slice((page - 1) * limit, page * limit);

  return res.json(
    new ApiResponse(
      200,
      {
        listings: paginated,
        page,
        limit,
        total,
        hasNextPage: page * limit < total,
      },
      "Following feed fetched successfully"
    )
  );
});

/**
 * DELETE /api/profile/followers/:followerUserId
 * Removes a follower from the current user's followers list.
 */
export const removeFollower = asyncHandler(async (req, res) => {
  const { followerUserId } = req.params;
  const currentUserId = req.user._id.toString();

  const [currentUser, followerUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(followerUserId),
  ]);

  if (!currentUser || !followerUser) {
    throw new ApiError(404, "User not found");
  }

  // Remove followerUserId from currentUser.followers
  currentUser.followers = (currentUser.followers || []).filter(
    (f) => f.user.toString() !== followerUserId
  );

  // Remove currentUserId from followerUser.following
  followerUser.following = (followerUser.following || []).filter(
    (f) => f.user.toString() !== currentUserId
  );

  await Promise.all([currentUser.save(), followerUser.save()]);

  return res.json(
    new ApiResponse(
      200,
      {
        followersCount: currentUser.followers.length,
      },
      "Follower removed successfully"
    )
  );
});





