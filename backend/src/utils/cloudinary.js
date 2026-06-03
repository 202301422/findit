import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

dotenv.config();

// Ensure required environment variables are present
const requiredEnv = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.error(`[CRITICAL] Missing required environment variable: ${key}`);
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Enforce HTTPS globally
});

/**
 * Safely extracts Cloudinary public ID from a URL.
 * Handles folder paths, version prefixes (e.g. v1717412345), and file extensions.
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} The public ID or null if parsing fails
 */
export const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    try {
        // Match everything after '/upload/' discarding version tag (v followed by digits) and file extension
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
        return match ? match[1] : null;
    } catch (error) {
        console.error("[ERROR] Failed to parse public ID from URL:", error.message);
        return null;
    }
};

/**
 * Uploads a file to Cloudinary. Supports both memory buffer streams and local file paths.
 * Applies production optimizations (auto compression, auto format conversion, width limitation).
 * @param {Buffer|string} fileInput - The file buffer or local path of the file to upload.
 * @param {string} folder - Destination folder under the Cloudinary namespace.
 * @returns {Promise<object|null>} Cloudinary upload response metadata or null if upload fails.
 */
export const uploadOnCloudinary = async (fileInput, folder = "findit/products") => {
    try {
        if (!fileInput) return null;

        const uploadOptions = {
            resource_type: "image",
            folder: folder,
            transformation: [
                { width: 1200, height: 1200, crop: "limit" }, // Protect against raw 4K images
                { quality: "auto" },                         // Automatic compression
                { fetch_format: "auto" }                     // Serve WebP/AVIF where supported
            ]
        };

        // Case A: Input is a string representing a local file path
        if (typeof fileInput === "string") {
            try {
                const response = await cloudinary.uploader.upload(fileInput, uploadOptions);
                // Async, non-blocking cleanup of the local file
                await fs.unlink(fileInput).catch((err) => 
                    console.error(`[WARNING] Failed to delete local temp file at ${fileInput}:`, err.message)
                );
                return response;
            } catch (error) {
                // Ensure local file cleanup even if the API upload fails
                await fs.unlink(fileInput).catch((err) => 
                    console.error(`[WARNING] Failed to clean up local temp file on upload failure:`, err.message)
                );
                throw error;
            }
        }

        // Case B: Input is a memory buffer
        if (Buffer.isBuffer(fileInput)) {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) {
                            console.error("[ERROR] Cloudinary stream upload failed:", error);
                            resolve(null);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(fileInput);
            });
        }

        console.error("[ERROR] Unsupported file input format passed to uploadOnCloudinary.");
        return null;
    } catch (error) {
        console.error("[ERROR] Exception in uploadOnCloudinary:", error.message);
        return null;
    }
};

/**
 * Deletes an asset from Cloudinary. Accepts either a public ID or full URL.
 * @param {string} publicIdOrUrl - The asset's public ID or full HTTP/HTTPS URL.
 * @returns {Promise<boolean>} True if deleted successfully or already gone; false on failure.
 */
export const deleteFromCloudinary = async (publicIdOrUrl) => {
    try {
        if (!publicIdOrUrl) return false;

        let publicId = publicIdOrUrl;
        if (publicIdOrUrl.startsWith("http://") || publicIdOrUrl.startsWith("https://")) {
            publicId = getPublicIdFromUrl(publicIdOrUrl);
        }

        if (!publicId) {
            console.warn(`[WARNING] Could not resolve publicId from input: ${publicIdOrUrl}`);
            return false;
        }

        const result = await cloudinary.uploader.destroy(publicId);

        if (result && result.result === "ok") {
            console.log(`[INFO] Asset '${publicId}' successfully deleted from Cloudinary.`);
            return true;
        } else if (result && result.result === "not_found") {
            console.warn(`[WARNING] Asset '${publicId}' not found on Cloudinary (possibly already deleted).`);
            return true; // Return true as the objective of removing the asset is met
        }

        console.warn(`[WARNING] Unexpected Cloudinary destruction status for '${publicId}':`, result);
        return false;
    } catch (error) {
        console.error(`[ERROR] Exception deleting asset '${publicIdOrUrl}' from Cloudinary:`, error.message);
        return false;
    }
};
