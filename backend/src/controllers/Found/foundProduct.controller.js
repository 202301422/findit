import FoundProduct from "../../models/foundProductModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

/**
 * Creates a new found product.
 * Handles validation first, uploads image to Cloudinary via buffer stream, and rolls back the upload if DB creation fails.
 */
export const createFoundProduct = asyncHandler(async (req, res) => {
    const { name, category, description, venue, dateTime } = req.body;

    // 1. Strict validation prior to external upload to prevent security and resource leaks
    if (!name || !category || !venue || !dateTime) {
        throw new ApiError(400, "All required fields (name, category, venue, dateTime) must be provided");
    }

    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }

    // 2. Stream upload file from memory buffer to Cloudinary
    const uploaded = await uploadOnCloudinary(req.file.buffer);
    if (!uploaded) {
        throw new ApiError(500, "Image upload failed. Please try again.");
    }

    try {
        // 3. Persist product metadata to MongoDB
        const product = await FoundProduct.create({
            name,
            category,
            description,
            venue,
            dateTime,
            imageUrl: uploaded.secure_url,    // Always save HTTPS secure URL
            imagePublicId: uploaded.public_id, // Store explicit identifier for efficient CDN operations
            user: req.user._id
        });

        return res
            .status(201)
            .json(new ApiResponse(201, product, "Product created successfully"));
    } catch (error) {
        // 4. Transaction Rollback: Clean up uploaded asset if DB creation fails to prevent orphaned file leak
        console.error(`[ROLLBACK] DB creation failed. Deleting uploaded asset '${uploaded.public_id}':`, error.message);
        await deleteFromCloudinary(uploaded.public_id);
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
        .populate("user", "name email");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * Updates a found product.
 * Authorizes user first, handles upload of new image, commits changes to DB, cleans up old image, and handles upload rollback on DB errors.
 */
export const updateFoundProduct = asyncHandler(async (req, res) => {
    // 1. Verify existence and authorization before doing any external CDN operations
    let product = await FoundProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this product");
    }

    const originalImagePublicId = product.imagePublicId;
    const originalImageUrl = product.imageUrl;
    let newUploaded = null;

    // 2. Upload new image if provided
    if (req.file) {
        newUploaded = await uploadOnCloudinary(req.file.buffer);
        if (!newUploaded) {
            throw new ApiError(500, "New image upload failed");
        }
        req.body.imageUrl = newUploaded.secure_url;
        req.body.imagePublicId = newUploaded.public_id;
    }

    try {
        // 3. Commit update to MongoDB
        const updatedProduct = await FoundProduct.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // 4. Delete old asset ONLY after DB update successfully commits
        if (newUploaded && (originalImagePublicId || originalImageUrl)) {
            await deleteFromCloudinary(originalImagePublicId || originalImageUrl);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
    } catch (error) {
        // 5. Transaction Rollback: Clean up newly uploaded image if update fails to prevent orphans
        if (newUploaded) {
            console.error(`[ROLLBACK] DB update failed. Deleting newly uploaded asset '${newUploaded.public_id}':`, error.message);
            await deleteFromCloudinary(newUploaded.public_id);
        }
        throw error;
    }
});

/**
 * Deletes a found product.
 * Authorizes user, deletes DB document, and cleans up Cloudinary assets afterward.
 */
export const deleteFoundProduct = asyncHandler(async (req, res) => {
    // 1. Validate existence and authorization
    const product = await FoundProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this product");
    }

    const imagePublicId = product.imagePublicId;
    const imageUrl = product.imageUrl;

    // 2. Delete database entry first to guarantee consistent database state
    await product.deleteOne();

    // 3. Clean up Cloudinary asset after successful DB record deletion
    if (imagePublicId || imageUrl) {
        // deleteFromCloudinary handles publicId or parsing fallback URLs safely
        await deleteFromCloudinary(imagePublicId || imageUrl);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Product deleted successfully"));
});