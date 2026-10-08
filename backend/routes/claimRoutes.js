import express from "express";
import { createClaim, reviewClaim, getClaimsForItem, getMyClaimForItem } from "../controllers/claimController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/:itemId", authMiddleware, createClaim);
router.get("/my/:itemId", authMiddleware, getMyClaimForItem);
router.get("/item/:itemId", authMiddleware, getClaimsForItem);
router.patch("/:claimId/review", authMiddleware, reviewClaim);
export default router;
