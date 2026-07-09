import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { createTicket } from "../controllers/ticket/ticket.controller.js";

const router = express.Router();

router.post("/", authenticate, createTicket);

export default router;
