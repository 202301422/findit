import User from "../models/user.model.js";
import FoundProduct from "../models/foundProductModel.js";
import Pass from "../models/expirable_item/passModel.js";
import bcrypt from "bcryptjs";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
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
    { new: true, runValidators: true }
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

  // Delete found products and clean up their Cloudinary images
  const foundProducts = await FoundProduct.find({ user: userId });
  for (const product of foundProducts) {
    if (product.imagePublicId) {
      await deleteFromCloudinary(product.imagePublicId);
    }
  }
  await FoundProduct.deleteMany({ user: userId });

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

  const result = {};

  // Fetch found products (Lost & Found)
  if (!category || category === "lost-found") {
    const foundProducts = await FoundProduct.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    result.lostFound = foundProducts.map((item) => ({
      _id: item._id,
      title: item.name,
      image: item.imageUrl,
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

  // Aggregate all listings for "all" view
  const allListings = [
    ...(result.lostFound || []),
    ...(result.eventPasses || [])
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json(
    new ApiResponse(200, { listings: result, all: allListings }, "Listings fetched successfully")
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

  const stats = {
    totalListings: totalFound + totalPasses,
    activeListings: activeFound + activePasses,
    soldItems: soldPasses,
    lostItemsReturned: closedFound,
    ticketsSold: 0 // Ticket model doesn't have user reference yet
  };

  return res.json(new ApiResponse(200, { stats }, "Stats fetched successfully"));
});
