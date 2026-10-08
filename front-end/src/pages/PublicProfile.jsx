import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Star, Flag, CheckSquare, PackageSearch, Search } from "lucide-react";
import Loader from "../components/Loader";
import { getUserProfile, blockUser } from "../services/api";

export default function PublicProfile() {
  const { userId } = useParams(); const [profile, setProfile] = useState(null); const [blocked, setBlocked] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = () => { setLoading(true); setError(""); getUserProfile(userId).then(setProfile).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, [userId]);
  if (loading) return <Loader label="Loading profile..." />;
  if (error) return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-sm text-red-500">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm text-white">Try again</button></div>;
  if (!profile) return null;
  const avg = profile.reviews?.length ? (profile.reviews.reduce((s, r) => s + r.rating, 0) / profile.reviews.length).toFixed(1) : null;
  return <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
    <div className="flex flex-col items-center rounded-2xl border bg-white p-6 text-center shadow-card"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover"/> : profile.avatarInitials}</div><p className="mt-3 flex items-center gap-1.5 text-lg font-semibold">{profile.displayName || profile.name}<ShieldCheck size={16} className="text-brand-600"/></p>{profile.username && <p className="text-sm text-gray-400">@{profile.username}</p>}{profile.status && <p className="mt-1 text-sm italic text-gray-500">"{profile.status}"</p>}<p className="mt-1 text-sm text-gray-500">{profile.location || "Location not set"} · Member since {profile.memberSince}</p>{avg && <div className="mt-2 flex items-center gap-1 text-sm font-medium text-amber-600"><Star size={14} className="fill-amber-500 text-amber-500"/>{avg} ({profile.reviews.length} reviews)</div>}<div className="mt-4 flex flex-wrap justify-center gap-2"><Link to={`/review-user/${userId}`} className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white"><Star size={14}/> Review</Link><Link to={`/report-user/${userId}`} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600"><Flag size={14}/> Report</Link><button onClick={async () => { try { await blockUser(userId); setBlocked(true); } catch (e) { alert(e.message); } }} disabled={blocked} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700">{blocked ? "Blocked" : "Block"}</button></div></div>
    <div className="mt-4 rounded-2xl border bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Honor / Trust</p><p className="mt-1 text-lg font-semibold text-brand-700">{profile.honorScore}/100</p></div>
        <ShieldCheck size={22} className="text-brand-600"/>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={profile.honorScore}>
        <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${Math.max(0, Math.min(100, profile.honorScore || 0))}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-500">Based on successful returns, verified activity, reviews and community reports.</p>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3"><StatCard icon={CheckSquare} value={profile.stats.itemsReturned} label="Items Returned"/><StatCard icon={PackageSearch} value={profile.stats.itemsFound} label="Items Found"/><StatCard icon={Search} value={profile.stats.itemsLost} label="Items Lost"/></div>
    <div className="mt-4 rounded-2xl border bg-white p-6 shadow-card"><p className="mb-3 font-medium">Reviews</p>{!profile.reviews?.length ? <p className="text-sm text-gray-500">No reviews yet.</p> : <div className="space-y-3">{profile.reviews.map(r => <div key={r.id} className="rounded-lg bg-gray-50 p-3"><div className="flex justify-between"><p className="text-sm font-medium">{r.reviewer}</p><div className="flex">{Array.from({length:5},(_,i)=><Star key={i} size={12} className={i<r.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}/>)}</div></div><p className="mt-1 text-sm text-gray-600">{r.comment || "No comment"}</p><p className="mt-1 text-xs text-gray-400">{r.date}</p></div>)}</div>}</div>
  </div>;
}
function StatCard({icon:Icon,value,label}) { return <div className="flex flex-col items-center rounded-2xl border bg-white p-4 text-center shadow-card"><Icon size={18} className="text-brand-600"/><p className="mt-1 text-lg font-semibold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>; }
