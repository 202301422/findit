import express from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
  getMyListings,
  getProfileStats
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

export default router;
