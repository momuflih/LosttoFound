import express from "express";
import { getProfile, updateProfile, checkUsername, updateNotificationPrefs, getPublicProfile } from "../controllers/profileController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);
router.patch("/notifications", authMiddleware, updateNotificationPrefs);
router.get("/username/:username", authMiddleware, checkUsername);
router.get("/public/:userId", getPublicProfile);
export default router;
