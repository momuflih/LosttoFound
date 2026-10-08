// Frontend-only geocoding using OpenStreetMap's Nominatim API — free, no API
// key, called directly from the browser. Nominatim's usage policy asks for
// a reasonable rate (max ~1 request/sec); fine for occasional form
// submissions like this, not for bulk/automated lookups.

export async function geocodePlace(place, state) {
  return geocodeQuery(`${place}, ${state}, India`);
}

// Freeform version used by the map's search box — same API, just without
// forcing the "place, state, India" structure, and can return several
// candidates so the person can pick the right one when a name is ambiguous.
export async function geocodeQuery(query, limit = 1) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}`;

  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Couldn't reach the location service. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error("Couldn't look up that location right now. Try again in a moment.");
  }

  const results = await response.json();
  if (!results.length) {
    throw new Error("Couldn't find that place. Try a more specific area name.");
  }

  if (limit === 1) {
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  }
  return results.map((r) => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name }));
}


export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`;

  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    return "Current location";
  }

  if (!response.ok) return "Current location";

  try {
    const data = await response.json();
    const address = data.address || {};
    return address.suburb || address.neighbourhood || address.city_district || address.city || address.town || address.village || "Current location";
  } catch {
    return "Current location";
  }
}
