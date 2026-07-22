import dotenv from "dotenv";
dotenv.config();

import http from "node:http";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./src/config/db.js";
import User from "./src/models/user.model.js";
import Conversation from "./src/models/conversation.model.js";
import { generalApiRateLimiter } from "./src/middleware/security.middleware.js";

import authRoutes from "./src/routes/authRoutes.js";
import foundProductRoutes from "./src/routes/foundRoutes.js";
import passRoutes from "./src/routes/passRoutes.js";
import ticketRoutes from "./src/routes/ticketRoutes.js";
import sellRoutes from "./src/routes/sellRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import feedRoutes from "./src/routes/feedRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import userNotificationRoutes from "./src/routes/userNotificationRoutes.js";

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const parseBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/);

  return match ? match[1].trim() : null;
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || parseBearerToken(socket.handshake.headers.authorization);

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email accountStatus");

    if (!user || user.accountStatus !== "active") {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
    };

    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
};

const emitSocketError = (socket, ack, message, code = "SOCKET_FORBIDDEN") => {
  const payload = { success: false, message, code };

  if (typeof ack === "function") {
    ack(payload);
    return;
  }

  socket.emit("socket_error", payload);
};

const joinConversationRoom = async (socket, payload, ack) => {
  const conversationId = typeof payload === "string" ? payload : payload?.conversationId;

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    emitSocketError(socket, ack, "Invalid conversation ID", "INVALID_CONVERSATION_ID");
    return;
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: socket.data.user._id,
  }).select("_id participants");

  if (!conversation) {
    emitSocketError(socket, ack, "You are not a participant in this conversation", "NOT_A_PARTICIPANT");
    return;
  }

  socket.join(conversationId);

  if (typeof ack === "function") {
    ack({ success: true, conversationId });
  }
};

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io setup ─────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

io.use(authenticateSocket);

io.on("connection", (socket) => {
  console.log(`[Socket] connected: ${socket.id}`);

  // Client joins its conversation room so it receives new_message events
  socket.on("join_conversation", (payload, ack) => {
    void joinConversationRoom(socket, payload, ack);
  });

  socket.on("leave_conversation", (conversationId) => {
    if (typeof conversationId === "string" && mongoose.Types.ObjectId.isValid(conversationId)) {
      socket.leave(conversationId);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] disconnected: ${socket.id}`);
  });
});

// ─── Express middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(generalApiRateLimiter);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || "1mb" }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/found-products", foundProductRoutes);
app.use("/api/passes", passRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/sell-products", sellRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", userNotificationRoutes);

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