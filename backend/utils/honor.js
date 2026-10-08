import User from "../models/User.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";

export const recalculateHonor = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const reviews = await Review.find({ reviewee: userId }).select("rating").lean();
  const reports = await Report.countDocuments({
    targetUser: userId,
    status: "actioned",
  });

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 3;

  let score = 50;
  score += Math.min(user.stats?.itemsReturned || 0, 5) * 8;
  score += Math.min(user.stats?.itemsFound || 0, 5) * 2;
  score += (averageRating - 3) * 8;
  score += user.phoneVerified ? 5 : 0;
  score -= Math.min(reports, 5) * 12;

  score = Math.max(0, Math.min(100, Math.round(score)));

  user.honorScore = score;
  await user.save();

  return { user, honorScore: score };
};
