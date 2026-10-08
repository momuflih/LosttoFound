import mongoose from "mongoose";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import { recalculateHonor } from "../utils/honor.js";
import { createNotification } from "../utils/notifications.js";

const reasons = [
  "Asked for money or a payment to return an item",
  "Asked for OTP, password, or other sensitive info",
  "Suspicious or threatening behavior",
  "Item description didn't match what they said",
  "Other",
];

export const createUserReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, details = "" } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID." });
    if (userId.toString() === req.userId.toString()) return res.status(400).json({ message: "You cannot report yourself." });
    if (!reasons.includes(reason)) return res.status(400).json({ message: "Please select a valid report reason." });
    if (String(details).length > 2000) return res.status(400).json({ message: "Report details are too long." });
    const target = await User.findById(userId).select("_id");
    if (!target) return res.status(404).json({ message: "User not found." });
    const recent = await Report.findOne({ reporter: req.userId, targetType: "user", targetUser: userId, status: "pending" });
    if (recent) return res.status(409).json({ message: "You already have a pending report for this user." });
    const report = await Report.create({ reporter: req.userId, targetType: "user", targetUser: userId, reason, details });
    return res.status(201).json({ message: "Report submitted successfully.", report });
  } catch (error) {
    console.error("Create user report error:", error);
    return res.status(500).json({ message: "Failed to submit report." });
  }
};

export const createItemReport = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { reason, details = "" } = req.body;
    if (!mongoose.Types.ObjectId.isValid(itemId)) return res.status(400).json({ message: "Invalid item ID." });
    if (!reason?.trim()) return res.status(400).json({ message: "Report reason is required." });
    const item = await Item.findById(itemId).select("reportedBy name");
    if (!item) return res.status(404).json({ message: "Item not found." });
    const report = await Report.create({ reporter: req.userId, targetType: "item", targetItem: itemId, reason: reason.trim().slice(0, 200), details: String(details).slice(0, 2000) });
    return res.status(201).json({ message: "Item report submitted successfully.", report });
  } catch (error) {
    console.error("Create item report error:", error);
    return res.status(500).json({ message: "Failed to submit item report." });
  }
};

export const createMessageReport = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason, details = "" } = req.body;
    if (!mongoose.Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: "Invalid message ID." });
    if (!reason?.trim()) return res.status(400).json({ message: "Report reason is required." });
    const Message = (await import("../models/Message.js")).default;
    const message = await Message.findById(messageId).populate("conversation");
    if (!message) return res.status(404).json({ message: "Message not found." });
    if (!message.conversation.participants.some((p) => p.toString() === req.userId.toString())) return res.status(403).json({ message: "You are not part of this conversation." });
    const report = await Report.create({ reporter: req.userId, targetType: "message", targetMessage: messageId, reason: reason.trim().slice(0, 200), details: String(details).slice(0, 2000) });
    return res.status(201).json({ message: "Message report submitted successfully.", report });
  } catch (error) {
    console.error("Create message report error:", error);
    return res.status(500).json({ message: "Failed to submit message report." });
  }
};

export const listReports = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const allowed = ["pending", "reviewed", "dismissed", "actioned", "all"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid report status." });
    const filter = status === "all" ? {} : { status };
    const reports = await Report.find(filter)
      .populate("reporter", "name displayName username email")
      .populate("targetUser", "name displayName username email status honorScore")
      .populate("targetItem", "name itemKind status reportedBy")
      .populate("targetMessage", "text sender conversation createdAt")
      .populate("reviewedBy", "name displayName email")
      .sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ reports });
  } catch (error) {
    console.error("List reports error:", error);
    return res.status(500).json({ message: "Failed to load reports." });
  }
};

export const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes = "", suspendUser = false } = req.body;
    if (!mongoose.Types.ObjectId.isValid(reportId)) return res.status(400).json({ message: "Invalid report ID." });
    if (!["reviewed", "dismissed", "actioned"].includes(status)) return res.status(400).json({ message: "Invalid moderation status." });
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found." });

    report.status = status;
    report.adminNotes = String(adminNotes).slice(0, 2000);
    report.reviewedBy = req.userId;
    report.reviewedAt = new Date();
    await report.save();

    const io = req.app.get("io");
    if (report.targetType === "user" && report.targetUser) {
      if (suspendUser) {
        await User.findByIdAndUpdate(report.targetUser, { accountStatus: "suspended" });
      }
      if (status === "actioned") await recalculateHonor(report.targetUser);
      await createNotification({ io, recipient: report.targetUser, type: "reportAction", title: "A moderation report was reviewed", message: suspendUser ? "Your account has been suspended after a moderation review." : "A report involving your account has been reviewed by the moderation team.", link: "/settings" });
    }

    if (report.targetType === "item" && report.targetItem && status === "actioned") {
      const item = await Item.findById(report.targetItem);
      if (item) {
        item.status = "closed";
        await item.save();
        await createNotification({ io, recipient: item.reportedBy, type: "reportAction", title: "Item moderated", message: `Your item ${item.name} was closed after a moderation review.`, link: `/items/${item._id}` });
      }
    }

    return res.status(200).json({ message: "Report reviewed successfully.", report });
  } catch (error) {
    console.error("Review report error:", error);
    return res.status(500).json({ message: "Failed to review report." });
  }
};
