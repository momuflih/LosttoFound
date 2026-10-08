import User from "../models/User.js";

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role accountStatus");
    if (!user) return res.status(401).json({ message: "User not found." });
    if (user.accountStatus === "suspended") {
      return res.status(403).json({ message: "This account is suspended." });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Failed to verify admin access." });
  }
};

export default adminMiddleware;
