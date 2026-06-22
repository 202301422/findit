import pass from "../models/expirable_item/passModel.js";

export const addPass = async (req,res) => {
    try {
        const newPass = new pass({
            ...req.body,
            user: req.user._id
        });
        if(newPass.dateTime < new Date()){
            return res.status(400).json({ message: "date must be upcoming" });
        }
        if(newPass.price < 0){
            return res.status(400).json({message: "price must be a positive number"});
        }
        if(newPass.quantity < 0){
            return res.status(400).json({message: "quantity must be a positive number"});
        }
        if(newPass.ageRestriction && newPass.ageRestriction < 0){
            return res.status(400).json({message: "enter a valid age"});
        }
        if(!["Concert", "Movie", "Event", "Other"].includes(newPass.category)){
            return res.status(400).json({message: "enter a valid category"});
        }
        if(!newPass.name || !newPass.category || !newPass.imageUrl || !newPass.price || !newPass.dateTime || !newPass.venue || !newPass.quantity || newPass.isNegotiable === undefined || !newPass.user){
            return res.status(400).json({message: "enter all required fields"});
        }
        // Validate imageUrl to prevent SSRF/XSS vectors
        try {
            const parsedUrl = new URL(newPass.imageUrl);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                return res.status(400).json({ message: "Invalid image URL protocol" });
            }
        } catch (e) {
            return res.status(400).json({ message: "Invalid image URL format" });
        }
        if(!newPass.venue.area || !newPass.venue.city || !newPass.venue.state){
            return res.status(400).json({message: "enter all required fields in venue"});
        }
        await newPass.save();
        res.status(201).json({
            message: "Pass added successfully",
            pass: newPass
        });
    } catch (error) {
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