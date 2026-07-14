import express from "express";
import {
    createFoundProduct,
    getAllFoundProducts,
    getSingleFoundProduct,
    updateFoundProduct,
    deleteFoundProduct
} from "../controllers/Found/foundProduct.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { upload, validateImageCount } from "../middleware/multer.middleware.js";
import { UPLOAD_CONFIG } from "../config/uploadConfig.js";

const router = express.Router();

router
    .route("/")
    .post(
        authenticate,
        upload.array("images", UPLOAD_CONFIG.MAX_IMAGES),
        validateImageCount(),
        createFoundProduct
    )
    .get(getAllFoundProducts);

router
    .route("/:id")
    .get(getSingleFoundProduct)
    .put(
        authenticate,
        upload.array("images", UPLOAD_CONFIG.MAX_IMAGES),
        validateImageCount(),
        updateFoundProduct
    )
    .delete(authenticate, deleteFoundProduct);

export default router;
