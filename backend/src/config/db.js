import mongoose from "mongoose";
import dns from "node:dns";

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env file");
        }

        try {
            await mongoose.connect(process.env.MONGO_URI, {
                tls: true,
                serverSelectionTimeoutMS: 5000
            });
        } catch (firstError) {
            if (firstError.message && (firstError.message.includes("querySrv") || firstError.message.includes("ECONNREFUSED") || firstError.message.includes("ENOTFOUND"))) {
                console.warn("[MongoDB DNS Fallback]: Retrying connection with public DNS resolvers (8.8.8.8, 1.1.1.1)...");
                try {
                    dns.setServers(["8.8.8.8", "1.1.1.1"]);
                } catch (dnsErr) {
                    console.warn("[MongoDB DNS Warning]: Could not set custom DNS servers:", dnsErr.message);
                }
                await mongoose.connect(process.env.MONGO_URI, {
                    tls: true,
                    serverSelectionTimeoutMS: 10000
                });
            } else {
                throw firstError;
            }
        }

        console.log("MongoDB connected");
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;