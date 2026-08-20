/**
 * Core Clayle game logic.
 * Handles daily / practice state, guesses, win/lose, stats updates.
 */

import { getLocalDateKey, getDailyCountry, getRandomCountry } from "./utils/seed.js";
import {
  haversineKm,
  directionArrow,
  proximityPercent,
  proximityBar,
  formatDistance,
} from "./utils/geo.js";
import {
  loadDailyState,
  saveDailyState,
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
} from "./utils/storage.js";

export class ClayleGame {
  constructor(countries) {
    this.countries = countries;
    this.byIso = Object.fromEntries(countries.map((c) => [c.iso, c]));
    this.settings = loadSettings();
    this.stats = loadStats();
    this.mode = "daily"; // "daily" | "practice"
    this.resetForToday();
  }

  get dateKey() {
    return getLocalDateKey();
  }

  resetForToday() {
    this.mode = "daily";
    const saved = loadDailyState(this.dateKey);
    if (saved) {
      this.target = this.byIso[saved.targetIso];
      this.guesses = saved.guesses || [];
      this.won = !!saved.won;
      this.failed = !!saved.failed;
      this.revealed = !!saved.revealed;
      this.bonusProgress = saved.bonusProgress || {};
    } else {
      this.target = getDailyCountry(this.countries, this.dateKey);
      this.guesses = [];
      this.won = false;
      this.failed = false;
      this.revealed = false;
      this.bonusProgress = {};
      this._persist();
    }
  }

  startPractice() {
    this.mode = "practice";
    this.target = getRandomCountry(this.countries);
    this.guesses = [];
    this.won = false;
    this.failed = false;
    this.revealed = false;
    this.bonusProgress = {};
  }

  get remaining() {
    return Math.max(0, 6 - this.guesses.length);
  }

  get isOver() {
    return this.won || this.failed || this.guesses.length >= 6;
  }

  findCountry(query) {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    if (this.byIso[q.toUpperCase()]) return this.byIso[q.toUpperCase()];
    let match = this.countries.find((c) => c.name.toLowerCase() === q);
    if (match) return match;
    match = this.countries.find((c) => c.name.toLowerCase().startsWith(q));
    if (match) return match;
    match = this.countries.find((c) => c.name.toLowerCase().includes(q));
    return match || null;
  }

  searchCountries(query, limit = 8) {
    if (!query || query.length < 1) return [];
    const q = query.trim().toLowerCase();
    const scored = this.countries
      .map((c) => {
        const name = c.name.toLowerCase();
        let score = 0;
        if (name === q) score = 100;
        else if (name.startsWith(q)) score = 80;
        else if (name.includes(q)) score = 50;
        else if (c.iso.toLowerCase() === q) score = 90;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
    return scored.slice(0, limit).map((x) => x.c);
  }

  guess(countryOrName) {
    if (this.isOver && this.mode === "daily") return { ok: false, reason: "game-over" };

    const country =
      typeof countryOrName === "string"
        ? this.findCountry(countryOrName)
        : countryOrName;

    if (!country) return { ok: false, reason: "invalid" };
    if (this.guesses.some((g) => g.iso === country.iso)) {
      return { ok: false, reason: "duplicate" };
    }

    const dist = haversineKm(
      this.target.lat,
      this.target.lon,
      country.lat,
      country.lon
    );
    const direction = directionArrow(
      country.lat,
      country.lon,
      this.target.lat,
      this.target.lon
    );
    const prox = proximityPercent(dist);
    const bar = proximityBar(prox);

    const entry = {
      iso: country.iso,
      name: country.name,
      flag: country.flag,
      distanceKm: dist,
      direction,
      proximity: prox,
      bar,
    };

    this.guesses.push(entry);

    if (country.iso === this.target.iso) {
      this.won = true;
      this.revealed = true;
      if (this.mode === "daily") this._updateStats(true);
    } else if (this.guesses.length >= 6) {
      this.failed = true;
      this.revealed = true;
      if (this.mode === "daily") this._updateStats(false);
    }

    if (this.mode === "daily") this._persist();
    return { ok: true, entry, won: this.won, failed: this.failed };
  }

  _updateStats(won) {
    const s = this.stats;
    if (s.lastPlayedDate === this.dateKey) return;

    s.played += 1;
    s.lastPlayedDate = this.dateKey;

    if (won) {
      s.wins += 1;
      s.currentStreak += 1;
      s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
      const guessesUsed = this.guesses.length;
      s.distribution[guessesUsed] = (s.distribution[guessesUsed] || 0) + 1;
    } else {
      s.currentStreak = 0;
      s.distribution.fail = (s.distribution.fail || 0) + 1;
    }
    saveStats(s);
    this.stats = s;
  }

  _persist() {
    if (this.mode !== "daily") return;
    saveDailyState(this.dateKey, {
      targetIso: this.target.iso,
      guesses: this.guesses,
      won: this.won,
      failed: this.failed,
      revealed: this.revealed,
      bonusProgress: this.bonusProgress,
    });
  }

  getShareText() {
    const lines = this.guesses.map((g) => g.bar + " " + g.direction);
    const header =
      this.mode === "daily"
        ? `Clayle ${this.dateKey} ${this.won ? this.guesses.length : "X"}/6`
        : `Clayle Practice ${this.won ? this.guesses.length : "X"}/6`;
    return `${header}\n\n${lines.join("\n")}\n\nhttps://game.claymorely.com`;
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    saveSettings(this.settings);
  }

  getNeighbours() {
    return (this.target.neighbours || [])
      .map((iso) => this.byIso[iso])
      .filter(Boolean);
  }
}
