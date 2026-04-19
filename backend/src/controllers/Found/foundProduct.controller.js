import FoundProduct from "../../models/foundProductModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
// import { Product_catagory } from "../../enums/FoundProductCatagory.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";


// create
export const createFoundProduct = asyncHandler(async (req, res) => {
    const { name, category, description, venue, dateTime } = req.body;

    if (!name || !category || !venue || !dateTime) {
        throw new ApiError(400, "All required fields must be provided");
    }

    if (!req.file?.path) {
        throw new ApiError(400, "Image is required");
    }

    const uploaded = await uploadOnCloudinary(req.file.path);

    if (!uploaded) {
        throw new ApiError(500, "Image upload failed");
    }

    const product = await FoundProduct.create({
        name,
        category,
        description,
        venue,
        dateTime,
        imageUrl: uploaded.url,
        user: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created"));
});


// get all
export const getAllFoundProducts = asyncHandler(async (req, res) => {
    const products = await FoundProduct.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, products, "All products"));
});


// get single
export const getSingleFoundProduct = asyncHandler(async (req, res) => {
    const product = await FoundProduct.findById(req.params.id)
        .populate("user", "name email");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched"));
});


// update
export const updateFoundProduct = asyncHandler(async (req, res) => {
    let product = await FoundProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    // if new image uploaded
    if (req.file?.path) {
        const publicId = product.imageUrl
            ? product.imageUrl.split("/").pop().split(".")[0]
            : null;

        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        const uploaded = await uploadOnCloudinary(req.file.path);

        if (!uploaded) {
            throw new ApiError(500, "Image upload failed");
        }

        req.body.imageUrl = uploaded.url;
    }

    const updatedProduct = await FoundProduct.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedProduct, "Product updated"));
});


// delete
export const deleteFoundProduct = asyncHandler(async (req, res) => {
    const product = await FoundProduct.findById(req.params.id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    const publicId = product.imageUrl
        ? product.imageUrl.split("/").pop().split(".")[0]
        : null;

    if (publicId) {
        await deleteFromCloudinary(publicId);
    }

    await product.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Product deleted"));
});