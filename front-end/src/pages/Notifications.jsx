import React, { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api";
import { connectSocket, getSocket } from "../services/socket";
import Loader from "../components/Loader";

export default function Notifications() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); getNotifications().then((d) => setItems(d.notifications || [])).finally(() => setLoading(false)); };
  useEffect(load, []);
  useEffect(() => { const socket = getSocket() || connectSocket(); if (!socket) return; const onNotification = (n) => setItems((prev) => [n, ...prev.filter((x) => x._id !== n._id)]); socket.on("notification", onNotification); return () => socket.off("notification", onNotification); }, []);
  const navigate = useNavigate();
  const open = async (n) => { if (!n.read) { setItems((prev) => prev.map((x) => x._id === n._id ? { ...x, read: true } : x)); await markNotificationRead(n._id).catch(() => {}); } if (n.link) navigate(n.link); };
  const readAll = async () => { setItems((prev) => prev.map((x) => ({ ...x, read: true }))); await markAllNotificationsRead(); };
  return <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold text-gray-900">Notifications</h1><p className="mt-1 text-sm text-gray-500">Updates about your LosttoFound activity.</p></div><button onClick={readAll} className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"><Check size={14}/> Mark all read</button></div><div className="mt-6">{loading ? <Loader/> : items.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center"><Bell className="mx-auto text-gray-300"/><p className="mt-2 text-sm text-gray-500">You're all caught up.</p></div> : <div className="space-y-2">{items.map((n) => <button key={n._id} onClick={() => open(n)} className={`w-full rounded-xl border p-4 text-left ${n.read ? "border-gray-100 bg-white" : "border-brand-100 bg-brand-50/50"}`}><div className="flex gap-3"><Bell size={18} className="mt-0.5 shrink-0 text-brand-600"/><div className="min-w-0 flex-1"><p className="font-medium text-gray-900">{n.title}</p><p className="mt-1 text-sm text-gray-600">{n.message}</p><p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p></div>{!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600"/>}</div></button>)}</div>}</div></div>;
}
