/**
 * Geographic helpers: Haversine distance, bearing → 8-direction arrow, proximity %.
 */

const EARTH_RADIUS_KM = 6371;
const MAX_DISTANCE_KM = 20015; // approx antipodal

/**
 * Great-circle distance in kilometres between two points.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Initial bearing from point 1 to point 2 (degrees 0–360).
 */
export function bearingDegrees(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = toDeg(Math.atan2(y, x));
  return (θ + 360) % 360;
}

/**
 * Map bearing to one of 8 emoji arrows.
 * 0° = N, 45° = NE, etc.
 */
const ARROWS = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];

export function directionArrow(lat1, lon1, lat2, lon2) {
  const b = bearingDegrees(lat1, lon1, lat2, lon2);
  // offset by 22.5 so that 0–22.5 → N, 22.5–67.5 → NE, ...
  const idx = Math.round(((b + 22.5) % 360) / 45) % 8;
  return ARROWS[idx];
}

/**
 * Proximity percentage 0–100.
 * 100 = exact match, 0 ≈ antipodal.
 */
export function proximityPercent(distanceKm) {
  const p = Math.max(0, 100 * (1 - distanceKm / MAX_DISTANCE_KM));
  return Math.round(p);
}

/**
 * Build the visual proximity bar string (🟩 20 %, 🟨 10 %, ⬛ remainder).
 * Rounded down to nearest 10 %.
 */
export function proximityBar(percent) {
  const rounded = Math.floor(percent / 10) * 10;
  const greens = Math.floor(rounded / 20);
  const yellows = (rounded % 20) / 10;
  const blacks = 5 - greens - yellows; // max 5 blocks for 100 %
  return "🟩".repeat(greens) + "🟨".repeat(yellows) + "⬛".repeat(Math.max(0, blacks));
}

/**
 * Format distance according to unit preference.
 */
export function formatDistance(km, unit = "km") {
  if (unit === "mi") {
    const mi = km * 0.621371;
    return `${Math.round(mi).toLocaleString()} mi`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}
