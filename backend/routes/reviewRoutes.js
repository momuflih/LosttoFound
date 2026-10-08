import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createReview } from "../controllers/reviewController.js";

const router = express.Router();
router.post("/:userId", authMiddleware, createReview);
export default router;
