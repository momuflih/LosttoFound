import mongoose from "mongoose";
import User from "../models/User.js";

const publicUser = (user) => {
  const name = user.displayName || user.name || "User";
  return { id: user._id, name, username: user.username || "", location: user.location || "", avatarUrl: user.avatarUrl || "", avatarInitials: name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() };
};

export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("blockedUsers", "name displayName username location avatarUrl");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ users: (user.blockedUsers || []).map(publicUser) });
  } catch (error) {
    console.error("Get blocked users error:", error);
    return res.status(500).json({ message: "Failed to load blocked users." });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID." });
    if (userId.toString() === req.userId.toString()) return res.status(400).json({ message: "You cannot block yourself." });
    const [me, other] = await Promise.all([User.findById(req.userId), User.findById(userId)]);
    if (!other) return res.status(404).json({ message: "User not found." });
    if (!me.blockedUsers.some((id) => id.toString() === userId.toString())) me.blockedUsers.push(userId);
    await me.save();
    return res.status(200).json({ message: "User blocked successfully." });
  } catch (error) {
    console.error("Block user error:", error);
    return res.status(500).json({ message: "Failed to block user." });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID." });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== userId.toString());
    await user.save();
    return res.status(200).json({ message: "User unblocked successfully." });
  } catch (error) {
    console.error("Unblock user error:", error);
    return res.status(500).json({ message: "Failed to unblock user." });
  }
};
