import multer from "multer";
import path from "path";

// Use memoryStorage to avoid writing temporary files to disk, eliminating local disk leak vectors.
const storage = multer.memoryStorage();

// Limit file size to 5MB to prevent Denial of Service (DoS) attacks via memory exhaustion.
const limits = {
    fileSize: 5 * 1024 * 1024
};

// Validate MIME type and file extension to secure against malicious file uploads (e.g. XSS, remote shell execution).
const fileFilter = (req, file, cb) => {
    // 1. Validate MIME type
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Unsupported file type. Only JPEG, PNG, and WebP images are allowed."), false);
    }

    // 2. Validate file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return cb(new Error("Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed."), false);
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    limits,
    fileFilter
});
