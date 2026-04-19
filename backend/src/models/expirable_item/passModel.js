import mongoose from "mongoose";

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
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    dateTime: {
        type: Date,
        required: true
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
    },
    isNegotiable : {
        type : Boolean,
        required : true,
    },
    ageRestriction: {
        type: Number,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    }
},{timestamps : true})

const pass=mongoose.model("pass",passSchema);

export default pass;