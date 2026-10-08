import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { createUserReport, createItemReport, createMessageReport, listReports, reviewReport } from "../controllers/reportController.js";

const router = express.Router();
router.post("/user/:userId", authMiddleware, createUserReport);
router.post("/item/:itemId", authMiddleware, createItemReport);
router.post("/message/:messageId", authMiddleware, createMessageReport);
router.get("/admin", authMiddleware, adminMiddleware, listReports);
router.patch("/admin/:reportId", authMiddleware, adminMiddleware, reviewReport);
export default router;
