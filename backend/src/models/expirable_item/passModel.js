import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: [true, "Image URL is required"],
        set: function(url) {
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
    width: { type: Number },
    height: { type: Number }
}, { _id: false });

const passSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ["Concert", "Movie", "Event", "Other"],
    },
    images: {
        type: [imageSchema],
        validate: [
            {
                validator: function(arr) {
                    return arr && arr.length >= 1;
                },
                message: "At least one image is required"
            },
            {
                validator: function(arr) {
                    return !arr || arr.length <= 5;
                },
                message: "Cannot upload more than 5 images"
            }
        ]
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    dateTime: {
        type: Date,
        required: true,
    },
    venue: {
        area: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
    },
    quantity:{
        type: Number,
        required: true,
        min: 1,
    },
    isNegotiable : {
        type : Boolean,
        required : true,
    },
    ageRestriction: {
        type: Number,
        min: 0,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "sold", "closed", "expired", "draft"],
        default: "active"
    }
},{timestamps : true})

// Virtual for backwards-compat: first image url
passSchema.virtual("imageUrl").get(function() {
    return this.images && this.images.length > 0 ? this.images[0].url : null;
});

passSchema.set("toJSON", {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

passSchema.set("toObject", { virtuals: true });

const pass = mongoose.model("pass", passSchema);

export default pass;