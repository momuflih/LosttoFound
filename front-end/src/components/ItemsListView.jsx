import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchFilterBar from "./SearchFilterBar";
import ItemCard from "./ItemCard";
import Loader from "./Loader";
import { getItems } from "../services/api";
import { getCurrentCoords, getStoredLocation } from "../utils/geo";

const NEARBY_RADIUS_KM = 15;

export default function ItemsListView({ itemKind, title, subtitle, searchPlaceholder }) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [nearbyActive, setNearbyActive] = useState(() => Boolean(getStoredLocation()));
  const [userCoords, setUserCoords] = useState(() => getStoredLocation());
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const onLocationChanged = (event) => {
      const location = event.detail || null;
      setUserCoords(location);
      setNearbyActive(Boolean(location));
    };
    window.addEventListener("ltf:locationChanged", onLocationChanged);
    return () => window.removeEventListener("ltf:locationChanged", onLocationChanged);
  }, []);

  const ensureLocation = async () => {
    if (userCoords) return userCoords;
    setLocating(true);
    setLocateError("");
    try {
      const coords = await getCurrentCoords();
      setUserCoords(coords);
      return coords;
    } catch (err) {
      setLocateError(err.message);
      return null;
    } finally {
      setLocating(false);
    }
  };

  const handleToggleNearby = async () => {
    if (nearbyActive) {
      setNearbyActive(false);
      return;
    }
    const coords = await ensureLocation();
    if (coords) setNearbyActive(true);
  };

  const handleSortChange = async (value) => {
    if (value === "nearest" && !userCoords) {
      const coords = await ensureLocation();
      if (!coords) return; // couldn't get location, don't switch to a sort we can't apply
    }
    setSortBy(value);
  };

  const handleDateChange = (from, to) => {
    setFromDate(from || "");
    setToDate(to || "");
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    getItems({
      itemKind,
      query: debouncedQuery,
      sortBy,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      nearCoords: nearbyActive || sortBy === "nearest" ? userCoords : null,
      maxDistanceKm: nearbyActive ? NEARBY_RADIUS_KM : undefined,
    })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [itemKind, debouncedQuery, sortBy, fromDate, toDate, nearbyActive, userCoords]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

      <div className="mt-5">
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          placeholder={searchPlaceholder}
          nearbyActive={nearbyActive}
          onToggleNearby={handleToggleNearby}
          locating={locating}
          locateError={locateError}
          fromDate={fromDate}
          toDate={toDate}
          onDateChange={handleDateChange}
        />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            {nearbyActive ? `No items within ${NEARBY_RADIUS_KM} km right now.` : "No items match your search yet."}
          </p>
        ) : (
          items.map((item) => <ItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
