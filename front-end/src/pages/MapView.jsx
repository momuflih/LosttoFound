import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { LocateFixed, ArrowLeft, Search, X, MapPin, Copy, Check } from "lucide-react";
import { getItems } from "../services/api";
import { getCurrentCoords } from "../utils/geo";
import { geocodeQuery } from "../utils/geocode";
import Loader from "../components/Loader";

const CHENNAI_CENTER = { lat: 13.0418, lng: 80.2341 };

// Custom pin built from plain HTML/CSS instead of Leaflet's default marker
// image, which commonly breaks under Vite/webpack bundling.
function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
    popupAnchor: [0, -16],
  });
}

const LOST_ICON = pinIcon("#d97706"); // amber, used for lost-item map markers
const FOUND_ICON = pinIcon("#1f5c40"); // brand green, used for found-item map markers
const SELECTED_ICON = pinIcon("#7c3aed"); // violet, visually distinct from lost/found/you-are-here

function RecenterOnLocate({ coords, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], zoom);
  }, [coords, zoom, map]);
  return null;
}

// Captures clicks anywhere on the map and reports the lat/lng back up —
// this is the "select a specific location" half of the feature.
function ClickToSelect({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all"); // all | lost | found
  const [userCoords, setUserCoords] = useState(null);
  const [locateError, setLocateError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null); // { lat, lng }

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setLoadError(err.message || "Couldn't load items for the map."))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => filter === "all" || item.itemKind === filter),
    [items, filter]
  );

  const handleLocate = async () => {
    setLocateError("");
    try {
      const coords = await getCurrentCoords();
      setUserCoords(coords);
    } catch (err) {
      setLocateError(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError("");
    setSearching(true);
    try {
      const result = await geocodeQuery(`${searchQuery}, India`);
      setSearchResult(result);
    } catch (err) {
      setSearchError(err.message);
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError("");
  };

  const handleCopyCoords = async () => {
    if (!selectedCoords) return;
    try {
      await navigator.clipboard.writeText(`${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked — fail quietly, the coordinates are still shown on screen.
    }
  };

  return (
    <div className="relative h-[calc(100vh-56px)] w-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-card"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="pointer-events-auto flex gap-2 rounded-full bg-white p-1 shadow-card">
            {["all", "lost", "found"].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === option ? "bg-brand-700 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} className="pointer-events-auto mx-auto w-full max-w-sm">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search an area (e.g. Anna Nagar)"
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm shadow-card focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {searching && <p className="mt-1.5 text-center text-xs text-white drop-shadow">Searching...</p>}
          {searchError && (
            <p className="mt-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs text-red-600 shadow-card">
              {searchError}
            </p>
          )}
        </form>
      </div>

      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocate}
          aria-label="Locate me"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-premium hover:bg-brand-50"
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {locateError && (
        <div className="absolute bottom-20 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600 shadow-card">
          {locateError}
        </div>
      )}

      {selectedCoords && (
        <div className="absolute bottom-6 left-4 z-[1000] flex items-center gap-2 rounded-full bg-white py-2 pl-4 pr-2 text-xs text-gray-700 shadow-premium">
          <MapPin size={13} className="text-violet-600" />
          {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
          <button
            onClick={handleCopyCoords}
            aria-label="Copy coordinates"
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => setSelectedCoords(null)}
            aria-label="Clear selected location"
            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {loading ? (
        <Loader label="Loading map..." />
      ) : loadError ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-red-500">{loadError}</div>
      ) : (
        <MapContainer center={[CHENNAI_CENTER.lat, CHENNAI_CENTER.lng]} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnLocate coords={userCoords} />
          <RecenterOnLocate coords={searchResult} zoom={14} />
          <ClickToSelect onSelect={setSelectedCoords} />

          {userCoords && (
            <Marker position={[userCoords.lat, userCoords.lng]} icon={pinIcon("#2563eb")}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {searchResult && (
            <Marker position={[searchResult.lat, searchResult.lng]} icon={pinIcon("#dc2626")}>
              <Popup>{searchQuery}</Popup>
            </Marker>
          )}

          {selectedCoords && (
            <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={SELECTED_ICON}>
              <Popup>
                Selected location
                <br />
                {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
              </Popup>
            </Marker>
          )}

          {visibleItems.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={item.itemKind === "found" ? FOUND_ICON : LOST_ICON}
            >
              <Popup>
                <p className="font-semibold">{item.name}</p>
                <p className="mb-1 text-xs capitalize text-gray-500">{item.itemKind} · {item.location}</p>
                <button
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  View details →
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
