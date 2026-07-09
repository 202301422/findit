import sellProduct from "../../models/SellProduct.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

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

    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }

    const parsedSellingPrice = Number.parseFloat(sellingPrice);
    const parsedPurchasePrice = purchasePrice === undefined || purchasePrice === "" ? undefined : Number.parseFloat(purchasePrice);
    const parsedQuantity = Number.parseInt(quantity, 10);
    const parsedIsNegotiable = typeof isNegotiable === "string" ? isNegotiable.toLowerCase() === "true" : Boolean(isNegotiable);
    const parsedHasWarranty = typeof hasWarranty === "string" ? hasWarranty.toLowerCase() === "true" : Boolean(hasWarranty);
    const parsedWarrantyValue = warrantyValue === undefined || warrantyValue === "" ? undefined : Number.parseFloat(warrantyValue);
    const parsedUsageTime = parseUsageTime(usageTime);

    if (Number.isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        throw new ApiError(400, "Selling price must be a positive number");
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
        throw new ApiError(400, "Quantity must be a positive number");
    }

    if (parsedHasWarranty && (parsedWarrantyValue === undefined || Number.isNaN(parsedWarrantyValue) || !warrantyUnit)) {
        throw new ApiError(400, "Warranty details are required when item has warranty");
    }

    const uploaded = await uploadOnCloudinary(req.file.buffer);
    if (!uploaded) {
        throw new ApiError(500, "Image upload failed. Please try again.");
    }

    try {
        const product = await sellProduct.create({
            name,
            imageUrl: uploaded.secure_url,
            imagePublicId: uploaded.public_id,
            category,
            description,
            sellingPrice: parsedSellingPrice,
            usageTime: parsedUsageTime,
            hasWarranty: parsedHasWarranty,
            warrantyValue: parsedWarrantyValue,
            warrantyUnit,
            isNegotiable: parsedIsNegotiable,
            purchasePrice: parsedPurchasePrice,
            productURL,
            quantity: parsedQuantity,
            user: req.user._id,
        });

        return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
    } catch (error) {
        console.error(`[ROLLBACK] Sell product creation failed. Deleting uploaded asset '${uploaded.public_id}':`, error.message);
        await deleteFromCloudinary(uploaded.public_id);
        throw error;
    }
});
