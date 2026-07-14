import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload, validateImageCount } from "../middleware/multer.middleware.js";
import { UPLOAD_CONFIG } from "../config/uploadConfig.js";
import {
    createSellProduct,
    getAllSellProducts,
    getSingleSellProduct,
    updateSellProduct,
    deleteSellProduct,
    getSellProductDetail
} from "../controllers/sell/sellProduct.controller.js";

const router = express.Router();

router
    .route("/")
    .post(
        authenticate,
        upload.array("images", UPLOAD_CONFIG.MAX_IMAGES),
        validateImageCount(),
        createSellProduct
    )
    .get(getAllSellProducts);

router
    .route("/:id")
    .get(getSingleSellProduct)
    .put(
        authenticate,
        upload.array("images", UPLOAD_CONFIG.MAX_IMAGES),
        validateImageCount(),
        updateSellProduct
    )
    .delete(authenticate, deleteSellProduct);

router.get("/products", authenticate, getAllSellProducts);

router.get("/product/detail/:sellProductId", authenticate, getSellProductDetail);

export default router;
