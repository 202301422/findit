import mongoose from "mongoose";
import ProductCategory from "../enums/FoundProductCatagory.js";
import { getPublicIdFromUrl } from "../utils/cloudinary.js";

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

        imageUrl: {
            type: String,
            required: [true, "Image URL is required"],

            set: function (url) {

                if (url && url.startsWith("http://")) {
                    return url.replace("http://", "https://");
                }

                return url;
            }
        },

        imagePublicId: {
            type: String,
            required: [true, "Image public ID is required"]
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
        }
    },
    {
        timestamps: true
    }
);







// Auto-populate imagePublicId for legacy compatibility
foundProductSchema.pre("validate", function () {

    if (this.imageUrl && !this.imagePublicId) {

        this.imagePublicId =
            getPublicIdFromUrl(this.imageUrl);
    }
});







// Clean JSON output
foundProductSchema.set("toJSON", {
    transform: function (doc, ret) {

        delete ret.__v;

        return ret;
    }
});







const FoundProduct = mongoose.model(
    "FoundProduct",
    foundProductSchema
);

export default FoundProduct;