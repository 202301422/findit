import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    createTicket,
    getTicketById,
    updateTicket,
    deleteTicket
} from "../controllers/ticket/ticket.controller.js";

const router = express.Router();

router.post("/", authenticate, createTicket);
router.get("/:id", getTicketById);
router.put("/:id", authenticate, updateTicket);
router.delete("/:id", authenticate, deleteTicket);

export default router;
