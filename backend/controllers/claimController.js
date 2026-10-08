import mongoose from "mongoose";
import Item from "../models/Item.js";
import Claim from "../models/Claim.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notifications.js";

export const createClaim = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { answers } = req.body;
    if (!mongoose.Types.ObjectId.isValid(itemId)) return res.status(400).json({ message: "Invalid item ID." });
    if (!Array.isArray(answers) || answers.length === 0) return res.status(400).json({ message: "Please provide answers to the verification questions." });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found." });
    if (item.itemKind !== "found") return res.status(400).json({ message: "Only found items can be claimed." });
    if (item.status !== "open") return res.status(400).json({ message: "This item is no longer available for claiming." });
    if (item.reportedBy.toString() === req.userId.toString()) return res.status(400).json({ message: "You cannot claim an item that you reported." });
    if (answers.length !== item.verificationQuestions.length) return res.status(400).json({ message: "Please answer all verification questions." });

    const normalizedAnswers = answers.map((answer, index) => {
      const expectedQuestion = item.verificationQuestions[index]?.question?.trim();
      return { question: answer.question?.trim(), answer: answer.answer?.trim(), expectedQuestion };
    });
    if (normalizedAnswers.some((a) => !a.question || !a.answer || a.question !== a.expectedQuestion)) {
      return res.status(400).json({ message: "The verification questions no longer match this item." });
    }

    const existing = await Claim.findOne({ item: itemId, claimant: req.userId });
    if (existing) return res.status(400).json({ message: "You have already submitted a claim for this item." });

    const claim = await Claim.create({ item: itemId, claimant: req.userId, answers: normalizedAnswers.map(({ question, answer }) => ({ question, answer })) });
    const claimant = await User.findById(req.userId).select("displayName name");
    const io = req.app.get("io");
    await createNotification({
      io,
      recipient: item.reportedBy,
      type: "claim",
      title: "New claim submitted",
      message: `${claimant?.displayName || claimant?.name || "Someone"} submitted a claim for ${item.name}.`,
      link: `/items/${item._id}`,
    });
    return res.status(201).json({ message: "Claim submitted successfully.", claim });
  } catch (error) {
    console.error("Create claim error:", error);
    return res.status(500).json({ message: "Failed to submit claim." });
  }
};

export const getMyClaimForItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) return res.status(400).json({ message: "Invalid item ID." });
    const claim = await Claim.findOne({ item: itemId, claimant: req.userId }).populate("item", "name status").lean();
    return res.status(200).json({ claim: claim || null });
  } catch (error) {
    console.error("Get my claim error:", error);
    return res.status(500).json({ message: "Failed to load your claim." });
  }
};

export const reviewClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(claimId)) return res.status(400).json({ message: "Invalid claim ID." });
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Status must be either approved or rejected." });

    const claim = await Claim.findById(claimId).populate("item");
    if (!claim) return res.status(404).json({ message: "Claim not found." });
    if (claim.status !== "pending") return res.status(400).json({ message: "This claim has already been reviewed." });
    if (claim.item.reportedBy.toString() !== req.userId.toString()) return res.status(403).json({ message: "Only the person who reported this item can review the claim." });

    claim.status = status;
    claim.reviewedAt = new Date();
    await claim.save();

    const io = req.app.get("io");
    await createNotification({
      io,
      recipient: claim.claimant,
      type: status === "approved" ? "claimApproved" : "claimRejected",
      title: status === "approved" ? "Claim approved" : "Claim rejected",
      message: status === "approved" ? `Your claim for ${claim.item.name} was approved.` : `Your claim for ${claim.item.name} was rejected.`,
      link: `/items/${claim.item._id}`,
    });

    return res.status(200).json({ message: status === "approved" ? "Claim approved successfully." : "Claim rejected successfully.", claim });
  } catch (error) {
    console.error("Review claim error:", error);
    return res.status(500).json({ message: "Failed to review claim." });
  }
};

export const getClaimsForItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) return res.status(400).json({ message: "Invalid item ID." });
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found." });
    if (item.reportedBy.toString() !== req.userId.toString()) return res.status(403).json({ message: "Only the person who reported this item can view its claims." });
    const claims = await Claim.find({ item: itemId }).populate("claimant", "name displayName username avatarUrl honorScore").sort({ createdAt: -1 });
    return res.status(200).json({ claims });
  } catch (error) {
    console.error("Get claims error:", error);
    return res.status(500).json({ message: "Failed to fetch claims." });
  }
};
