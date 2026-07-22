import mongoose from "mongoose"

const locationSchema = {
    area : { type : String, required : true },
    city : { type : String, required : true },
    state : { type : String, required : true }
}

const ticketSchema = mongoose.Schema({
    ticketType : {
        type : String,
        required : true,
        enum : ["Bus","Train","Plane"],
    },
    origin : locationSchema,
    destination : locationSchema,
    departureTime : { type : Date, required : true },
    arrivalTime : { type : Date, required : true },
    isNegotiable : { type : Boolean, required : true },
    price : { type : Number, required : true, min : 0 },
    quantity : { type : Number, required : true },
    
    // ---> ADD THIS USER FIELD <---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    description : { type : String },
    status : {
        type : String,
        enum : ["active", "sold", "closed", "expired"],
        default : "active"
    }
}, { timestamps : true });

const ticketModel = mongoose.model("ticketModel", ticketSchema);
export default ticketModel;