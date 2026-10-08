import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import User from "./models/User.js";
import { createNotification } from "./utils/notifications.js";
import Notification from "./models/Notification.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import blockRoutes from "./routes/blockRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const httpServer = http.createServer(app);
const allowedOrigins = (process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:5174").split(",").map((x) => x.trim()).filter(Boolean);
const corsOptions = { origin: allowedOrigins, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] };
const io = new Server(httpServer, { cors: corsOptions });
app.set("io", io);

const onlineUsers = new Map();
const addOnline = (userId, socketId) => {
  const set = onlineUsers.get(userId) || new Set();
  const wasOffline = set.size === 0;
  set.add(socketId);
  onlineUsers.set(userId, set);
  return wasOffline;
};
const removeOnline = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) { onlineUsers.delete(userId); return true; }
  return false;
};

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required."));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) return next(new Error("Invalid authentication token."));
    socket.userId = decoded.userId.toString();
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Invalid or expired token."));
  }
});

io.on("connection", (socket) => {
  const userRoom = `user:${socket.userId}`;
  socket.join(userRoom);
  const firstConnection = addOnline(socket.userId, socket.id);
  socket.emit("presenceSnapshot", { onlineUserIds: [...onlineUsers.keys()] });
  if (firstConnection) socket.broadcast.emit("userOnline", { userId: socket.userId });
  console.log(`User connected: ${socket.userId} (${socket.id})`);

  socket.on("joinConversation", async (payload, callback = () => {}) => {
    try {
      const conversationId = typeof payload === "string" ? payload : payload?.conversationId;
      if (!mongoose.Types.ObjectId.isValid(conversationId)) return callback({ success: false, message: "Invalid conversation ID." });
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return callback({ success: false, message: "Conversation not found." });
      if (!conversation.participants.some((p) => p.toString() === socket.userId)) return callback({ success: false, message: "You are not a participant in this conversation." });
      socket.join(`conversation:${conversationId}`);
      callback({ success: true, message: "Joined conversation successfully." });
    } catch (error) {
      console.error("Join conversation error:", error);
      callback({ success: false, message: "Failed to join conversation." });
    }
  });

  socket.on("sendMessage", async ({ conversationId, text, replyTo = null }, callback = () => {}) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) return callback({ success: false, message: "Invalid conversation ID." });
      if (!text?.trim()) return callback({ success: false, message: "Message cannot be empty." });
      const trimmedText = text.trim();
      if (trimmedText.length > 2000) return callback({ success: false, message: "Message cannot exceed 2000 characters." });
      if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) return callback({ success: false, message: "Invalid reply message." });

      // One conversation lookup handles existence, membership, and active-state checks.
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
        status: "active",
      }).select("participants status").lean();
      if (!conversation) {
        const exists = await Conversation.exists({ _id: conversationId });
        return callback({
          success: false,
          message: exists ? "You are not a participant in this conversation or it is closed." : "Conversation not found.",
        });
      }

      const users = await User.find({ _id: { $in: conversation.participants } })
        .select("blockedUsers accountStatus name displayName username avatarUrl honorScore")
        .lean();
      const me = users.find((u) => u._id.toString() === socket.userId);
      const other = users.find((u) => u._id.toString() !== socket.userId);
      if (!me || !other || me.accountStatus === "suspended" || other.accountStatus === "suspended") {
        return callback({ success: false, message: "This conversation is unavailable." });
      }

      const blocked = (me.blockedUsers || []).some((id) => id.toString() === other._id.toString())
        || (other.blockedUsers || []).some((id) => id.toString() === me._id.toString());
      if (blocked) return callback({ success: false, message: "Messaging is blocked between these users." });

      let parent = null;
      if (replyTo) {
        parent = await Message.findOne({ _id: replyTo, conversation: conversationId })
          .select("_id text sender")
          .lean();
        if (!parent) return callback({ success: false, message: "Reply message not found in this conversation." });
      }

      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        text: trimmedText,
        replyTo: replyTo || null,
      });

      // Do not save the whole conversation document; only update the one field needed.
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { lastMessageAt: message.createdAt } }
      );

      // Populate the already-created document instead of querying Message again by _id.
      await message.populate("sender", "name displayName username avatarUrl honorScore");
      if (replyTo) {
        await message.populate({
          path: "replyTo",
          populate: { path: "sender", select: "name displayName username avatarUrl" },
        });
      }

      const messageData = message.toObject();
      io.to(`conversation:${conversationId}`).emit("newMessage", messageData);

      // Notification delivery must not hold up the Socket.IO acknowledgement.
      void createNotification({
        io,
        recipient: other._id,
        type: "message",
        title: "New message",
        message: trimmedText.slice(0, 120),
        link: `/messages/${conversationId}`,
        metadata: { conversationId: conversationId.toString() },
      }).catch((error) => {
        console.error("Socket message notification error:", error);
      });

      callback({ success: true, message: "Message sent successfully.", data: messageData });
    } catch (error) {
      console.error("Socket send message error:", error);
      callback({ success: false, message: "Failed to send message." });
    }
  });

  socket.on("markConversationRead", async ({ conversationId }, callback = () => {}) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) return callback({ success: false, message: "Invalid conversation ID." });
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some((p) => p.toString() === socket.userId)) return callback({ success: false, message: "Conversation unavailable." });
      await Message.updateMany({ conversation: conversationId, sender: { $ne: socket.userId }, read: false }, { $set: { read: true } });
      await Notification.updateMany({ recipient: socket.userId, type: "message", "metadata.conversationId": conversationId, read: false }, { $set: { read: true } });
      io.to(userRoom).emit("conversationRead", { conversationId });
      callback({ success: true });
    } catch (error) {
      console.error("Socket mark read error:", error);
      callback({ success: false, message: "Failed to mark conversation read." });
    }
  });

  socket.on("disconnect", () => {
    const becameOffline = removeOnline(socket.userId, socket.id);
    if (becameOffline) socket.broadcast.emit("userOffline", { userId: socket.userId });
    console.log(`User disconnected: ${socket.userId} (${socket.id})`);
  });
});

connectDB();
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => res.json({ ok: true, service: "LosttoFound API" }));
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ message: "Internal server error." });
});

const port = process.env.PORT || 5000;
httpServer.listen(port, () => console.log(`server running on port ${port}`));
