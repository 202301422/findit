import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// Import all 4 domain models
import SellProduct from "../models/SellProduct.js";
import FoundProduct from "../models/foundProductModel.js";
import Ticket from "../models/expirable_item/ticketModel.js";
import Pass from "../models/expirable_item/passModel.js";

const CATEGORY_ALIASES = {
    "Books & Documents": ["Books & Documents", "Books & Document", "Books & Stationery"],
    "Books & Document": ["Books & Documents", "Books & Document", "Books & Stationery"],
    "Books & Stationery": ["Books & Documents", "Books & Document", "Books & Stationery"],
};

/**
 * Helper function to dynamically map the requested feed type to the correct
 * Mongoose model and schema field names.
 */
const getModelConfig = (type) => {
    switch (type?.toLowerCase()) {
        case "sell":
            return { model: SellProduct, categoryField: "category", priceField: "sellingPrice" };
        case "found":
            return { model: FoundProduct, categoryField: "category", priceField: null };
        case "ticket":
            return { model: Ticket, categoryField: "ticketType", priceField: "price" };
        case "pass":
            return { model: Pass, categoryField: "category", priceField: "price" };
        default:
            return null;
    }
};

/**
 * @desc    Get paginated and filtered list of items for a specific tab
 * @route   GET /api/feed/list
 */
export const getFeedList = asyncHandler(async (req, res) => {
    const { type, category, maxPrice, page = 1, limit = 10 } = req.query;

    const config = getModelConfig(type);
    if (!config) {
        throw new ApiError(400, "Invalid feed type. Must be 'sell', 'found', 'ticket', or 'pass'.");
    }

    const { model, categoryField, priceField } = config;

    // 1. Initialize empty query (Can add { status: 'active' } here if you want to hide sold items)
    const filterQuery = {};

    // 2. Apply dynamic Category filter if provided by the frontend
    if (category) {
        const normalizedCategory = String(category).trim();
        const categoryOptions = CATEGORY_ALIASES[normalizedCategory] || [normalizedCategory];
        filterQuery[categoryField] = categoryOptions.length > 1 ? { $in: categoryOptions } : normalizedCategory;
    }

    // 3. Apply dynamic Max Price filter (Only if the model supports pricing)
    if (maxPrice && priceField) {
        filterQuery[priceField] = { $lte: Number(maxPrice) };
    }

    // 4. Calculate pagination offsets
    const skipIndex = (Number(page) - 1) * Number(limit);

    // 5. Execute query with pagination, sorting by newest first, and populating basic user info
    const items = await model.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skipIndex)
        .limit(Number(limit))
        .populate("user", "name avatar"); // Only fetch basic user info for the feed cards

    // Get total count for frontend pagination controls
    const totalItems = await model.countDocuments(filterQuery);

    res.json(new ApiResponse(200, {
        items,
        page: Number(page),
        totalPages: Math.ceil(totalItems / Number(limit)),
        totalItems
    }, `${type} feed fetched successfully`));
});

/**
 * @desc    Get a list of currently active categories for the dropdown menu
 * @route   GET /api/feed/categories
 */
export const getFeedCategories = asyncHandler(async (req, res) => {
    const { type } = req.query;

    const config = getModelConfig(type);
    if (!config) {
        throw new ApiError(400, "Invalid feed type.");
    }

    // Use MongoDB distinct() to only fetch categories that actually have active listings
    const categories = await config.model.distinct(config.categoryField);

    res.json(new ApiResponse(200, { categories }, `Categories for ${type} fetched successfully`));
});

/**
 * @desc    Get full details of a specific item for the detailed view page
 * @route   GET /api/feed/details/:id
 */
export const getFeedDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid item ID format");
    }

    const config = getModelConfig(type);
    if (!config) {
        throw new ApiError(400, "Invalid feed type.");
    }

    // Populate user with contact details so buyers can reach out
    const itemDetails = await config.model.findById(id)
        .populate("user", "name email phone avatar college createdAt");

    if (!itemDetails) {
        throw new ApiError(404, "Item not found");
    }

    res.json(new ApiResponse(200, { itemDetails }, "Item details fetched successfully"));
});