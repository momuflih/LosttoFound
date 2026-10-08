import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Flag, Star, Send, ShieldAlert, Copy, Reply, X, Check } from "lucide-react";
import Loader from "../components/Loader";
import { getChatById, markMessagesAsRead } from "../services/api";
import { joinConversation, getSocket, sendSocketMessage, markConversationReadRealtime } from "../services/socket";

const currentUserId = () => {
  try { const user = JSON.parse(localStorage.getItem("ltf_user") || "null"); return String(user?.id || user?._id || ""); } catch { return ""; }
};

const normalizeMessage = (message) => {
  const senderId = String(message.sender?._id || message.sender?.id || message.sender || "");
  const me = currentUserId();
  return {
    id: message._id || message.id,
    sender: senderId === me ? "me" : "other",
    senderId,
    text: message.text,
    time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: message.createdAt,
    read: message.read,
    replyTo: message.replyTo ? { id: message.replyTo._id || message.replyTo.id, text: message.replyTo.text, sender: message.replyTo.sender?.displayName || message.replyTo.sender?.name || "User" } : null,
  };
};

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    getChatById(id).then((data) => { if (alive) setChat(data); }).catch((err) => { if (alive) setError(err.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!chat?.id) return;
    markMessagesAsRead(chat.id).catch((err) => console.error("Failed to mark messages as read:", err.message));
    markConversationReadRealtime(chat.id);
  }, [chat?.id]);

  useEffect(() => {
    if (!chat?.id) return;
    let cancelled = false;
    joinConversation(chat.id).catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [chat?.id]);

  useEffect(() => {
    if (!chat?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      const normalized = normalizeMessage(message);
      if (!normalized.id) return;
      setChat((prev) => {
        if (!prev || String(prev.id) !== String(chat.id)) return prev;
        if (prev.messages.some((m) => String(m.id) === String(normalized.id))) return prev;
        return { ...prev, messages: [...prev.messages, normalized] };
      });
      if (normalized.sender !== "me") {
        markMessagesAsRead(chat.id).catch(() => {});
        markConversationReadRealtime(chat.id);
      }
    };

    const handlePresence = ({ userId }) => {
      if (String(userId) === String(chat.participantId)) setChat((prev) => ({ ...prev, online: true }));
    };
    const handleOffline = ({ userId }) => {
      if (String(userId) === String(chat.participantId)) setChat((prev) => ({ ...prev, online: false }));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userOnline", handlePresence);
    socket.on("userOffline", handleOffline);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userOnline", handlePresence);
      socket.off("userOffline", handleOffline);
    };
  }, [chat?.id, chat?.participantId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true); setError("");
    try {
      await sendSocketMessage(id, draft.trim(), replyingTo?.id || null);
      setDraft(""); setReplyingTo(null);
    } catch (err) { setError(err.message); } finally { setSending(false); }
  };

  const handleCopy = async (msg) => {
    try { await navigator.clipboard.writeText(msg.text); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 1500); } catch {}
  };

  if (loading) return <Loader label="Loading conversation..." />;
  if (error && !chat) return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-sm text-red-500">{error}</p><button onClick={() => navigate("/messages")} className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm text-white">Back to messages</button></div>;
  if (!chat) return null;

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-2xl flex-col px-4 py-4 sm:px-8">
      <div className="grid grid-cols-3 items-center border-b border-gray-100 pb-3">
        <div><button onClick={() => navigate("/messages")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span></button></div>
        <button onClick={() => navigate(`/u/${chat.participantId}`)} className="flex flex-col items-center hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{chat.name.charAt(0)}</div>
          <p className="mt-1 text-sm font-semibold text-gray-900">{chat.name}</p>
          <span className={`flex items-center gap-1 text-xs ${chat.online ? "text-brand-600" : "text-gray-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${chat.online ? "bg-brand-500" : "bg-gray-300"}`} />{chat.online ? "Online" : "Offline"}</span>
        </button>
        <div className="flex items-center justify-end gap-1"><button onClick={() => navigate("/")} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><Home size={18} /></button><button onClick={() => navigate(`/report-user/${chat.participantId}`)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><Flag size={18} /></button><button onClick={() => navigate(`/review-user/${chat.participantId}`)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><Star size={18} /></button></div>
      </div>
      {chat.relatedItemId && <button onClick={() => navigate(`/items/${chat.relatedItemId}`)} className="mx-auto mt-1 text-[11px] text-brand-700 hover:underline">View related item</button>}

      <div className="flex-1 overflow-y-auto pb-1 pr-1 pt-3">
        <div className="mb-4 flex justify-center"><div className="flex max-w-[90%] items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-center text-xs font-medium text-brand-700 ring-1 ring-brand-100"><ShieldAlert size={14} />Never share passwords, OTPs, or other sensitive credentials in chat.</div></div>
        {error && <p className="mb-3 text-center text-xs text-red-500">{error}</p>}
        <div className="space-y-4">
          {chat.messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "me" ? "rounded-br-sm bg-brand-700 text-white" : "rounded-bl-sm bg-gray-100 text-gray-800"}`}>
                {msg.replyTo && <div className={`mb-1.5 truncate rounded-lg border-l-2 px-2 py-1 text-xs ${msg.sender === "me" ? "border-white/50 bg-white/10 text-white/80" : "border-brand-400 bg-white/70 text-gray-600"}`}>{msg.replyTo.text}</div>}
                <p>{msg.text}</p>
                <p className={`mt-1 text-[10px] ${msg.sender === "me" ? "text-white/60" : "text-gray-400"}`}>{msg.time}</p>
              </div>
              <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-gray-400"><button onClick={() => handleCopy(msg)} className="flex items-center gap-1 hover:text-gray-600">{copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}{copiedId === msg.id ? "Copied" : "Copy"}</button><button onClick={() => setReplyingTo(msg)} className="flex items-center gap-1 hover:text-gray-600"><Reply size={11} /> Reply</button></div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {replyingTo && <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"><div className="flex min-w-0 items-center gap-1.5"><Reply size={12} /><span>Replying to:</span><span className="truncate italic">{replyingTo.text}</span></div><button onClick={() => setReplyingTo(null)}><X size={14} /></button></div>}
      <form onSubmit={handleSend} className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-4"><input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /><button type="submit" disabled={sending || !draft.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white disabled:opacity-50"><Send size={16} /></button></form>
    </div>
  );
}
