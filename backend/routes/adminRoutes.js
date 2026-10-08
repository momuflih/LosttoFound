import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { getAdminSummary } from "../controllers/adminController.js";

const router = express.Router();
router.get("/summary", authMiddleware, adminMiddleware, getAdminSummary);
export default router;
