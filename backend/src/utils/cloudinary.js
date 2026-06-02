<<<<<<< HEAD
import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("ENV CHECK:", {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
    secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING"
});

=======
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

>>>>>>> uploading
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

<<<<<<< HEAD
        console.log("Uploading file:", localFilePath);

=======
>>>>>>> uploading
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

<<<<<<< HEAD
        console.log("Upload Success:", response.secure_url);
=======
        console.log("Cloudinary upload response:", response.url);
>>>>>>> uploading

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {
<<<<<<< HEAD
        console.log("Cloudinary Error Message:", error.message);
        console.log("Cloudinary Error Name:", error.name);
=======
        console.error("Error uploading to Cloudinary:", error);
>>>>>>> uploading

        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export const deleteFromCloudinary = async (publicId) => {
<<<<<<< HEAD
    try {
        if (!publicId) return;

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", result);

    } catch (error) {
        console.log("Delete Error:", error.message);
    }
};

export { uploadOnCloudinary };
=======
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
};

const getPublicIdFromUrl = (url) => {
    const parts = url.split("/");
    const file = parts.pop().split(".")[0];
    const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
    return `${folder}/${file}`;
};

export { uploadOnCloudinary };
>>>>>>> uploading
