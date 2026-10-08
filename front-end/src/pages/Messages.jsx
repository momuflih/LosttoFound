import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import Loader from "../components/Loader";
import { getChats } from "../services/api";
import { connectSocket, getSocket } from "../services/socket";

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getChats().then(setChats).catch((err) => console.error(err)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = getSocket() || connectSocket();
    if (!socket) return;
    const me = JSON.parse(localStorage.getItem("ltf_user") || "null");
    const meId = String(me?.id || me?._id || "");
    const handleNewMessage = (message) => {
      const conversationId = String(message.conversation?._id || message.conversation || "");
      const senderId = String(message.sender?._id || message.sender?.id || message.sender || "");
      setChats((prev) => prev.map((chat) => chat.id === conversationId ? { ...chat, preview: message.text, unread: senderId === meId ? chat.unread : chat.unread + 1 } : chat));
    };
    const handleRead = ({ conversationId }) => setChats((prev) => prev.map((chat) => chat.id === String(conversationId) ? { ...chat, unread: 0 } : chat));
    socket.on("newMessage", handleNewMessage); socket.on("conversationRead", handleRead);
    return () => { socket.off("newMessage", handleNewMessage); socket.off("conversationRead", handleRead); };
  }, []);

  return <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8"><h1 className="text-2xl font-semibold text-gray-900">Messages</h1><p className="mt-1 text-sm text-gray-500">Conversations with other LosttoFound users.</p><div className="mt-6">{loading ? <Loader /> : chats.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-16 text-center"><MessageCircle size={28} className="text-gray-300" /><p className="text-sm text-gray-500">No conversations yet.</p></div> : <ul className="space-y-2">{chats.map((chat) => <li key={chat.id}><Link to={`/messages/${chat.id}`} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-card hover:border-brand-200"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{chat.avatarUrl ? <img src={chat.avatarUrl} alt="" className="h-full w-full object-cover" /> : chat.name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="font-medium text-gray-900">{chat.name}</p><p className="truncate text-sm text-gray-500">{chat.preview}</p></div>{chat.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">{chat.unread}</span>}</Link></li>)}</ul>}</div></div>;
}
