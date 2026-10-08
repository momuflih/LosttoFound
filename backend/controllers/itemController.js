import Item from "../models/Item.js";
import mongoose from "mongoose";
import Claim from "../models/Claim.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notifications.js";
import { recalculateHonor } from "../utils/honor.js";

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const safeItem = (item, includeAnswers = false) => {
  const obj = item.toObject ? item.toObject() : item;
  if (!includeAnswers && obj.verificationQuestions) {
    obj.verificationQuestions = obj.verificationQuestions.map((q) => ({ question: q.question }));
  }
  return obj;
};

export const createItem = async (req, res) => {
  try {
    const { itemKind, itemType, name, description, location, lat, lng, date, verificationQuestions } = req.body;
    if (!itemKind || !itemType || !name || !description || !location || lat === undefined || lng === undefined || !date) {
      return res.status(400).json({ message: "Please provide all required item details." });
    }
    if (!["lost", "found"].includes(itemKind)) return res.status(400).json({ message: "Item kind must be either lost or found." });
    const numericLat = Number(lat), numericLng = Number(lng), parsedDate = new Date(date);
    if (!Number.isFinite(numericLat) || numericLat < -90 || numericLat > 90 || !Number.isFinite(numericLng) || numericLng < -180 || numericLng > 180 || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid location or date." });
    }
    if (parsedDate > new Date()) return res.status(400).json({ message: "Item date cannot be in the future." });

    let questions = [];
    if (itemKind === "found") {
      if (!Array.isArray(verificationQuestions) || verificationQuestions.length < 1 || verificationQuestions.length > 5) return res.status(400).json({ message: "Found items require 1 to 5 verification questions." });
      questions = verificationQuestions.map((q) => ({ question: String(q.question || "").trim(), answer: String(q.answer || "").trim() }));
      if (questions.some((q) => !q.question || !q.answer || q.question.length > 200 || q.answer.length > 300)) return res.status(400).json({ message: "Each verification question and answer must be valid." });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.accountStatus === "suspended") return res.status(403).json({ message: "This account is suspended." });
    if (!user.phoneVerified) return res.status(403).json({ message: "Please verify your phone number before posting an item." });

    const item = await Item.create({ itemKind, itemType: itemType.trim(), name: name.trim(), description: description.trim(), location: location.trim(), lat: numericLat, lng: numericLng, date: parsedDate, reportedBy: req.userId, contactVerified: true, verificationQuestions: questions });
    if (itemKind === "found") user.stats.itemsFound += 1;
    else user.stats.itemsLost += 1;
    await user.save();
    await recalculateHonor(user._id);

    return res.status(201).json({ message: "Item reported successfully.", item: safeItem(item, true) });
  } catch (error) {
    console.error("Create item error:", error);
    return res.status(500).json({ message: "Failed to create item." });
  }
};

export const getItems = async (req, res) => {
  try {
    const { itemKind, query, lat, lng, maxDistanceKm, fromDate, toDate, limit } = req.query;
    const filter = { status: "open" };
    if (itemKind) {
      if (!["lost", "found"].includes(itemKind)) return res.status(400).json({ message: "Item kind must be either lost or found." });
      filter.itemKind = itemKind;
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) {
        const start = new Date(fromDate); if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "Invalid fromDate." });
        start.setHours(0, 0, 0, 0); filter.date.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate); if (Number.isNaN(end.getTime())) return res.status(400).json({ message: "Invalid toDate." });
        end.setHours(23, 59, 59, 999); filter.date.$lte = end;
      }
    }
    if (query?.trim()) {
      const q = query.trim();
      filter.$or = ["name", "description", "itemType", "location"].map((field) => ({ [field]: { $regex: q, $options: "i" } }));
    }
    const parsedLimit = limit === undefined ? null : Number(limit);
    if (parsedLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)) {
      return res.status(400).json({ message: "Invalid limit. Use a whole number between 1 and 100." });
    }

    let itemQuery = Item.find(filter)
      .select("itemKind itemType name description location lat lng date reportedBy contactVerified status matchedWith returnedAt createdAt updatedAt")
      .populate("reportedBy", "name displayName username avatarUrl honorScore")
      .sort({ date: -1 });

    if (parsedLimit !== null) itemQuery = itemQuery.limit(parsedLimit);

    const items = await itemQuery.lean();
    let results = items.map((item) => safeItem(item));
    if (lat !== undefined && lng !== undefined) {
      const userLat = Number(lat), userLng = Number(lng), maxDistance = maxDistanceKm === undefined ? null : Number(maxDistanceKm);
      if (!Number.isFinite(userLat) || !Number.isFinite(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) return res.status(400).json({ message: "Invalid latitude or longitude." });
      if (maxDistance !== null && (!Number.isFinite(maxDistance) || maxDistance < 0)) return res.status(400).json({ message: "Invalid maximum distance." });
      results = results.map((item) => ({ ...item, distanceKm: Number(calculateDistanceKm(userLat, userLng, item.lat, item.lng).toFixed(2)) })).filter((item) => maxDistance === null || item.distanceKm <= maxDistance).sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return res.status(200).json({ count: results.length, items: results });
  } catch (error) {
    console.error("Get items error:", error);
    return res.status(500).json({ message: "Failed to fetch items." });
  }
};

export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid item ID." });
    const item = await Item.findById(id).populate("reportedBy", "name displayName username avatarUrl honorScore");
    if (!item) return res.status(404).json({ message: "Item not found." });
    const viewerId = req.userId?.toString();
    const ownerId = item.reportedBy?._id?.toString() || item.reportedBy?.toString();
    return res.status(200).json({ item: safeItem(item, Boolean(viewerId && viewerId === ownerId)) });
  } catch (error) {
    console.error("Get item by ID error:", error);
    return res.status(500).json({ message: "Failed to fetch item." });
  }
};

export const markItemReturned = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid item ID." });
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found." });
    if (item.reportedBy.toString() !== req.userId.toString()) return res.status(403).json({ message: "Only the person who reported this item can mark it as returned." });
    if (!["open", "matched"].includes(item.status)) return res.status(400).json({ message: "This item cannot be marked as returned." });

    const approvedClaim = await Claim.findOne({ item: item._id, status: "approved" });
    if (!approvedClaim) return res.status(400).json({ message: "An approved claim is required before the item can be marked as returned." });

    item.status = "returned";
    item.returnedAt = new Date();
    await item.save();

    const reporter = await User.findById(item.reportedBy);
    if (reporter) { reporter.stats.itemsReturned += 1; await reporter.save(); }
    const honorResult = await recalculateHonor(item.reportedBy);
    const io = req.app.get("io");
    await createNotification({ io, recipient: approvedClaim.claimant, type: "itemReturned", title: "Item marked returned", message: `${item.name} has been marked as returned.`, link: `/items/${item._id}` });
    await createNotification({ io, recipient: item.reportedBy, type: "itemReturned", title: "Return recorded", message: `Your return of ${item.name} has been recorded.`, link: `/items/${item._id}` });
    return res.status(200).json({ message: "Item marked as returned successfully.", item: safeItem(item, true) });
  } catch (error) {
    console.error("Mark item returned error:", error);
    return res.status(500).json({ message: "Failed to mark item as returned." });
  }
};
