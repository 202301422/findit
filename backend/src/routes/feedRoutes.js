import express from "express";
import {
    getFeedList,
    getFeedCategories,
    getFeedDetails
} from "../controllers/feed.controller.js";

// Optional: Import your auth middleware if you want the feed restricted to logged-in students only
// import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/feed/list
 * @desc    Get a paginated and filtered list of items (Buy/Sell, Lost/Found, Tickets, Passes)
 * @access  Public (or Private if you add the authenticate middleware)
 */
router.get("/list", getFeedList);

/**
 * @route   GET /api/feed/categories
 * @desc    Get a list of distinct, currently active categories for the dropdowns
 * @access  Public 
 */
router.get("/categories", getFeedCategories);

/**
 * @route   GET /api/feed/details/:id
 * @desc    Get the full, detailed document for a specific item
 * @access  Public
 */
router.get("/details/:id", getFeedDetails);

export default router;