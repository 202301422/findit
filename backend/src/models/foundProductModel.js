import mongoose from "mongoose";
import ProductCatagory from "../enums/FoundProductCatagory"

const foundProductSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ProductCatagory
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
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

const foundProduct = mongoose.model("foundProduct", foundProductSchema);

export default foundProduct;