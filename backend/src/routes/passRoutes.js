import express from 'express';
import {
    addPass,
    getAllPasses,
    updatePass,
    deletePass,
    getPassById
} from '../controllers/pass/passController.js';

import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();
router.post("/", authenticate, upload.single("image"), addPass);
router.get("/", getAllPasses);
router.get("/:id", getPassById);
router.put("/:id", authenticate, upload.single("image"), updatePass);
router.delete("/:id", authenticate, deletePass);

export default router;