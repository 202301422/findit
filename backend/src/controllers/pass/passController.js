import pass from "../../models/expirable_item/passModel.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

function parseBoolean(value) {
    if (value === true || value === false) return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
}

function parseVenue(value) {
    if (!value) return null;
    if (typeof value === "object") return value;

    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    return null;
}

export const addPass = async (req,res) => {
    let uploadedImage = null;

    try {
        const { name, category, description } = req.body;
        const venue = parseVenue(req.body.venue);
        const price = Number.parseFloat(req.body.price);
        const quantity = Number.parseInt(req.body.quantity, 10);
        const ageRestriction = req.body.ageRestriction === undefined || req.body.ageRestriction === ""
            ? undefined
            : Number.parseInt(req.body.ageRestriction, 10);
        const dateTime = new Date(req.body.dateTime);
        const isNegotiable = parseBoolean(req.body.isNegotiable);

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }

        if (!name || !category || !price || !req.body.dateTime || !venue || !quantity || req.body.isNegotiable === undefined) {
            return res.status(400).json({ message: "enter all required fields" });
        }

        if (!venue.area || !venue.city || !venue.state) {
            return res.status(400).json({ message: "enter all required fields in venue" });
        }

        if (!["Concert", "Movie", "Event", "Other"].includes(category)) {
            return res.status(400).json({ message: "enter a valid category" });
        }

        if (Number.isNaN(price) || price < 0) {
            return res.status(400).json({ message: "price must be a positive number" });
        }

        if (Number.isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ message: "quantity must be a positive number" });
        }

        if (Number.isNaN(dateTime.getTime()) || dateTime <= new Date()) {
            return res.status(400).json({ message: "date must be upcoming" });
        }

        if (ageRestriction !== undefined && (Number.isNaN(ageRestriction) || ageRestriction < 0)) {
            return res.status(400).json({ message: "enter a valid age" });
        }

        uploadedImage = await uploadOnCloudinary(req.file.buffer);
        if (!uploadedImage) {
            return res.status(500).json({ message: "Image upload failed. Please try again." });
        }

        const newPass = new pass({
            name,
            category,
            description,
            imageUrl: uploadedImage.secure_url,
            price,
            dateTime,
            venue,
            quantity,
            isNegotiable,
            ageRestriction,
            user: req.user._id
        });

        await newPass.save();
        res.status(201).json({
            message: "Pass added successfully",
            pass: newPass
        });
    } catch (error) {
        if (uploadedImage?.public_id) {
            await deleteFromCloudinary(uploadedImage.public_id);
        }
        res.status(500).json({ message: "Validation or Server error", 
            error: error.message 
        });
    }
};

export const updatePass = async (req,res) =>{
    try {
        const {id} = req.params;
        const existingPass = await pass.findById(id);
        if(!existingPass){
            return res.status(404).json({message: "Pass not found"});
        }
        if(existingPass.user.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "Unauthorized"});
        }
        // If image URL is updated, validate it
        if (req.body.imageUrl) {
            try {
                const parsedUrl = new URL(req.body.imageUrl);
                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    return res.status(400).json({ message: "Invalid image URL protocol" });
                }
            } catch (e) {
                return res.status(400).json({ message: "Invalid image URL format" });
            }
        }
        const updatedPass = await pass.findByIdAndUpdate(id, req.body, {new: true, runValidators: true});
        res.status(200).json({
            message: "Pass updated successfully",
            pass: updatedPass
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const deletePass = async (req,res) =>{
    try {
        const {id} = req.params;
        const existingPass = await pass.findById(id);
        if(!existingPass){
            return res.status(404).json({message: "Pass not found"});
        }
        if(existingPass.user.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "Unauthorized"});
        }
        await pass.findByIdAndDelete(id);
        res.status(200).json({message: "Pass deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getPassById = async (req,res) =>{
    try {
        const {id} = req.params;
        const existingPass = await pass.findById(id);
        if(!existingPass){
            return res.status(404).json({message: "Pass not found"});
        }
        res.status(200).json({
            message: "Pass fetched successfully",
            pass: existingPass
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getAllPasses = async (req,res)=>{
    try {
        const passes = await pass.find().sort({ createdAt: -1 }).populate("user", "name email");
        res.status(200).json({
            message: "Passes fetched successfully",
            passes
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}