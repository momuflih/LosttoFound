import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ShieldCheck, CheckSquare, PackageSearch, Search, Pencil, Settings as SettingsIcon } from "lucide-react";
import Loader from "../components/Loader";
import { getProfile } from "../services/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); setError(""); getProfile().then(setProfile).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  if (loading) return <Loader label="Loading profile..." />;
  if (error) return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-sm text-red-500">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm text-white">Try again</button></div>;
  if (!profile) return null;
  return <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
    <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">User Profile</h1><Link to="/profile/edit" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"><Pencil size={13}/> Edit profile</Link></div>
    <div className="mt-4 flex flex-col items-center rounded-2xl border bg-white p-6 text-center shadow-card"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover"/> : profile.avatarInitials}</div><p className="mt-3 flex items-center gap-1.5 text-lg font-semibold">{profile.displayName || profile.name}<ShieldCheck size={16} className="text-brand-600"/></p>{profile.username && <p className="text-sm text-gray-400">@{profile.username}</p>}{profile.status && <p className="mt-1 text-sm italic text-gray-500">"{profile.status}"</p>}<div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-gray-500"><span className="flex items-center gap-1"><MapPin size={14}/>{profile.location || "Location not set"}</span><span className="flex items-center gap-1"><Calendar size={14}/>Member since {profile.memberSince}</span></div></div>
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
    <Link to="/settings" className="mt-4 flex items-center justify-center gap-2 rounded-2xl border bg-white p-4 text-sm font-medium text-gray-700 shadow-card"><SettingsIcon size={16}/> Settings</Link>
  </div>;
}
function StatCard({ icon: Icon, value, label }) { return <div className="flex flex-col items-center rounded-2xl border bg-white p-4 text-center shadow-card"><Icon size={18} className="text-brand-600"/><p className="mt-1 text-lg font-semibold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>; }
