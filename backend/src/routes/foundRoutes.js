import express from "express";
import {
    createFoundProduct,
    getAllFoundProducts,
    getSingleFoundProduct,
    updateFoundProduct,
    deleteFoundProduct
} from "../controllers/Found/foundProduct.controller.js";

import { authenticate  } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router
    .route("/")
    .post(authenticate , upload.single("image"), createFoundProduct)
    .get(getAllFoundProducts);

router
    .route("/:id")
    .get(getSingleFoundProduct)
    .put(authenticate , upload.single("image"), updateFoundProduct)
    .delete(authenticate , deleteFoundProduct);

export default router;