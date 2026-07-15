import express from 'express';
import {
    addPass,
    getAllPasses,
    updatePass,
    deletePass,
    getPassById
} from '../controllers/pass/passController.js';

import { authenticate } from '../middleware/auth.middleware.js';
import { upload, validateImageCount } from '../middleware/multer.middleware.js';
import { UPLOAD_CONFIG } from '../config/uploadConfig.js';

const router = express.Router();

router.post("/",  authenticate, upload.array("images", UPLOAD_CONFIG.MAX_IMAGES), validateImageCount(), addPass);
router.get("/",   getAllPasses);
router.get("/:id", getPassById);
router.put("/:id", authenticate, upload.array("images", UPLOAD_CONFIG.MAX_IMAGES), validateImageCount(), updatePass);
router.delete("/:id", authenticate, deletePass);

export default router;