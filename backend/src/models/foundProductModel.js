import mongoose from "mongoose";

const foundProductSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ["electronic", "wearable/fashion", "stationary"]
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date,
        required: true
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

const FoundProduct = mongoose.model("FoundProduct", foundProductSchema);

export default FoundProduct;