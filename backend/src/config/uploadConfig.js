/**
 * Centralized upload configuration constants.
 * Single source of truth consumed by Multer middleware and Cloudinary utilities.
 */
export const UPLOAD_CONFIG = Object.freeze({
    /** Maximum number of images per multi-image upload */
    MAX_IMAGES: 5,

    /** Maximum file size in bytes (5 MB) */
    MAX_FILE_SIZE: 5 * 1024 * 1024,

    /** Allowed MIME types for image uploads */
    ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],

    /** Allowed file extensions (lowercase, with dot prefix) */
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],

    /** Cloudinary transformation presets applied to every upload */
    CLOUDINARY_TRANSFORM: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
    ]
});
