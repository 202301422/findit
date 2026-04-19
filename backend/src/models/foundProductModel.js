import mongoose from "mongoose";
import ProductCatagory from "../enums/ProductCatagory/"

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

const foundProduct = mongoose.model("foundProduct", foundProductSchema);

export default foundProduct;