import User from "../models/User.js";
import Report from "../models/Report.js";

export const getAdminSummary = async (req, res) => {
  try {
    const [pendingReports, users, suspendedUsers] = await Promise.all([
      Report.countDocuments({ status: "pending" }),
      User.countDocuments(),
      User.countDocuments({ accountStatus: "suspended" }),
    ]);
    return res.status(200).json({ pendingReports, users, suspendedUsers });
  } catch (error) {
    console.error("Admin summary error:", error);
    return res.status(500).json({ message: "Failed to load admin summary." });
  }
};
