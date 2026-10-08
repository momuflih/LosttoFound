import User from "../models/User.js";
import Review from "../models/Review.js";

const formatProfile = (user, { includeEmail = true } = {}) => {
  const displayName = user.displayName || user.name || "";
  const avatarInitials = displayName.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return {
    id: user._id,
    name: user.name,
    displayName: user.displayName || user.name,
    username: user.username || "",
    ...(includeEmail ? { email: user.email } : {}),
    phone: includeEmail ? user.phone || "" : "",
    phoneVerified: user.phoneVerified,
    location: user.location || "",
    status: user.status || "",
    avatarUrl: user.avatarUrl || "",
    avatarInitials,
    memberSince: user.createdAt ? user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "",
    honorScore: user.honorScore,
    role: user.role,
    stats: {
      itemsReturned: user.stats?.itemsReturned || 0,
      itemsFound: user.stats?.itemsFound || 0,
      itemsLost: user.stats?.itemsLost || 0,
    },
    notificationPrefs: user.notificationPrefs || {},
  };
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -phoneOtpHash -phoneOtpExpires -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user: formatProfile(user) });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { displayName, username, status, avatarUrl, location } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (displayName !== undefined) {
      if (!displayName.trim()) return res.status(400).json({ message: "Display name cannot be empty." });
      if (displayName.trim().length > 50) return res.status(400).json({ message: "Display name cannot exceed 50 characters." });
      user.displayName = displayName.trim();
    }
    if (username !== undefined) {
      const normalized = username.trim().toLowerCase();
      if (normalized && !/^[a-z0-9_]{3,20}$/.test(normalized)) return res.status(400).json({ message: "Username must be 3-20 characters and contain only letters, numbers and underscores." });
      if (normalized) {
        const existing = await User.findOne({ username: normalized, _id: { $ne: user._id } });
        if (existing) return res.status(409).json({ message: "That username is already taken." });
      }
      user.username = normalized;
    }
    if (status !== undefined) {
      if (String(status).length > 80) return res.status(400).json({ message: "Status cannot exceed 80 characters." });
      user.status = String(status).trim();
    }
    if (avatarUrl !== undefined) {
      if (String(avatarUrl).length > 2_000_000) return res.status(400).json({ message: "Avatar is too large." });
      user.avatarUrl = avatarUrl;
    }
    if (location !== undefined) user.location = String(location).trim().slice(0, 200);

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully.", user: formatProfile(user) });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const updateNotificationPrefs = async (req, res) => {
  try {
    const allowed = ["newMatches", "messages", "itemUpdates", "promotions"];
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    for (const key of allowed) if (req.body[key] !== undefined) user.notificationPrefs[key] = Boolean(req.body[key]);
    await user.save();
    return res.status(200).json({ notificationPrefs: user.notificationPrefs });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return res.status(500).json({ message: "Failed to update notification preferences." });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return res.status(400).json({ message: "Invalid username." });
    const existing = await User.findOne({ username, _id: { $ne: req.userId } });
    return res.status(200).json({ available: !existing });
  } catch (error) {
    console.error("Username check error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name displayName username location status avatarUrl createdAt honorScore stats phoneVerified role");
    if (!user) return res.status(404).json({ message: "User not found." });
    const reviews = await Review.find({ reviewee: user._id }).populate("reviewer", "name displayName username avatarUrl").sort({ createdAt: -1 }).limit(20).lean();
    const profile = formatProfile(user, { includeEmail: false });
    profile.reviews = reviews.map((review) => ({
      id: review._id,
      reviewer: review.reviewer?.displayName || review.reviewer?.name || "User",
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.createdAt).toLocaleDateString(),
    }));
    return res.status(200).json({ user: profile });
  } catch (error) {
    console.error("Get public profile error:", error);
    return res.status(500).json({ message: "Failed to load profile." });
  }
};
