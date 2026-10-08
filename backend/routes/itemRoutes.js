import express from "express";
import { createItem, getItems, getItemById, markItemReturned } from "../controllers/itemController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/", authMiddleware, createItem);
router.get("/", getItems);
router.get("/:id", getItemById);
router.patch("/:id/returned", authMiddleware, markItemReturned);
export default router;
