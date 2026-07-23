import pass from "../../models/expirable_item/passModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadImages, deleteImages } from "../../utils/cloudinary.js";
import { notifyFollowersOnNewPost } from "../../utils/followerNotifier.js";

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
        } catch {
            return value.split(",").map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
}

/* ------------------------------------------------------------------ */
/*  CREATE                                                              */
/* ------------------------------------------------------------------ */
export const addPass = asyncHandler(async (req, res) => {
    const { name, category, description, price, dateTime, venue, quantity, isNegotiable, ageRestriction } = req.body;

    if (!name || !category || !price || !dateTime || !venue || !quantity) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
        throw new ApiError(400, "At least one image is required");
    }

    const uploadedImages = await uploadImages(files, "findit/passes");

    let parsedVenue = venue;
    if (typeof venue === "string") {
        try { parsedVenue = JSON.parse(venue); } catch { /* keep as-is */ }
    }

    try {
        const newPass = await pass.create({
            name,
            category,
            description,
            price: Number(price),
            dateTime,
            venue: parsedVenue,
            quantity: Number(quantity),
            isNegotiable: parseBoolean(isNegotiable),
            ageRestriction: ageRestriction ? Number(ageRestriction) : undefined,
            images: uploadedImages,
            user: req.user._id,
        });

        const populated = await pass.findById(newPass._id).populate("user", "name email avatar createdAt");

        void notifyFollowersOnNewPost({
            sellerId: req.user._id,
            sellerName: req.user.name,
            itemTitle: newPass.name,
            itemType: "pass",
            itemId: newPass._id,
        });

        return res.status(201).json(new ApiResponse(201, populated, "Pass created successfully"));
    } catch (error) {
        await deleteImages(uploadedImages.map((img) => img.publicId));
        throw error;
    }
});

/* ------------------------------------------------------------------ */
/*  GET ALL                                                             */
/* ------------------------------------------------------------------ */
export const getAllPasses = asyncHandler(async (req, res) => {
    const passes = await pass.find()
        .populate("user", "name email avatar createdAt")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, passes, "Passes fetched successfully"));
});

/* ------------------------------------------------------------------ */
/*  GET BY ID                                                           */
/* ------------------------------------------------------------------ */
export const getPassById = asyncHandler(async (req, res) => {
    const found = await pass.findById(req.params.id)
        .populate("user", "name email avatar createdAt");

    if (!found) throw new ApiError(404, "Pass not found");

    return res.status(200).json(new ApiResponse(200, found, "Pass fetched successfully"));
});

/* ------------------------------------------------------------------ */
/*  UPDATE                                                              */
/* ------------------------------------------------------------------ */
export const updatePass = asyncHandler(async (req, res) => {
    const existing = await pass.findById(req.params.id);
    if (!existing) throw new ApiError(404, "Pass not found");

    if (existing.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this pass");
    }

    const oldImages = [...(existing.images || [])];
    const files = Array.isArray(req.files) ? req.files : [];
    const removeImagePublicIds = parseStringArray(req.body.removeImagePublicIds);
    const keepImagePublicIds   = parseStringArray(req.body.keepImagePublicIds);
    const replaceImages        = parseBoolean(req.body.replaceImages);

    let newUploadedImages = [];
    if (files.length > 0) {
        newUploadedImages = await uploadImages(files, "findit/passes");
    }

    try {
        // Build next images set
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

        // Build update payload
        const updateData = {};
        if (req.body.name)        updateData.name        = req.body.name;
        if (req.body.category)    updateData.category    = req.body.category;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.price !== undefined)       updateData.price       = Number(req.body.price);
        if (req.body.quantity !== undefined)    updateData.quantity    = Number(req.body.quantity);
        if (req.body.isNegotiable !== undefined) updateData.isNegotiable = parseBoolean(req.body.isNegotiable);
        if (req.body.dateTime)    updateData.dateTime    = req.body.dateTime;
        if (req.body.status)      updateData.status      = req.body.status;
        if (req.body.ageRestriction !== undefined && req.body.ageRestriction !== "") {
            updateData.ageRestriction = Number(req.body.ageRestriction);
        }
        if (req.body.venue) {
            let v = req.body.venue;
            if (typeof v === "string") { try { v = JSON.parse(v); } catch { /* keep */ } }
            updateData.venue = v;
        }

        updateData.images = nextImages;

        const updated = await pass.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: "after", runValidators: true }
        ).populate("user", "name email avatar createdAt");

        // Clean up removed images from Cloudinary
        const nextPublicIds = new Set(nextImages.map((img) => img.publicId));
        const removedPublicIds = oldImages
            .filter((img) => !nextPublicIds.has(img.publicId))
            .map((img) => img.publicId);
        if (removedPublicIds.length > 0) await deleteImages(removedPublicIds);

        return res.status(200).json(new ApiResponse(200, updated, "Pass updated successfully"));
    } catch (error) {
        if (newUploadedImages.length > 0) {
            await deleteImages(newUploadedImages.map((img) => img.publicId));
        }
        throw error;
    }
});

/* ------------------------------------------------------------------ */
/*  DELETE                                                              */
/* ------------------------------------------------------------------ */
export const deletePass = asyncHandler(async (req, res) => {
    const existing = await pass.findById(req.params.id);
    if (!existing) throw new ApiError(404, "Pass not found");

    if (existing.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this pass");
    }

    const publicIds = (existing.images || []).map((img) => img.publicId);

    await existing.deleteOne();

    if (publicIds.length > 0) await deleteImages(publicIds);

    return res.status(200).json(new ApiResponse(200, null, "Pass deleted successfully"));
});