import mongoose from "mongoose"

const locationSchema = {
    area : {
        type : String,
        required : true,
    },
    city : {
        type : String,
        required : true,
    },
    state : {
        type : String,
        required : true,
    }
}

const ticketSchema = mongoose.Schema({
    ticketType : {
        type : String,
        required : true,
        enum : ["Bus","Train","Plane"],
    },
    origin : locationSchema,
    destination : locationSchema,
    departureTime : {
        type : Date,
        required : true
    },
    arrivalTime : {
        type : Date,
        required : true,
    },
    isNegotiable : {
        type : Boolean,
        required : true,
    },
    quantity : {
        type : Number,
        required : true,
    },
    description : {
        type : String
    }

},{timestamps : true});

const ticketModel = mongoose.model("ticketModel",ticketSchema);

export default ticketModel;