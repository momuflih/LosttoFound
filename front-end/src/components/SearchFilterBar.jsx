import React, { useState } from "react";
import { Search, MapPin, Calendar, ArrowUpDown, X, Loader2 } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "nearest", label: "Nearest" },
];

export default function SearchFilterBar({
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  placeholder,
  nearbyActive,
  onToggleNearby,
  locating,
  locateError,
  fromDate,
  toDate,
  onDateChange,
}) {
  const [datePanelOpen, setDatePanelOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const dateLabel = fromDate || toDate ? `${fromDate || "Any"} → ${toDate || "Any"}` : "Date";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder || "Search for lost items (e.g. wallet, phone, keys...)"}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleNearby}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            nearbyActive ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
          {nearbyActive ? "Near me" : "Nearby"}
        </button>

        <div className="relative">
          <button
            onClick={() => setDatePanelOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              fromDate || toDate ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar size={14} /> {dateLabel}
          </button>

          {datePanelOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-premium">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Filter by date</p>
                <button onClick={() => setDatePanelOpen(false)} aria-label="Close">
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
              <label className="mt-3 block text-xs text-gray-500">From</label>
              <input
                type="date"
                value={fromDate || ""}
                onChange={(e) => onDateChange(e.target.value, toDate)}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
              <label className="mt-3 block text-xs text-gray-500">To</label>
              <input
                type="date"
                value={toDate || ""}
                onChange={(e) => onDateChange(fromDate, e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => {
                  onDateChange("", "");
                  setDatePanelOpen(false);
                }}
                className="mt-3 text-xs font-medium text-brand-700 hover:underline"
              >
                Clear dates
              </button>
            </div>
          )}
        </div>

        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowUpDown size={14} /> Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-premium">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setSortOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    sortBy === option.value ? "font-medium text-brand-700" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {locateError && <p className="text-xs text-red-500">{locateError}</p>}
    </div>
  );
}
