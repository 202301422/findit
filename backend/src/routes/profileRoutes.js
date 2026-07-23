import express from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
  getMyListings,
  getProfileStats,
  getSavedPosts,
  toggleSavedPost,
  searchUsers,
  getPublicUserProfile,
  toggleFollowUser,
  toggleFollowNotifications,
  getUserFollowers,
  getUserFollowing,
  getFollowingFeed,
  removeFollower
} from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

router.get("/", getProfile);
router.put("/", updateProfile);
router.delete("/", deleteAccount);

router.post("/avatar", upload.single("avatar"), uploadAvatar);
router.delete("/avatar", deleteAvatar);

router.patch("/change-password", changePassword);

router.get("/listings", getMyListings);
router.get("/stats", getProfileStats);

router.get("/saved", getSavedPosts);
router.post("/saved", toggleSavedPost);

router.get("/search-users", searchUsers);
router.get("/user/:userId", getPublicUserProfile);

router.post("/follow/:targetUserId", toggleFollowUser);
router.patch("/follow-notifications/:targetUserId", toggleFollowNotifications);
router.get("/followers/:userId", getUserFollowers);
router.delete("/followers/:followerUserId", removeFollower);
router.get("/following/:userId", getUserFollowing);
router.get("/feed/following", getFollowingFeed);

export default router;
