import { findMatches } from "./matching";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeaders() });
export function authHeaders() {
  const token = localStorage.getItem("ltf_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("ltf_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.userId || payload.id || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options.body instanceof FormData ? { ...authHeaders(), ...(options.headers || {}) } : { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new CustomEvent("ltf:unauthorized"));
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

// Auth
export async function login({ email, password }) { return request("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); }
export async function signup({ email, password }) { return request("/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: email.split("@")[0], email, password }) }); }
export async function verifyEmail(token) { return request("/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }); }
export async function resendVerificationEmail(email) { return request("/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); }
export async function loginWithGoogle(credential) { return request("/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) }); }
export async function sendPasswordReset(email) { if (!email) throw new Error("Enter your email address."); return request("/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); }
export async function resetPassword(token, newPassword) { return request(`/auth/reset-password/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) }); }
export async function sendOtp(phone) { return request("/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) }); }
export async function verifyOtp(code) { return request("/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }); }

// Items
function normalizeItem(raw) {
  if (!raw) return raw;
  const reporter = raw.reportedBy && typeof raw.reportedBy === "object" ? raw.reportedBy : null;
  const reporterId = reporter?._id || raw.reportedBy;
  return {
    ...raw,
    id: raw._id || raw.id,
    reportedBy: reporterId,
    reporterName: reporter?.displayName || reporter?.name || "Unknown",
    reporterUsername: reporter?.username || null,
    reporterAvatarUrl: reporter?.avatarUrl || null,
    reporterHonorScore: reporter?.honorScore,
    verificationQuestions: raw.verificationQuestions || [],
  };
}

export async function getItems({ itemKind, query, sortBy, fromDate, toDate, nearCoords, maxDistanceKm, limit } = {}) {
  const params = new URLSearchParams();
  if (itemKind) params.set("itemKind", itemKind);
  if (query) params.set("query", query);
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (limit !== undefined) params.set("limit", String(limit));
  if (nearCoords) { params.set("lat", nearCoords.lat); params.set("lng", nearCoords.lng); if (maxDistanceKm !== undefined) params.set("maxDistanceKm", maxDistanceKm); }
  const data = await request(`/items?${params.toString()}`);
  let results = (data.items || []).map(normalizeItem);
  if (!nearCoords && sortBy === "oldest") results = [...results].reverse();
  if (query?.trim()) {
    const key = "ltf_recent_searches";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    const next = [query.trim(), ...current.filter((x) => x.toLowerCase() !== query.trim().toLowerCase())].slice(0, 5);
    localStorage.setItem(key, JSON.stringify(next));
  }
  return results;
}
export async function getItemById(id) { const data = await request(`/items/${id}`); return normalizeItem(data.item); }
export async function getPotentialMatches(id) { const [item, allItems] = await Promise.all([getItemById(id), getItems({})]); return findMatches(item, allItems); }
export async function reportItem(payload) { const data = await request("/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); return normalizeItem(data.item); }
export async function markItemReturned(itemId) { const data = await request(`/items/${itemId}/returned`, { method: "PATCH" }); return normalizeItem(data.item); }

// Claims
export async function createClaim(itemId, answers) { const data = await request(`/claims/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) }); return data.claim; }
export async function getMyClaimForItem(itemId) { const data = await request(`/claims/my/${itemId}`); return data.claim || null; }
export async function reviewClaim(claimId, status) { const data = await request(`/claims/${claimId}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); return data.claim; }
export async function getClaimsForItem(itemId) { const data = await request(`/claims/item/${itemId}`); return { claims: data.claims || [] }; }

// Profile
export async function getProfile() { const data = await request("/profile"); return data.user; }
export async function getUserProfile(userId) { const data = await request(`/profile/public/${userId}`); return data.user; }
export async function checkUsernameAvailable(username, currentUsername) {
  const normalized = username.trim().toLowerCase();
  if (!normalized || normalized === currentUsername?.toLowerCase()) return true;
  const data = await request(`/profile/username/${encodeURIComponent(normalized)}`);
  return data.available;
}
export async function updateProfile(updates) { const data = await request("/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) }); return data.user; }
export async function updateNotificationPrefs(prefs) { const data = await request("/profile/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) }); return data.notificationPrefs; }

// Blocks
export async function getBlockedUsers() { const data = await request("/blocks"); return data.users || []; }
export async function blockUser(userId) { return request(`/blocks/${userId}`, { method: "POST" }); }
export async function unblockUser(userId) { return request(`/blocks/${userId}`, { method: "DELETE" }); }

// Chat
export async function createConversation(userId, relatedItem = null) {
  const data = await request("/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, relatedItem }) });
  return data.conversation;
}

export async function getChats() {
  const data = await request("/chat");
  const currentUserId = getCurrentUserId();
  return (data.conversations || []).map((conversation) => {
    const otherUser = conversation.participants?.find((p) => String(p._id) !== String(currentUserId));
    return {
      id: conversation._id,
      name: otherUser?.displayName || otherUser?.name || otherUser?.username || "User",
      preview: conversation.lastMessage?.text || (conversation.relatedItem ? `Conversation about ${conversation.relatedItem.name || "an item"}` : "No messages yet"),
      unread: conversation.unreadCount || 0,
      avatarUrl: otherUser?.avatarUrl || null,
      relatedItem: conversation.relatedItem || null,
      participantId: otherUser?._id,
      online: false,
      blocked: conversation.blocked,
    };
  });
}

export async function markMessagesAsRead(conversationId) { return request(`/chat/${conversationId}/read`, { method: "PATCH" }); }

export async function getChatById(chatId) {
  const currentUserId = getCurrentUserId();
  const [conversationsData, messagesData] = await Promise.all([request("/chat"), request(`/chat/${chatId}/messages`)]);
  const conversation = (conversationsData.conversations || []).find((item) => String(item._id) === String(chatId));
  if (!conversation) throw new Error("Conversation not found.");
  const otherUser = conversation.participants?.find((p) => String(p._id) !== String(currentUserId));
  const normalizeReply = (reply) => reply ? { id: reply._id, text: reply.text, sender: reply.sender?.displayName || reply.sender?.name || "User" } : null;
  const messages = (messagesData.messages || []).map((message) => ({
    id: message._id,
    sender: String(message.sender?._id || message.sender) === String(currentUserId) ? "me" : "other",
    senderId: message.sender?._id || message.sender,
    text: message.text,
    time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: message.createdAt,
    read: message.read,
    replyTo: normalizeReply(message.replyTo),
  }));
  let online = false;
  try { online = (await import("./socket")).isUserOnline(otherUser?._id); } catch {}
  return { id: conversation._id, participantId: otherUser?._id, name: otherUser?.displayName || otherUser?.name || otherUser?.username || "User", online, relatedItemId: conversation.relatedItem?._id || null, messages };
}

export async function startChatAboutItem(item, messageText, replyTo = null) {
  if (!messageText?.trim()) throw new Error("Write a message before sending.");
  const conversation = await createConversation(item.reportedBy, item.id);
  const { sendSocketMessage, connectSocket } = await import("./socket");
  connectSocket();
  const message = await sendSocketMessage(conversation._id, messageText.trim(), replyTo);
  return { id: conversation._id, message };
}

export async function sendMessage(chatId, text, replyTo = null) {
  const { sendSocketMessage } = await import("./socket");
  return sendSocketMessage(chatId, text, replyTo);
}

// Reports / reviews
export async function reportUser(userId, payload) { const data = await request(`/reports/user/${userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); return data.report; }
export async function reportItemAbuse(itemId, payload) { const data = await request(`/reports/item/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); return data.report; }
export async function reportMessage(messageId, payload) { const data = await request(`/reports/message/${messageId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); return data.report; }
export async function submitReview(userId, payload) { const data = await request(`/reviews/${userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); return data.review; }

// Notifications
export async function getNotifications() { return request("/notifications"); }
export async function markNotificationRead(id) { return request(`/notifications/${id}/read`, { method: "PATCH" }); }
export async function markAllNotificationsRead() { return request("/notifications/read-all", { method: "PATCH" }); }

// Admin
export async function getAdminSummary() { return request("/admin/summary"); }
export async function getAdminReports(status = "pending") { const data = await request(`/reports/admin?status=${encodeURIComponent(status)}`); return data.reports || []; }
export async function reviewAdminReport(reportId, payload) { const data = await request(`/reports/admin/${reportId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); return data.report; }

// Local UI helpers
export async function getRecentSearches() { return JSON.parse(localStorage.getItem("ltf_recent_searches") || "[]"); }
export async function clearRecentSearches() { localStorage.removeItem("ltf_recent_searches"); return []; }
export async function contactSupport() {
  const supportUserId = import.meta.env.VITE_SUPPORT_USER_ID;
  if (!supportUserId) throw new Error("Support chat is not configured yet.");
  return createConversation(supportUserId);
}
