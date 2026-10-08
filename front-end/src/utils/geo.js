// Great-circle distance between two lat/lng points, in kilometers.
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== "number" || Number.isNaN(v))) return null;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Wraps navigator.geolocation in a Promise. Rejects with a friendly message
 * on denial/unavailability so callers can show it directly.
 */
export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Couldn't access your location. Check your browser's location permission.")),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  });
}


const LOCATION_STORAGE_KEY = "ltf_location";

export function getStoredLocation() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY) || "null");
    if (value && typeof value.lat === "number" && typeof value.lng === "number") return value;
  } catch {}
  return null;
}

export function saveStoredLocation(location) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  window.dispatchEvent(new CustomEvent("ltf:locationChanged", { detail: location }));
}

export function clearStoredLocation() {
  localStorage.removeItem(LOCATION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("ltf:locationChanged", { detail: null }));
}
