import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            tls: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 5000
        });

        console.log("MongoDB connected");
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;