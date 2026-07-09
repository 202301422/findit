import ticketModel from "../../models/expirable_item/ticketModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

function parseLocation(value) {
    if (!value) return null;

    if (typeof value === "object") {
        return value;
    }

    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    return null;
}

export const createTicket = asyncHandler(async (req, res) => {
    const {
        ticketType,
        description,
        price,
        quantity,
        isNegotiable,
        origin,
        destination,
        departureTime,
        arrivalTime,
    } = req.body;

    if (!ticketType || !origin || !destination || !departureTime || !arrivalTime || price === undefined || quantity === undefined || isNegotiable === undefined) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const parsedOrigin = parseLocation(origin);
    const parsedDestination = parseLocation(destination);
    const parsedPrice = Number.parseFloat(price);
    const parsedQuantity = Number.parseInt(quantity, 10);
    const parsedIsNegotiable = typeof isNegotiable === "string" ? isNegotiable.toLowerCase() === "true" : Boolean(isNegotiable);
    const parsedDepartureTime = new Date(departureTime);
    const parsedArrivalTime = new Date(arrivalTime);

    if (!parsedOrigin?.area || !parsedOrigin?.city || !parsedOrigin?.state) {
        throw new ApiError(400, "Origin location is incomplete");
    }

    if (!parsedDestination?.area || !parsedDestination?.city || !parsedDestination?.state) {
        throw new ApiError(400, "Destination location is incomplete");
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        throw new ApiError(400, "Price must be a positive number");
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
        throw new ApiError(400, "Quantity must be a positive number");
    }

    if (Number.isNaN(parsedDepartureTime.getTime()) || Number.isNaN(parsedArrivalTime.getTime())) {
        throw new ApiError(400, "Departure and arrival time must be valid dates");
    }

    if (parsedDepartureTime <= new Date()) {
        throw new ApiError(400, "Departure time must be in the future");
    }

    if (parsedArrivalTime <= parsedDepartureTime) {
        throw new ApiError(400, "Arrival time must be after departure time");
    }

    const ticket = await ticketModel.create({
        ticketType,
        origin: parsedOrigin,
        destination: parsedDestination,
        departureTime: parsedDepartureTime,
        arrivalTime: parsedArrivalTime,
        isNegotiable: parsedIsNegotiable,
        price: parsedPrice,
        quantity: parsedQuantity,
        description,
        user: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, ticket, "Ticket created successfully"));
});
