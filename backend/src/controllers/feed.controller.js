import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { parseStrictPositiveInteger } from "../utils/validators.js";
import { getModelConfig, executeFeedQuery } from "../services/feedQuery.service.js";
import mongoose from "mongoose";

/**
 * @desc    Get paginated and filtered list of items for a specific tab
 * @route   GET /api/feed/list
 */
export const getFeedList = asyncHandler(async (req, res) => {
  const { type, category, maxPrice, isNegotiable, hasWarranty, sort, search, dateAfter, dateBefore, minSeats, originCity, destinationCity, venue } = req.query;
  const page = parseStrictPositiveInteger(req.query.page, "Page", { defaultValue: 1, min: 1, max: 100000 });
  const limit = parseStrictPositiveInteger(req.query.limit, "Limit", { defaultValue: 10, min: 1, max: 50 });

  const config = getModelConfig(type);
  if (!config) {
    throw new ApiError(400, "Invalid feed type. Must be 'sell', 'found', 'ticket', or 'pass'.");
  }

  const filters = {
    category,
    maxPrice,
    isNegotiable,
    hasWarranty,
    sort,
    search,
    dateAfter,
    dateBefore,
    minSeats,
    originCity,
    destinationCity,
    venue,
  };

  const result = await executeFeedQuery(type, filters, { page, limit });

  res.json(new ApiResponse(200, result, `${type} feed fetched successfully`));
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

  const itemDetails = await config.model.findById(id)
    .populate("user", "name email phone avatar college createdAt");

  if (!itemDetails) {
    throw new ApiError(404, "Item not found");
  }

  res.json(new ApiResponse(200, { itemDetails }, "Item details fetched successfully"));
});