import mongoose from "mongoose"
import FoundCatagory from "../enum/FoundProductCatagory"
const sellProductSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
    },
    imageUrl : {
        type : String,
        required : true,
    },
    category : {
        type : String,
        enum : FoundCatagory,
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
    quentity : {
        type : Number,
        required : true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
},{timestamps : true}) 

const sellProduct = mongoose.model("sellProduct",sellProductSchema);

export default sellProduct;