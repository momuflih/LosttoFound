import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ChevronRight, Wallet, Key, Backpack, Smartphone, IdCard, Package, Navigation } from "lucide-react";
import { formatDistance } from "../utils/geo";

const ICONS = {
  Wallet: Wallet,
  Keys: Key,
  Backpack: Backpack,
  Phone: Smartphone,
  "ID Card": IdCard,
};

function timeAgo(dateString) {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateString)) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function ItemCard({ item, layout = "row" }) {
  const Icon = ICONS[item.itemType] || Package;

  if (layout === "column") {
    return (
      <Link
        to={`/items/${item.id}`}
        className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Icon size={20} />
        </div>
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} /> {item.location}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={12} /> {timeAgo(item.date)}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/items/${item.id}`}
      className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="truncate text-sm text-gray-500">{item.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {timeAgo(item.date)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {item.location}
          </span>
          {item.distanceKm != null && (
            <span className="flex items-center gap-1 font-medium text-brand-600">
              <Navigation size={12} /> {formatDistance(item.distanceKm)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-gray-300" />
    </Link>
  );
}
