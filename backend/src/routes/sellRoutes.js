import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { createSellProduct } from "../controllers/sell/sellProduct.controller.js";

const router = express.Router();

router.post("/", authenticate, upload.single("image"), createSellProduct);

export default router;
