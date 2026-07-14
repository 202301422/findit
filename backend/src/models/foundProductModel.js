import mongoose from "mongoose";
import ProductCategory from "../enums/FoundProductCatagory.js";
import { UPLOAD_CONFIG } from "../config/uploadConfig.js";

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: [true, "Image URL is required"],
        set: function (url) {
            if (url && url.startsWith("http://")) {
                return url.replace("http://", "https://");
            }

            return url;
        }
    },
    publicId: {
        type: String,
        required: [true, "Image public ID is required"]
    },
    width: {
        type: Number
    },
    height: {
        type: Number
    }
}, { _id: false });

const foundProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"]
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            enum: ProductCategory
        },

        images: {
            type: [imageSchema],
            validate: [
                {
                    validator: function (arr) {
                        return arr && arr.length >= 1;
                    },
                    message: "At least one image is required"
                },
                {
                    validator: function (arr) {
                        return !arr || arr.length <= UPLOAD_CONFIG.MAX_IMAGES;
                    },
                    message: `Cannot upload more than ${UPLOAD_CONFIG.MAX_IMAGES} images`
                }
            ]
        },

        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"]
        },

        venue: {
            type: String,
            required: [true, "Venue is required"],
            trim: true,
            maxlength: [200, "Venue cannot exceed 200 characters"]
        },

        dateTime: {
            type: Date,
            required: [true, "Date and time are required"]
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["active", "sold", "closed", "expired", "draft"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

foundProductSchema.virtual("imageUrl").get(function () {
    return this.images && this.images.length > 0 ? this.images[0].url : null;
});

foundProductSchema.virtual("imagePublicId").get(function () {
    return this.images && this.images.length > 0 ? this.images[0].publicId : null;
});

foundProductSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

foundProductSchema.set("toObject", { virtuals: true });

const FoundProduct = mongoose.model(
    "FoundProduct",
    foundProductSchema
);

export default FoundProduct;
