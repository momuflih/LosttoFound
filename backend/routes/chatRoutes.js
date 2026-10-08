import express from "express";
import { createConversation, getMyConversations, getMessages, sendMessage, markMessagesAsRead } from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/", authMiddleware, createConversation);
router.get("/", authMiddleware, getMyConversations);
router.get("/:conversationId/messages", authMiddleware, getMessages);
router.patch("/:conversationId/read", authMiddleware, markMessagesAsRead);
router.post("/:conversationId/messages", authMiddleware, sendMessage);
export default router;
