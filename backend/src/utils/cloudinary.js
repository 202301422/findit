import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("ENV CHECK:", {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
    secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING"
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log("Uploading file:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("Upload Success:", response.secure_url);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {
        console.log("Cloudinary Error Message:", error.message);
        console.log("Cloudinary Error Name:", error.name);

        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return;

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", result);

    } catch (error) {
        console.log("Delete Error:", error.message);
    }
};

export { uploadOnCloudinary };