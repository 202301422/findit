import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import foundProductRoutes from "./src/routes/foundRoutes.js";
import passRoutes from "./src/routes/passRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/found-products", foundProductRoutes); 
app.use("/api/passes", passRoutes);
app.get("/", (req, res) => {
    res.send("FindIt API Running");
});

// Global error handling middleware to catch ApiErrors and format response as JSON
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Map Multer-specific errors (e.g. limit exceeded, file filter rejection) to 400 Bad Request
    if (err.name === "MulterError" || err.message.includes("MulterError") || err.message.includes("limit") || err.message.includes("Unsupported file type") || err.message.includes("Invalid file extension")) {
        statusCode = 400;
        message = err.message;
    }
    
    // Log errors for production monitoring (Winston/Pino etc.)
    console.error(`[ERROR] ${req.method} ${req.url} - Status ${statusCode}:`, err);
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });