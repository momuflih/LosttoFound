import express from "express";
import { signup, login, forgotPassword, resetPassword, googleLogin, sendOtp, verifyOtp, verifyEmail, resendVerificationEmail } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleLogin);
router.post("/send-otp", authMiddleware, sendOtp);
router.post("/verify-otp", authMiddleware, verifyOtp);
export default router;
