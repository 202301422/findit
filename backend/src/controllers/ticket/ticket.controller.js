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

/**
 * GET /api/tickets/:id
 * Fetch a single ticket by ID.
 */
export const getTicketById = asyncHandler(async (req, res) => {
    const ticket = await ticketModel.findById(req.params.id)
        .populate("user", "name email avatar createdAt");

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    return res.status(200).json(new ApiResponse(200, ticket, "Ticket fetched successfully"));
});

/**
 * PUT /api/tickets/:id
 * Update a ticket (owner only).
 */
export const updateTicket = asyncHandler(async (req, res) => {
    const ticket = await ticketModel.findById(req.params.id);

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this ticket");
    }

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

    const updateData = {};

    if (ticketType !== undefined) updateData.ticketType = ticketType;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number.parseFloat(price);
    if (quantity !== undefined) updateData.quantity = Number.parseInt(quantity, 10);
    if (isNegotiable !== undefined) {
        updateData.isNegotiable = typeof isNegotiable === "string"
            ? isNegotiable.toLowerCase() === "true"
            : Boolean(isNegotiable);
    }
    if (origin !== undefined) {
        const parsed = parseLocation(origin);
        if (parsed) updateData.origin = parsed;
    }
    if (destination !== undefined) {
        const parsed = parseLocation(destination);
        if (parsed) updateData.destination = parsed;
    }
    if (departureTime !== undefined) updateData.departureTime = new Date(departureTime);
    if (arrivalTime !== undefined) updateData.arrivalTime = new Date(arrivalTime);
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const updated = await ticketModel.findByIdAndUpdate(
        req.params.id,
        updateData,
        { returnDocument: "after", runValidators: true }
    ).populate("user", "name email avatar createdAt");

    return res.status(200).json(new ApiResponse(200, updated, "Ticket updated successfully"));
});

/**
 * DELETE /api/tickets/:id
 * Delete a ticket (owner only).
 */
export const deleteTicket = asyncHandler(async (req, res) => {
    const ticket = await ticketModel.findById(req.params.id);

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this ticket");
    }

    await ticket.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Ticket deleted successfully"));
});
