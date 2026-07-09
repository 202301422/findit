import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { createSellProduct,getAllSellProducts,getSellProductDetail} from "../controllers/sell/sellProduct.controller.js";

const router = express.Router();

router.post("/", authenticate, upload.single("image"), createSellProduct);

router.get("/products", authenticate, getAllSellProducts);

router.get("/product/detail", authenticate, getSellProductDetail);

export default router;
