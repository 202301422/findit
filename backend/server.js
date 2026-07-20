import dns from "node:dns";
import dotenv from "dotenv";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

import http from "node:http";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import foundProductRoutes from "./src/routes/foundRoutes.js";
import passRoutes from "./src/routes/passRoutes.js";
import ticketRoutes from "./src/routes/ticketRoutes.js";
import sellRoutes from "./src/routes/sellRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import feedRoutes from "./src/routes/feedRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io setup ─────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[Socket] connected: ${socket.id}`);

  // Client joins its conversation room so it receives new_message events
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`[Socket] ${socket.id} joined room: ${conversationId}`);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] disconnected: ${socket.id}`);
  });
});

// ─── Express middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/found-products", foundProductRoutes);
app.use("/api/passes", passRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/sell-products", sellRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
    res.send("FindIt API Running");
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    if (err.name === "MulterError" || err.message.includes("MulterError") || err.message.includes("limit") || err.message.includes("Unsupported file type") || err.message.includes("Invalid file extension")) {
        statusCode = 400;
        message = err.message;
    }
    
    console.error(`[ERROR] ${req.method} ${req.url} - Status ${statusCode}:`, err);
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });