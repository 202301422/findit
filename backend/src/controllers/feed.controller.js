import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { parseStrictPositiveInteger } from "../utils/validators.js";

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
            return { model: SellProduct, categoryField: "category", priceField: "sellingPrice", publicFilter: { status: "active" } };
        case "found":
            return { model: FoundProduct, categoryField: "category", priceField: null, publicFilter: { status: "active" } };
        case "ticket":
            return {
                model: Ticket,
                categoryField: "ticketType",
                priceField: "price",
                publicFilter: {
                    $and: [
                        { departureTime: { $gt: new Date() } },
                        {
                            $or: [
                                { status: "active" },
                                { status: { $exists: false } },
                            ],
                        },
                    ],
                },
            };
        case "pass":
            return { model: Pass, categoryField: "category", priceField: "price", publicFilter: { status: "active", dateTime: { $gt: new Date() } } };
        default:
            return null;
    }
};

/**
 * @desc    Get paginated and filtered list of items for a specific tab
 * @route   GET /api/feed/list
 */
export const getFeedList = asyncHandler(async (req, res) => {
    const { type, category, maxPrice, isNegotiable, hasWarranty, sort, search, dateAfter, dateBefore, minSeats } = req.query;
    const page = parseStrictPositiveInteger(req.query.page, "Page", { defaultValue: 1, min: 1, max: 100000 });
    const limit = parseStrictPositiveInteger(req.query.limit, "Limit", { defaultValue: 10, min: 1, max: 50 });

    const config = getModelConfig(type);
    if (!config) {
        throw new ApiError(400, "Invalid feed type. Must be 'sell', 'found', 'ticket', or 'pass'.");
    }

    const { model, categoryField, priceField, publicFilter } = config;

    const filterQuery = { ...publicFilter };

    // 2. Apply dynamic Category filter if provided by the frontend
    if (category) {
        const normalizedCategory = String(category).trim();
        const categoryOptions = CATEGORY_ALIASES[normalizedCategory] || [normalizedCategory];
        filterQuery[categoryField] = categoryOptions.length > 1 ? { $in: categoryOptions } : normalizedCategory;
    }

    // 3. Apply dynamic Max Price filter (Only if the model supports pricing)
    if (maxPrice && priceField) {
        const numericMaxPrice = Number(maxPrice);

        if (!Number.isFinite(numericMaxPrice) || numericMaxPrice < 0) {
            throw new ApiError(400, "maxPrice must be a valid non-negative number");
        }

        filterQuery[priceField] = { $lte: numericMaxPrice };
    }

    // 4. Negotiable filter
    if (isNegotiable !== undefined && isNegotiable !== '') {
        filterQuery.isNegotiable = String(isNegotiable).toLowerCase() === 'true';
    }

    // 5. Warranty filter (for sell items)
    if (hasWarranty !== undefined && hasWarranty !== '' && type === 'sell') {
        filterQuery.hasWarranty = String(hasWarranty).toLowerCase() === 'true';
    }

    // 6. Available seats / quantity filter (for tickets/passes)
    if (minSeats) {
        const numSeats = Number(minSeats);
        if (Number.isFinite(numSeats) && numSeats > 0) {
            filterQuery.quantity = { $gte: numSeats };
        }
    }

    // 7. Date range filter (dateAfter / dateBefore)
    // Applies to dateTime (found, pass) or departureTime (ticket)
    const dateFieldName = type === 'ticket' ? 'departureTime' : 'dateTime';
    if (dateAfter || dateBefore) {
        filterQuery[dateFieldName] = {};
        if (dateAfter) {
            filterQuery[dateFieldName].$gte = new Date(dateAfter);
        }
        if (dateBefore) {
            filterQuery[dateFieldName].$lte = new Date(dateBefore);
        }
    }

    // 8. Search query matching title, description, category, and venue/location fields
    if (search && String(search).trim()) {
        const regex = new RegExp(String(search).trim(), 'i');
        filterQuery.$or = [
            { name: regex },
            { description: regex },
            { category: regex },
            { venue: regex },
            { 'venue.area': regex },
            { 'venue.city': regex },
            { 'venue.state': regex },
            { 'origin.city': regex },
            { 'origin.area': regex },
            { 'destination.city': regex },
            { 'destination.area': regex }
        ];
    }

    // 9. Sorting option
    let sortQuery = { createdAt: -1 };
    if (sort === 'price_asc' && priceField) {
        sortQuery = { [priceField]: 1 };
    } else if (sort === 'price_desc' && priceField) {
        sortQuery = { [priceField]: -1 };
    } else if (sort === 'usage_asc' && type === 'sell') {
        sortQuery = { 'usageTime.years': 1, 'usageTime.months': 1, 'usageTime.days': 1 };
    } else if (sort === 'usage_desc' && type === 'sell') {
        sortQuery = { 'usageTime.years': -1, 'usageTime.months': -1, 'usageTime.days': -1 };
    }

    const skipIndex = (page - 1) * limit;

    // Execute query with pagination and sorting
    const items = await model.find(filterQuery)
        .sort(sortQuery)
        .skip(skipIndex)
        .limit(limit)
        .populate("user", "name avatar");

    const totalItems = await model.countDocuments(filterQuery);

    res.json(new ApiResponse(200, {
        items,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNextPage: skipIndex + items.length < totalItems,
        hasPrevPage: page > 1,
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

    const categories = await config.model.distinct(config.categoryField, config.publicFilter);

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