import mongoose from "mongoose";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { recalculateHonor } from "../utils/honor.js";
import { createNotification } from "../utils/notifications.js";

export const createReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, comment = "" } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID." });
    if (userId.toString() === req.userId.toString()) return res.status(400).json({ message: "You cannot review yourself." });
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5." });
    if (String(comment).length > 1000) return res.status(400).json({ message: "Comment is too long." });
    const target = await User.findById(userId).select("name displayName");
    if (!target) return res.status(404).json({ message: "User not found." });
    const existing = await Review.findOne({ reviewer: req.userId, reviewee: userId });
    if (existing) return res.status(409).json({ message: "You have already reviewed this user." });

    const review = await Review.create({ reviewer: req.userId, reviewee: userId, rating: numericRating, comment: String(comment).trim() });
    const result = await recalculateHonor(userId);
    const io = req.app.get("io");
    await createNotification({ io, recipient: userId, type: "review", title: "You received a review", message: `Someone left you a ${numericRating}-star review.`, link: `/u/${userId}` });
    return res.status(201).json({ message: "Review submitted successfully.", review });
  } catch (error) {
    console.error("Create review error:", error);
    return res.status(500).json({ message: "Failed to submit review." });
  }
};
