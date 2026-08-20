/**
 * Deterministic seeded PRNG (mulberry32) and daily country selection.
 * Every player on the same local calendar day gets the identical country.
 */

export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0);
}

export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Local calendar date key YYYY-MM-DD (respects user's timezone).
 */
export function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Pick a deterministic country for the given date key.
 */
export function getDailyCountry(countries, dateKey) {
  if (!countries || countries.length === 0) {
    throw new Error("No countries data");
  }
  const seed = hashString(dateKey + "-clayle-v1");
  const rng = mulberry32(seed);
  const index = Math.floor(rng() * countries.length);
  return countries[index];
}

/**
 * Random country for practice mode (non-deterministic).
 */
export function getRandomCountry(countries) {
  const index = Math.floor(Math.random() * countries.length);
  return countries[index];
}
