/**
 * localStorage helpers for daily progress and global stats.
 * Keys are namespaced to avoid collisions.
 */

const PREFIX = "clayle_";

function key(name) {
  return PREFIX + name;
}

export function loadJSON(name, fallback = null) {
  try {
    const raw = localStorage.getItem(key(name));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

/**
 * Daily game state shape:
 * {
 *   dateKey: string,
 *   guesses: Array<{ iso: string, name: string, distanceKm: number, direction: string, proximity: number, bar: string }>,
 *   won: boolean,
 *   failed: boolean,
 *   revealed: boolean,
 *   bonusProgress: object
 * }
 */
export function loadDailyState(dateKey) {
  const state = loadJSON("daily_" + dateKey, null);
  if (state && state.dateKey === dateKey) return state;
  return null;
}

export function saveDailyState(dateKey, state) {
  saveJSON("daily_" + dateKey, { ...state, dateKey });
}

/**
 * Global stats:
 * {
 *   played: number,
 *   wins: number,
 *   currentStreak: number,
 *   maxStreak: number,
 *   distribution: { 1: n, 2: n, ..., 6: n, fail: n },
 *   lastPlayedDate: string | null
 * }
 */
export function loadStats() {
  return loadJSON("stats", {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 },
    lastPlayedDate: null,
  });
}

export function saveStats(stats) {
  saveJSON("stats", stats);
}

/**
 * Settings:
 * {
 *   unit: "km" | "mi",
 *   hardMode: "off" | "rotate" | "hide",
 *   sound: boolean,
 *   particles: boolean
 * }
 */
export function loadSettings() {
  return loadJSON("settings", {
    unit: "km",
    hardMode: "off",
    sound: true,
    particles: true,
  });
}

export function saveSettings(settings) {
  saveJSON("settings", settings);
}
