import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const extractBearerToken = (authorizationHeader) => {
    if (typeof authorizationHeader !== "string") {
        throw new ApiError(401, "Authorization token missing");
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/);

    if (!match) {
        throw new ApiError(401, "Authorization header must use the Bearer scheme");
    }

    const token = match[1].trim();

    if (!token) {
        throw new ApiError(401, "Authorization token missing");
    }

    return token;
};

export const authenticate = async (req, res, next) => {
    try {
        const token = extractBearerToken(req.headers.authorization);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id name email phone username avatar bio college city state country isVerified authProvider accountStatus");

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        if (user.accountStatus !== "active") {
            return res.status(403).json({ success: false, message: "Account is not active" });
        }

        req.user = {
            _id: user._id.toString(),
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            college: user.college,
            city: user.city,
            state: user.state,
            country: user.country,
            isVerified: user.isVerified,
            authProvider: user.authProvider,
            accountStatus: user.accountStatus,
        };

        return next();
    } catch (error) {
        const message = error instanceof ApiError ? error.message : "Invalid token";
        return res.status(error.statusCode || 401).json({ success: false, message });
    }
};