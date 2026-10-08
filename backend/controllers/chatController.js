import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../utils/notifications.js";

const blocked = (a, b) =>
  a.blockedUsers?.some((id) => id.toString() === b.toString()) ||
  b.blockedUsers?.some((id) => id.toString() === a.toString());

const assertParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw Object.assign(new Error("Conversation not found."), { status: 404 });
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw Object.assign(
      new Error("You are not a participant in this conversation."),
      { status: 403 }
    );
  }

  return conversation;
};

const populateMessage = (message) =>
  Message.findById(message._id)
    .populate(
      "sender",
      "name displayName username avatarUrl honorScore"
    )
    .populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "name displayName username avatarUrl",
      },
    });

export const createConversation = async (req, res) => {
  try {
    const { userId, relatedItem = null } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "A valid user ID is required." });
    }

    if (userId.toString() === req.userId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot start a conversation with yourself." });
    }

    if (relatedItem && !mongoose.Types.ObjectId.isValid(relatedItem)) {
      return res.status(400).json({ message: "Invalid related item ID." });
    }

    const users = await User.find({
      _id: { $in: [req.userId, userId] },
    }).select(
      "name displayName username avatarUrl blockedUsers status accountStatus"
    );

    if (users.length !== 2) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentUser = users.find(
      (u) => u._id.toString() === req.userId.toString()
    );
    const otherUser = users.find(
      (u) => u._id.toString() === userId.toString()
    );

    if (
      currentUser.accountStatus === "suspended" ||
      otherUser.accountStatus === "suspended"
    ) {
      return res
        .status(403)
        .json({ message: "This account cannot start a conversation." });
    }

    if (blocked(currentUser, otherUser)) {
      return res.status(403).json({ message: "You cannot message this user." });
    }

    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.userId, userId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    });

    if (existingConversation) {
      return res.status(200).json({
        message: "Conversation already exists.",
        conversation: existingConversation,
      });
    }

    const conversation = await Conversation.create({
      participants: [req.userId, userId],
      relatedItem,
      status: "active",
    });

    return res.status(201).json({
      message: "Conversation created successfully.",
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to create conversation." });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    // One conversation query instead of running two Message queries
    // separately for every conversation.
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate(
        "participants",
        "name displayName username avatarUrl honorScore status blockedUsers"
      )
      .populate("relatedItem", "itemType name status")
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    if (conversations.length === 0) {
      return res.status(200).json({ conversations: [] });
    }

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    // Get the newest message for every conversation in one database query.
    const latestMessageRows = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$conversation",
          message: { $first: "$$ROOT" },
        },
      },
    ]);

    // Get all unread counts in one database query.
    const unreadRows = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          sender: { $ne: new mongoose.Types.ObjectId(req.userId) },
          read: false,
        },
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 },
        },
      },
    ]);

    const latestByConversation = new Map(
      latestMessageRows.map((row) => [
        row._id.toString(),
        row.message,
      ])
    );

    const unreadByConversation = new Map(
      unreadRows.map((row) => [row._id.toString(), row.count])
    );

    const result = conversations.map((conversation) => {
      const currentUser = conversation.participants.find(
        (participant) =>
          participant._id.toString() === req.userId.toString()
      );

      const otherUser = conversation.participants.find(
        (participant) =>
          participant._id.toString() !== req.userId.toString()
      );

      const blockedByEither =
        currentUser?.blockedUsers?.some(
          (id) => id.toString() === otherUser?._id.toString()
        ) ||
        otherUser?.blockedUsers?.some(
          (id) => id.toString() === currentUser?._id.toString()
        ) ||
        false;

      return {
        ...conversation,
        lastMessage:
          latestByConversation.get(conversation._id.toString()) || null,
        unreadCount:
          unreadByConversation.get(conversation._id.toString()) || 0,
        blocked: blockedByEither,
      };
    });

    return res.status(200).json({ conversations: result });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch conversations." });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID." });
    }

    const conversation = await assertParticipant(
      conversationId,
      req.userId
    );

    const participants = await User.find({
      _id: { $in: conversation.participants },
    }).select("blockedUsers accountStatus");

    if (participants.some((p) => p.accountStatus === "suspended")) {
      return res
        .status(403)
        .json({ message: "This conversation is unavailable." });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate(
        "sender",
        "name displayName username avatarUrl honorScore"
      )
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name displayName username avatarUrl",
        },
      })
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to fetch messages." });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const conversation = await assertParticipant(
      req.params.conversationId,
      req.userId
    );

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.userId },
        read: false,
      },
      { $set: { read: true } }
    );

    await Notification.updateMany(
      {
        recipient: req.userId,
        type: "message",
        "metadata.conversationId": conversation._id.toString(),
        read: false,
      },
      { $set: { read: true } }
    );

    const io = req.app.get("io");

    io
      ?.to(`user:${req.userId}`)
      .emit("conversationRead", {
        conversationId: conversation._id.toString(),
      });

    return res
      .status(200)
      .json({ message: "Messages marked as read." });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to mark messages as read." });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, replyTo = null } = req.body;

    const conversation = await assertParticipant(
      conversationId,
      req.userId
    );

    if (conversation.status !== "active") {
      return res
        .status(400)
        .json({ message: "This conversation is closed." });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    if (text.trim().length > 2000) {
      return res
        .status(400)
        .json({ message: "Message cannot exceed 2000 characters." });
    }

    if (
      replyTo &&
      !mongoose.Types.ObjectId.isValid(replyTo)
    ) {
      return res.status(400).json({ message: "Invalid reply message." });
    }

    const users = await User.find({
      _id: { $in: conversation.participants },
    }).select("blockedUsers");

    if (blocked(users[0], users[1])) {
      return res
        .status(403)
        .json({ message: "Messaging is blocked between these users." });
    }

    if (replyTo) {
      const parent = await Message.findOne({
        _id: replyTo,
        conversation: conversationId,
      });

      if (!parent) {
        return res
          .status(400)
          .json({ message: "Reply message not found in this conversation." });
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.userId,
      text: text.trim(),
      replyTo: replyTo || null,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await populateMessage(message);

    const otherId = conversation.participants.find(
      (participant) =>
        participant.toString() !== req.userId.toString()
    );

    const io = req.app.get("io");

    // Do not make the sender wait for notification creation.
    // The message response can return immediately after the message is saved.
    void createNotification({
      io,
      recipient: otherId,
      type: "message",
      title: "New message",
      message: text.trim().slice(0, 120),
      link: `/messages/${conversationId}`,
      metadata: {
        conversationId: conversationId.toString(),
      },
    }).catch((notificationError) => {
      console.error(
        "Create message notification error:",
        notificationError
      );
    });

    return res.status(201).json({
      message: "Message sent successfully.",
      data: populated,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to send message." });
  }
};
