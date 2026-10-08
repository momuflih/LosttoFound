import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getBlockedUsers, blockUser, unblockUser } from "../controllers/blockController.js";

const router = express.Router();
router.get("/", authMiddleware, getBlockedUsers);
router.post("/:userId", authMiddleware, blockUser);
router.delete("/:userId", authMiddleware, unblockUser);
export default router;
