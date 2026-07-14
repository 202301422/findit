import multer from "multer";
import path from "path";
import { UPLOAD_CONFIG } from "../config/uploadConfig.js";

// Use memoryStorage to avoid writing temporary files to disk, eliminating local disk leak vectors.
const storage = multer.memoryStorage();

// Limit file size using centralized configuration.
const limits = {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
};

// Validate MIME type and file extension to secure against malicious file uploads (e.g. XSS, remote shell execution).
const fileFilter = (req, file, cb) => {
    // 1. Validate MIME type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("Unsupported file type. Only JPEG, PNG, and WebP images are allowed."), false);
    }

    // 2. Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error("Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed."), false);
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    limits,
    fileFilter
});

/**
 * Express middleware that validates the number of uploaded files does not exceed
 * the configured maximum. Place this AFTER the multer middleware in the route chain.
 *
 * Works with both `upload.array()` (req.files is an array) and
 * `upload.fields()` (req.files is an object keyed by field name).
 *
 * @param {number} [max=UPLOAD_CONFIG.MAX_IMAGES] - Maximum allowed image count.
 * @returns {Function} Express middleware
 */
export const validateImageCount = (max = UPLOAD_CONFIG.MAX_IMAGES) => {
    return (req, res, next) => {
        let fileCount = 0;

        if (Array.isArray(req.files)) {
            // upload.array() case
            fileCount = req.files.length;
        } else if (req.files && typeof req.files === "object") {
            // upload.fields() case – sum all field arrays
            fileCount = Object.values(req.files).reduce(
                (sum, arr) => sum + arr.length,
                0
            );
        } else if (req.file) {
            // upload.single() case – always 1, always valid
            fileCount = 1;
        }

        if (fileCount > max) {
            const error = new Error(`Too many images. Maximum ${max} images allowed, received ${fileCount}.`);
            error.statusCode = 400;
            return next(error);
        }

        next();
    };
};
