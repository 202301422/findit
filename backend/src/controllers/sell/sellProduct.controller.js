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
      .populate('user', 'name email phoneNumber profileImage') 
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

export const getSellProductDetail = asyncHandler(async (req,res)=>{
    const {sellProductId} = req.params;
    const sellProduct = await SellProduct.findById(sellProductId);
    if(!seelproduct){
        return res.status(404).json(new ApiResponse(
            404,
            "Sell product not found"
        ));
    }
    return res.status(200).json(new ApiRespose(
        200,
        sellProduct,
        "Product fetched successfully"
    ));
});



