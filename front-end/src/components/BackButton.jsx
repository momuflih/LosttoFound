import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const HIDE_ON_EXACT = ["/"];
const HIDE_ON_PREFIX = ["/messages/", "/map"];

export default function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const hidden =
    HIDE_ON_EXACT.includes(location.pathname) || HIDE_ON_PREFIX.some((prefix) => location.pathname.startsWith(prefix));

  if (hidden) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="fixed left-4 top-[72px] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-premium ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:bg-brand-50 sm:left-6 sm:top-20"
    >
      <ArrowLeft size={18} />
    </button>
  );
}
