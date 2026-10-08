import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
let socket = null;
const onlineUsers = new Set();
const joinedConversations = new Set();

export function connectSocket() {
  const token = localStorage.getItem("ltf_token");
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) { socket.auth = { token }; socket.connect(); return socket; }

  socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
  socket.on("connect", async () => {
    console.log("Socket.IO connected:", socket.id);
    const rooms = [...joinedConversations];
    joinedConversations.clear();
    for (const conversationId of rooms) {
      try {
        await joinConversation(conversationId);
      } catch (error) {
        console.error("Failed to rejoin conversation:", error.message);
      }
    }
  });
  socket.on("connect_error", (error) => console.error("Socket.IO connection error:", error.message));
  socket.on("presenceSnapshot", ({ onlineUserIds = [] }) => { onlineUsers.clear(); onlineUserIds.forEach((id) => onlineUsers.add(String(id))); });
  socket.on("userOnline", ({ userId }) => onlineUsers.add(String(userId)));
  socket.on("userOffline", ({ userId }) => onlineUsers.delete(String(userId)));
  socket.on("disconnect", (reason) => console.log("Socket.IO disconnected:", reason));
  return socket;
}

export function getSocket() { return socket; }
export function isUserOnline(userId) { return Boolean(userId && onlineUsers.has(String(userId))); }
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  onlineUsers.clear();
  joinedConversations.clear();
}

function ensureConnected(activeSocket) {
  if (activeSocket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onConnect = () => { cleanup(); resolve(); };
    const onError = (error) => { cleanup(); reject(error); };
    const cleanup = () => { activeSocket.off("connect", onConnect); activeSocket.off("connect_error", onError); };
    activeSocket.once("connect", onConnect);
    activeSocket.once("connect_error", onError);
  });
}

export async function joinConversation(conversationId) {
  const normalizedId = String(conversationId || "");
  if (!normalizedId) throw new Error("Conversation ID is required.");
  if (joinedConversations.has(normalizedId) && socket?.connected) return { success: true, alreadyJoined: true };

  const activeSocket = socket || connectSocket();
  if (!activeSocket) throw new Error("Socket is not available.");
  await ensureConnected(activeSocket);

  return new Promise((resolve, reject) => {
    activeSocket.emit("joinConversation", { conversationId: normalizedId }, (response) => {
      if (!response?.success) return reject(new Error(response?.message || "Failed to join conversation."));
      joinedConversations.add(normalizedId);
      resolve(response);
    });
  });
}

export async function sendSocketMessage(conversationId, text, replyTo = null) {
  const activeSocket = socket || connectSocket();
  if (!activeSocket) throw new Error("Socket is not available.");
  await ensureConnected(activeSocket);
  if (!joinedConversations.has(String(conversationId))) {
    await joinConversation(conversationId);
  }
  return new Promise((resolve, reject) => {
    activeSocket.emit("sendMessage", { conversationId, text, replyTo: replyTo?.id || replyTo || null }, (response) => {
      if (!response?.success) return reject(new Error(response?.message || "Failed to send message."));
      resolve(response.data);
    });
  });
}

export function markConversationReadRealtime(conversationId) {
  if (!socket?.connected) return;
  socket.emit("markConversationRead", { conversationId });
}
