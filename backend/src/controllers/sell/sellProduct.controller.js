import sellProduct from "../../models/SellProduct.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadImages, deleteImages } from "../../utils/cloudinary.js";
import { notifyFollowersOnNewPost } from "../../utils/followerNotifier.js";

function parseUsageTime(value) {
    if (!value) return { years: 0, months: 0, days: 0 };

    if (typeof value === "object") {
        return {
            years: Number.parseInt(value.years, 10) || 0,
            months: Number.parseInt(value.months, 10) || 0,
            days: Number.parseInt(value.days, 10) || 0,
        };
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return {
                years: Number.parseInt(parsed.years, 10) || 0,
                months: Number.parseInt(parsed.months, 10) || 0,
                days: Number.parseInt(parsed.days, 10) || 0,
            };
        } catch (error) {
            return { years: 0, months: 0, days: 0 };
        }
    }

    return { years: 0, months: 0, days: 0 };
}

/**
 * Converts an empty string (or whitespace-only string) to undefined.
 * This prevents empty strings from reaching Mongoose enum validators,
 * which reject "" as an invalid value even for optional fields.
 *
 * @param {any} value
 * @returns {string|undefined}
 */
function sanitizeOptionalString(value) {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * POST /api/sell-products
 * Creates a new sell product with multiple images.
 * Accepts images via `upload.array("images")`.
 */
export const createSellProduct = asyncHandler(async (req, res) => {
    const {
        name,
        category,
        description,
        sellingPrice,
        purchasePrice,
        productURL,
        quantity,
        isNegotiable,
        hasWarranty,
        warrantyValue,
        warrantyUnit,
        usageTime,
    } = req.body;

    if (!name || !category || sellingPrice === undefined || quantity === undefined || isNegotiable === undefined || hasWarranty === undefined) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const files = Array.isArray(req.files) ? req.files : [];
    console.log("[SELL CREATE] req.files:", files);

    if (files.length === 0) {
        throw new ApiError(400, "At least one image file is required in the images field");
    }

    const parsedSellingPrice = Number.parseFloat(sellingPrice);
    const parsedPurchasePrice = sanitizeOptionalString(purchasePrice) !== undefined
        ? Number.parseFloat(purchasePrice)
        : undefined;
    const parsedQuantity = Number.parseInt(quantity, 10);
    const parsedIsNegotiable = typeof isNegotiable === "string" ? isNegotiable.toLowerCase() === "true" : Boolean(isNegotiable);
    const parsedHasWarranty = typeof hasWarranty === "string" ? hasWarranty.toLowerCase() === "true" : Boolean(hasWarranty);
    const parsedUsageTime = parseUsageTime(usageTime);

    // Sanitize optional enum/string fields — never let "" reach Mongoose
    const sanitizedWarrantyUnit = sanitizeOptionalString(warrantyUnit);
    const sanitizedProductURL = sanitizeOptionalString(productURL);
    const sanitizedDescription = sanitizeOptionalString(description);

    // Warranty value: only parse if hasWarranty is true and value is present
    const parsedWarrantyValue = parsedHasWarranty
        ? (sanitizeOptionalString(warrantyValue) !== undefined ? Number.parseFloat(warrantyValue) : undefined)
        : undefined;

    if (Number.isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        throw new ApiError(400, "Selling price must be a positive number");
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
        throw new ApiError(400, "Quantity must be a positive number");
    }

    // Warranty validation: only required when hasWarranty is true
    if (parsedHasWarranty) {
        if (parsedWarrantyValue === undefined || Number.isNaN(parsedWarrantyValue)) {
            throw new ApiError(400, "Warranty duration is required when item has warranty");
        }
        if (!sanitizedWarrantyUnit) {
            throw new ApiError(400, "Warranty unit (days/months/years) is required when item has warranty");
        }
        const validWarrantyUnits = ["days", "months", "years"];
        if (!validWarrantyUnits.includes(sanitizedWarrantyUnit)) {
            throw new ApiError(400, `Warranty unit must be one of: ${validWarrantyUnits.join(", ")}`);
        }
    }

    // Upload all images concurrently — rolls back on partial failure
    const uploadedImages = await uploadImages(files, "findit/sell-products");
    console.log("[SELL CREATE] uploadedImages:", uploadedImages);

    try {
        // Build the document — only include warranty fields when hasWarranty is true
        const productData = {
            name: name.trim(),
            images: uploadedImages,
            category,
            description: sanitizedDescription,
            sellingPrice: parsedSellingPrice,
            usageTime: parsedUsageTime,
            hasWarranty: parsedHasWarranty,
            isNegotiable: parsedIsNegotiable,
            purchasePrice: parsedPurchasePrice,
            productURL: sanitizedProductURL,
            quantity: parsedQuantity,
            user: req.user._id,
        };

        // Conditionally attach warranty fields so undefined is never
        // spread into the document (avoids Mongoose "null vs undefined" issues)
        if (parsedHasWarranty) {
            productData.warrantyValue = parsedWarrantyValue;
            productData.warrantyUnit = sanitizedWarrantyUnit;
        }

        const product = await sellProduct.create(productData);
        console.log("[SELL CREATE] product.images:", product.images);

        // Notify followers who have notifyOnPost enabled
        void notifyFollowersOnNewPost({
            sellerId: req.user._id,
            sellerName: req.user.name,
            itemTitle: product.name,
            itemType: "sell",
            itemId: product._id,
        });

        return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
    } catch (error) {
        // Rollback: delete all uploaded images if DB creation fails
        console.error(`[ROLLBACK] Sell product creation failed. Deleting ${uploadedImages.length} uploaded assets:`, error.message);
        await deleteImages(uploadedImages.map((img) => img.publicId));
        throw error;
    }
});



export const getAllSellProducts = asyncHandler(async (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10); // max 50 per page
    const skip = (page - 1) * limit;


    const filter = {};

    // Search by name or description
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { name: searchRegex },
            { description: searchRegex }
        ];
    }

    // category match
    if (req.query.category) {
        const categories = req.query.category.split(',');
        filter.category = { $in: categories };
    }

    // Price range 
    if (req.query.minPrice || req.query.maxPrice) {
        filter.sellingPrice = {};
        if (req.query.minPrice) filter.sellingPrice.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.sellingPrice.$lte = Number(req.query.maxPrice);
    }

    // Warranty filter
    if (req.query.hasWarranty !== undefined) {
        filter.hasWarranty = req.query.hasWarranty === 'true';
    }

    // Negotiable filter
    if (req.query.isNegotiable !== undefined) {
        filter.isNegotiable = req.query.isNegotiable === 'true';
    }

    let sortOption = { createdAt: -1 }; 
    if (req.query.sortBy) {
        switch (req.query.sortBy) {
            case 'price_asc':
                sortOption = { sellingPrice: 1 };
                break;
            case 'price_desc':
                sortOption = { sellingPrice: -1 };
                break;
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'most_used':
                sortOption = { 'usageTime.years': -1, 'usageTime.months': -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }
    }

    const [products, total] = await Promise.all([
        sellProduct
            .find(filter)
            .populate('user', 'name email phone avatar') 
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean(), 
        sellProduct.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    currentPage: page,
                    itemsPerPage: limit,
                    totalItems: total,
                    totalPages,
                    hasNextPage,
                    hasPrevPage,
                },
                filters: req.query, 
            },
            "Products fetched successfully"
        )
    );
});

export const getSellProductDetail = asyncHandler(async (req, res) => {
    const { sellProductId } = req.params;
    const product = await sellProduct.findById(sellProductId).populate("user", "name email");
    if (!product) {
        return res.status(404).json(new ApiResponse(
            404,
            null,
            "Sell product not found"
        ));
    }
    return res.status(200).json(new ApiResponse(
        200,
        product,
        "Product fetched successfully"
    ));
});

/**
 * GET /api/sell-products/:id
 * Fetches a single sell product by ID.
 */
export const getSingleSellProduct = asyncHandler(async (req, res) => {
    const product = await sellProduct.findById(req.params.id)
        .populate("user", "name email avatar createdAt");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * PUT /api/sell-products/:id
 * Updates a sell product. Supports replacing images:
 * - If new image files are uploaded, old images are replaced (old ones deleted from Cloudinary).
 * - If no new files are sent, existing images are preserved.
 */
export const updateSellProduct = asyncHandler(async (req, res) => {
    // 1. Verify existence and authorization
    const product = await sellProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this product");
    }

    const oldImages = [...product.images];
    let newUploadedImages = null;

    // 2. Upload new images if provided
    const files = Array.isArray(req.files) ? req.files : [];
    console.log("[SELL UPDATE] req.files:", files);

    if (files.length > 0) {
        newUploadedImages = await uploadImages(files, "findit/sell-products");
        console.log("[SELL UPDATE] uploadedImages:", newUploadedImages);
    }

    try {
        // 3. Build update payload
        const updateData = { ...req.body };

        // Remove image-related fields from body to prevent manual injection
        delete updateData.images;
        delete updateData.imageUrl;
        delete updateData.imagePublicId;

        // Parse fields that come as strings from FormData
        if (updateData.sellingPrice !== undefined) {
            updateData.sellingPrice = Number.parseFloat(updateData.sellingPrice);
        }
        if (updateData.purchasePrice !== undefined) {
            const sanitized = sanitizeOptionalString(updateData.purchasePrice);
            updateData.purchasePrice = sanitized !== undefined ? Number.parseFloat(sanitized) : undefined;
        }
        if (updateData.quantity !== undefined) {
            updateData.quantity = Number.parseInt(updateData.quantity, 10);
        }
        if (updateData.isNegotiable !== undefined) {
            updateData.isNegotiable = typeof updateData.isNegotiable === "string"
                ? updateData.isNegotiable.toLowerCase() === "true"
                : Boolean(updateData.isNegotiable);
        }
        if (updateData.hasWarranty !== undefined) {
            updateData.hasWarranty = typeof updateData.hasWarranty === "string"
                ? updateData.hasWarranty.toLowerCase() === "true"
                : Boolean(updateData.hasWarranty);
        }
        if (updateData.usageTime !== undefined) {
            updateData.usageTime = parseUsageTime(updateData.usageTime);
        }

        // Sanitize optional enum/string fields — prevent "" from reaching Mongoose
        if (updateData.warrantyUnit !== undefined) {
            updateData.warrantyUnit = sanitizeOptionalString(updateData.warrantyUnit);
        }
        if (updateData.productURL !== undefined) {
            updateData.productURL = sanitizeOptionalString(updateData.productURL);
        }
        if (updateData.description !== undefined) {
            updateData.description = sanitizeOptionalString(updateData.description);
        }

        // Warranty value: only parse when non-empty
        if (updateData.warrantyValue !== undefined) {
            const sanitized = sanitizeOptionalString(updateData.warrantyValue);
            updateData.warrantyValue = sanitized !== undefined ? Number.parseFloat(sanitized) : undefined;
        }

        // When hasWarranty is explicitly set to false, clear warranty fields
        if (updateData.hasWarranty === false) {
            delete updateData.warrantyValue;
            delete updateData.warrantyUnit;
        }

        if (newUploadedImages) {
            updateData.images = newUploadedImages;
        }

        // 4. Commit update
        const updatedProduct = await sellProduct.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: "after", runValidators: true }
        ).populate("user", "name avatar email rating profilePicture");

        console.log("[SELL UPDATE] product.images:", updatedProduct.images);

        // 5. Delete old images ONLY after successful DB update
        if (newUploadedImages && oldImages.length > 0) {
            await deleteImages(oldImages.map((img) => img.publicId));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
    } catch (error) {
        // Rollback: delete newly uploaded images if update fails
        if (newUploadedImages) {
            console.error(`[ROLLBACK] Sell product update failed. Deleting ${newUploadedImages.length} newly uploaded assets:`, error.message);
            await deleteImages(newUploadedImages.map((img) => img.publicId));
        }
        throw error;

    }
});

/**
 * DELETE /api/sell-products/:id
 * Deletes a sell product and all its Cloudinary images.
 */
export const deleteSellProduct = asyncHandler(async (req, res) => {
    const product = await sellProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this product");
    }

    // Capture image public IDs before deletion
    const imagePublicIds = product.images.map((img) => img.publicId);

    // Delete database entry first
    await product.deleteOne();

    // Clean up all Cloudinary assets
    if (imagePublicIds.length > 0) {
        await deleteImages(imagePublicIds);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Product deleted successfully"));
});
