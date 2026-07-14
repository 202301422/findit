/**
 * One-time migration script: FoundProduct imageUrl/imagePublicId -> images[]
 *
 * Converts legacy FoundProduct documents from:
 *   { imageUrl: "https://...", imagePublicId: "findit/..." }
 * to:
 *   { images: [{ url: "https://...", publicId: "findit/..." }] }
 *
 * Safe to run multiple times. Skips documents that already have the `images` array populated.
 *
 * Usage:
 *   node scripts/migrate-found-images.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("[FATAL] No MONGO_URI or MONGODB_URI found in environment variables.");
    process.exit(1);
}

async function migrate() {
    console.log("[MIGRATE] Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("[MIGRATE] Connected.");

    const db = mongoose.connection.db;
    const collection = db.collection("foundproducts");

    const legacyDocs = await collection.find({
        imageUrl: { $exists: true, $ne: null, $ne: "" },
        $or: [
            { images: { $exists: false } },
            { images: { $size: 0 } },
            { images: null }
        ]
    }).toArray();

    console.log(`[MIGRATE] Found ${legacyDocs.length} legacy FoundProduct documents to migrate.`);

    if (legacyDocs.length === 0) {
        console.log("[MIGRATE] No migration needed. All documents are up to date.");
        await mongoose.disconnect();
        return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const doc of legacyDocs) {
        const imageUrl = doc.imageUrl;
        const imagePublicId = doc.imagePublicId;

        if (!imageUrl) {
            console.warn(`[MIGRATE] Skipping document ${doc._id}: no imageUrl found.`);
            skipped++;
            continue;
        }

        const imageEntry = {
            url: imageUrl.startsWith("http://") ? imageUrl.replace("http://", "https://") : imageUrl,
            publicId: imagePublicId || ""
        };

        await collection.updateOne(
            { _id: doc._id },
            {
                $set: { images: [imageEntry] },
                $unset: { imageUrl: "", imagePublicId: "" }
            }
        );

        migrated++;
    }

    console.log(`[MIGRATE] Migration complete: ${migrated} migrated, ${skipped} skipped.`);
    await mongoose.disconnect();
    console.log("[MIGRATE] Disconnected from MongoDB.");
}

migrate().catch((err) => {
    console.error("[MIGRATE] Migration failed:", err);
    process.exit(1);
});
