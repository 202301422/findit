import mongoose from "mongoose"
import { ResellProductCatagory } from "../enums/ResellProductCatagory.js"
import { UPLOAD_CONFIG } from "../config/uploadConfig.js"

/**
 * Sub-schema for image metadata stored per image in the `images` array.
 * Each entry corresponds to a single Cloudinary-hosted asset.
 */
const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: [true, "Image URL is required"],
        set: function (val) {
            // Enforce HTTPS
            if (val && val.startsWith("http://")) {
                return val.replace("http://", "https://");
            }
            return val;
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

const sellProductSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
    },

    /**
     * Array of uploaded images. Replaces the legacy `imageUrl` / `imagePublicId` fields.
     * Validated at the schema level: at least 1 image is required, up to MAX_IMAGES.
     */
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

    category : {
        type : String,
        enum : ResellProductCatagory,
        required : true,
    },
    description : {
        type : String
    },
    sellingPrice : {
        type : Number,
        required : true,
    },
    usageTime : {
        years: {
            type: Number,
            default: 0
        },
        months: {
            type: Number,
            default: 0
        },
        days: {
            type: Number,
            default: 0
        },
    },
    
    hasWarranty : {
        type : Boolean,
        required : true,
    },
    warrantyValue : {
        type : Number,
        required : function(){
            return this.hasWarranty;
        },
    },
    warrantyUnit:{
        type : String,
        enum : ["days","months","years"],
        required : function(){
            return this.hasWarranty;
        }
    },
    isNegotiable : {
        type : Boolean,
        required : true,
    },
    purchasePrice : {
        type : Number,
    },
    productURL : {
        type : String,
    },
    quantity : {
        type : Number,
        required : true,
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
    
},{timestamps : true}) 

// ────────────────────────────────────────────────────────────────────────────
// Backward-compatible virtual getters for legacy `imageUrl` / `imagePublicId`
// ────────────────────────────────────────────────────────────────────────────

sellProductSchema.virtual("imageUrl").get(function () {
    return this.images && this.images.length > 0 ? this.images[0].url : null;
});

sellProductSchema.virtual("imagePublicId").get(function () {
    return this.images && this.images.length > 0 ? this.images[0].publicId : null;
});

// Ensure virtuals are included in JSON and Object conversions
sellProductSchema.set("toJSON", { virtuals: true });
sellProductSchema.set("toObject", { virtuals: true });

// Clean JSON output
sellProductSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const sellProduct = mongoose.model("sellProduct",sellProductSchema);

export default sellProduct;