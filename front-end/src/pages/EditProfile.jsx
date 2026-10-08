import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, X, Loader2 } from "lucide-react";
import Loader from "../components/Loader";
import { getProfile, updateProfile, checkUsernameAvailable } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB

export default function EditProfile() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState("");

  const [usernameState, setUsernameState] = useState("idle"); // idle | checking | available | taken | invalid
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const checkTimer = useRef(null);

  const load = () => {
    setLoading(true);
    setLoadError("");
    getProfile()
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName || p.name || "");
        setUsername(p.username || "");
        setStatus(p.status || "");
        setAvatarPreview(p.avatarUrl || null);
      })
      .catch((err) => setLoadError(err.message || "Couldn't load your profile."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!profile) return;
    if (username === profile.username) {
      setUsernameState("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
      setUsernameState(username ? "invalid" : "idle");
      return;
    }
    setUsernameState("checking");
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(username, profile.username);
      setUsernameState(available ? "available" : "taken");
    }, 450);
    return () => clearTimeout(checkTimer.current);
  }, [username, profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Display name can't be empty.");
      return;
    }
    if (usernameState === "taken" || usernameState === "invalid") {
      setError("Fix your username before saving.");
      return;
    }

    setBusy(true);
    try {
      const updated = await updateProfile({
        displayName: displayName.trim(),
        username,
        status: status.trim(),
        avatarUrl: avatarPreview,
      });
      updateUser(updated);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading..." />;
  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-red-500">{loadError}</p>
        <button
          onClick={load}
          className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Edit profile</h1>
      <p className="mt-1 text-sm text-gray-500">This is how other users will see you.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-semibold text-brand-700"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              profile.avatarInitials
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={20} className="text-white" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs font-medium text-brand-700 hover:underline"
          >
            Change photo
          </button>
          {avatarError && <p className="mt-1 text-xs text-red-500">{avatarError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alex Kumar"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">Shown on your posts and profile. Doesn't need to be unique.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="username"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-7 pr-9 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameState === "checking" && <Loader2 size={15} className="animate-spin text-gray-400" />}
              {usernameState === "available" && <Check size={15} className="text-brand-600" />}
              {(usernameState === "taken" || usernameState === "invalid") && <X size={15} className="text-red-500" />}
            </span>
          </div>
          <p className={`mt-1 text-xs ${usernameState === "taken" || usernameState === "invalid" ? "text-red-500" : "text-gray-400"}`}>
            {usernameState === "taken" && "That username is already taken."}
            {usernameState === "invalid" && "3-20 characters: letters, numbers, underscores only."}
            {usernameState === "available" && "Username is available."}
            {usernameState === "idle" && "Must be unique — this is how people find and @mention you."}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value.slice(0, 80))}
            placeholder="e.g. Looking for my grey backpack"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{status.length}/80</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
