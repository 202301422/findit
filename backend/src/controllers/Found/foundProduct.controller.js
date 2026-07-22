import FoundProduct from "../../models/foundProductModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadImages, deleteImages } from "../../utils/cloudinary.js";
import { UPLOAD_CONFIG } from "../../config/uploadConfig.js";

function parseBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return false;
}

function parseStringArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
        } catch (error) {
            return value.split(",").map((item) => item.trim()).filter(Boolean);
        }
    }

    return [];
}

/**
 * Creates a new found product with multiple images.
 * Accepts images via `upload.array("images")`.
 */
export const createFoundProduct = asyncHandler(async (req, res) => {
    const { name, category, description, venue, dateTime } = req.body;

    if (!name || !category || !venue || !dateTime) {
        throw new ApiError(400, "All required fields (name, category, venue, dateTime) must be provided");
    }

    const files = Array.isArray(req.files) ? req.files : [];
    console.log("[FOUND CREATE] req.files:", files);

    if (files.length === 0) {
        throw new ApiError(400, "At least one image file is required in the images field");
    }

    const uploadedImages = await uploadImages(files, "findit/found-products");
    console.log("[FOUND CREATE] uploadedImages:", uploadedImages);

    try {
        const product = await FoundProduct.create({
            name,
            category,
            description,
            venue,
            dateTime,
            images: uploadedImages,
            user: req.user._id
        });
        console.log("[FOUND CREATE] product.images:", product.images);

        return res
            .status(201)
            .json(new ApiResponse(201, product, "Product created successfully"));
    } catch (error) {
        console.error(`[ROLLBACK] Found product creation failed. Deleting ${uploadedImages.length} uploaded assets:`, error.message);
        await deleteImages(uploadedImages.map((img) => img.publicId));
        throw error;
    }
});

/**
 * Fetches all found products, sorted by newest first.
 */
export const getAllFoundProducts = asyncHandler(async (req, res) => {
    const products = await FoundProduct.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, products, "All products fetched successfully"));
});

/**
 * Fetches a single found product by ID.
 */
export const getSingleFoundProduct = asyncHandler(async (req, res) => {
    const product = await FoundProduct.findById(req.params.id)
        .populate("user", "name email avatar createdAt");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * Updates a found product. Supports keeping, removing, adding, or replacing images.
 * Optional form fields:
 * - removeImagePublicIds: JSON array or comma-separated public IDs to remove.
 * - keepImagePublicIds: JSON array or comma-separated public IDs to keep.
 * - replaceImages: "true" to replace the current image set with newly uploaded files.
 */
export const updateFoundProduct = asyncHandler(async (req, res) => {
    const product = await FoundProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this product");
    }

    const oldImages = [...(product.images || [])];
    const files = Array.isArray(req.files) ? req.files : [];
    const removeImagePublicIds = parseStringArray(req.body.removeImagePublicIds);
    const keepImagePublicIds = parseStringArray(req.body.keepImagePublicIds);
    const replaceImages = parseBoolean(req.body.replaceImages);
    let newUploadedImages = [];

    console.log("[FOUND UPDATE] req.files:", files);

    if (files.length > 0) {
        newUploadedImages = await uploadImages(files, "findit/found-products");
        console.log("[FOUND UPDATE] uploadedImages:", newUploadedImages);
    }

    try {
        const updateData = { ...req.body };

        delete updateData.images;
        delete updateData.imageUrl;
        delete updateData.imagePublicId;
        delete updateData.removeImagePublicIds;
        delete updateData.keepImagePublicIds;
        delete updateData.replaceImages;

        let nextImages = oldImages;

        if (replaceImages) {
            nextImages = newUploadedImages;
        } else if (keepImagePublicIds.length > 0) {
            const keepSet = new Set(keepImagePublicIds);
            nextImages = oldImages.filter((img) => keepSet.has(img.publicId)).concat(newUploadedImages);
        } else if (removeImagePublicIds.length > 0 || newUploadedImages.length > 0) {
            const removeSet = new Set(removeImagePublicIds);
            nextImages = oldImages.filter((img) => !removeSet.has(img.publicId)).concat(newUploadedImages);
        }

        if (nextImages.length === 0) {
            throw new ApiError(400, "At least one image is required");
        }

        if (nextImages.length > UPLOAD_CONFIG.MAX_IMAGES) {
            throw new ApiError(400, `Cannot upload more than ${UPLOAD_CONFIG.MAX_IMAGES} images`);
        }

        updateData.images = nextImages;

        const updatedProduct = await FoundProduct.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: "after", runValidators: true }
        ).populate("user", "name avatar email rating profilePicture");
        console.log("[FOUND UPDATE] product.images:", updatedProduct.images);

        const nextPublicIds = new Set(nextImages.map((img) => img.publicId));
        const removedPublicIds = oldImages
            .filter((img) => !nextPublicIds.has(img.publicId))
            .map((img) => img.publicId);

        if (removedPublicIds.length > 0) {
            await deleteImages(removedPublicIds);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
    } catch (error) {
        if (newUploadedImages.length > 0) {
            console.error(`[ROLLBACK] Found product update failed. Deleting ${newUploadedImages.length} newly uploaded assets:`, error.message);
            await deleteImages(newUploadedImages.map((img) => img.publicId));
        }
        throw error;
    }
});

/**
 * Deletes a found product and all Cloudinary images.
 */
export const deleteFoundProduct = asyncHandler(async (req, res) => {
    const product = await FoundProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this product");
    }

    const imagePublicIds = (product.images || []).map((img) => img.publicId);

    await product.deleteOne();

    if (imagePublicIds.length > 0) {
        await deleteImages(imagePublicIds);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Product deleted successfully"));
});
