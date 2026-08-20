/**
 * Clayle – UI bootstrap & event wiring
 */

import { ClayleGame } from "./game.js";

let game = null;
let countries = [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

async function loadCountries() {
  const res = await fetch("./data/countries.json");
  if (!res.ok) throw new Error("Failed to load countries");
  return res.json();
}

function renderSilhouette() {
  const container = $("#silhouette");
  if (!container || !game?.target) return;

  const iso = game.target.iso.toLowerCase();
  const hard = game.settings.hardMode;

  container.innerHTML = "";
  container.style.transform = "";

  if (hard === "hide") {
    container.innerHTML = `<div class="text-violet-400/70 text-sm tracking-widest uppercase">Hard mode – silhouette hidden</div>`;
    return;
  }

  const img = document.createElement("img");
  img.src = `https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/${iso}/vector.svg`;
  img.alt = "Country silhouette";
  img.className = "silhouette-img max-h-64 w-auto mx-auto filter brightness-0 invert opacity-95 transition-transform duration-500";
  img.onerror = () => {
    container.innerHTML = `<div class="text-zinc-500 text-sm">Silhouette unavailable for ${game.target.name}</div>`;
  };

  if (hard === "rotate") {
    const angle = ((game.target.iso.charCodeAt(0) * 17 + game.target.iso.charCodeAt(1) * 31) % 360);
    img.style.transform = `rotate(${angle}deg)`;
  }

  container.appendChild(img);
}

function renderGuesses() {
  const list = $("#guess-list");
  if (!list) return;
  list.innerHTML = "";

  game.guesses.forEach((g, i) => {
    const row = document.createElement("div");
    row.className =
      "guess-row flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm animate-in";
    row.innerHTML = `
      <span class="text-lg w-8 text-center">${g.flag || "🏳️"}</span>
      <span class="flex-1 font-medium truncate">${g.name}</span>
      <span class="text-zinc-400 tabular-nums w-20 text-right">${formatDist(g.distanceKm)}</span>
      <span class="text-xl w-8 text-center">${g.direction}</span>
      <span class="w-16 text-right text-violet-300 tabular-nums">${g.proximity}%</span>
      <span class="hidden sm:inline tracking-tighter">${g.bar}</span>
    `;
    list.appendChild(row);
  });
}

function formatDist(km) {
  return game.settings.unit === "mi"
    ? Math.round(km * 0.621371).toLocaleString() + " mi"
    : Math.round(km).toLocaleString() + " km";
}

function updateStatus() {
  const status = $("#status");
  const remaining = $("#remaining");
  if (remaining) remaining.textContent = game.remaining;

  if (game.won) {
    status.innerHTML = `<span class="text-emerald-400 font-semibold">Correct! ${game.target.flag} ${game.target.name}</span>`;
    showEndScreen(true);
  } else if (game.failed) {
    status.innerHTML = `<span class="text-rose-400">Out of guesses. It was ${game.target.flag} <strong>${game.target.name}</strong></span>`;
    showEndScreen(false);
  } else {
    status.textContent = "";
    $("#end-screen")?.classList.add("hidden");
  }
}

function showEndScreen(won) {
  const el = $("#end-screen");
  if (!el) return;
  el.classList.remove("hidden");
  $("#end-title").textContent = won ? "Nice!" : "Better luck tomorrow";
  $("#end-country").textContent = `${game.target.flag} ${game.target.name}`;
  $("#end-capital").textContent = game.target.capital ? `Capital: ${game.target.capital}` : "";
  $("#share-text").value = game.getShareText();

  if (won && game.settings.sound) playWinSound();
  if (won) launchConfetti();
}

function renderAutocomplete(results) {
  const box = $("#autocomplete");
  if (!box) return;
  box.innerHTML = "";
  if (!results.length) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");
  results.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "w-full text-left px-3 py-2.5 hover:bg-violet-600/20 flex items-center gap-3 text-sm transition-colors";
    btn.innerHTML = `<span class="text-lg">${c.flag}</span><span>${c.name}</span><span class="ml-auto text-zinc-500 text-xs">${c.iso}</span>`;
    btn.addEventListener("click", () => {
      $("#guess-input").value = c.name;
      box.classList.add("hidden");
      submitGuess(c);
    });
    box.appendChild(btn);
  });
}

function submitGuess(country = null) {
  const input = $("#guess-input");
  const raw = country || input.value;
  const result = game.guess(raw);

  if (!result.ok) {
    if (result.reason === "invalid") shake(input);
    if (result.reason === "duplicate") {
      input.value = "";
      $("#autocomplete").classList.add("hidden");
    }
    return;
  }

  input.value = "";
  $("#autocomplete").classList.add("hidden");
  renderGuesses();
  updateStatus();
  if (game.isOver) renderSilhouette();
}

function shake(el) {
  el.classList.add("animate-shake");
  setTimeout(() => el.classList.remove("animate-shake"), 400);
}

function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#7c3aed", "#a78bfa", "#c4b5fd", "#ffffff"],
    });
  }
}

function playWinSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 523.25;
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => {
      o.frequency.value = 659.25;
      setTimeout(() => {
        o.frequency.value = 783.99;
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, 180);
      }, 120);
    }, 100);
  } catch {}
}

function openModal(id) {
  $(`#${id}`)?.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeModal(id) {
  $(`#${id}`)?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function renderStats() {
  const s = game.stats;
  const winPct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  $("#stat-played").textContent = s.played;
  $("#stat-win").textContent = winPct + "%";
  $("#stat-streak").textContent = s.currentStreak;
  $("#stat-max").textContent = s.maxStreak;

  const dist = s.distribution;
  const max = Math.max(...Object.values(dist), 1);
  const container = $("#dist-bars");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const n = dist[i] || 0;
    const pct = Math.round((n / max) * 100);
    container.innerHTML += `
      <div class="flex items-center gap-2 text-sm">
        <span class="w-4 text-zinc-400">${i}</span>
        <div class="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
          <div class="h-full bg-violet-600 transition-all" style="width:${pct}%"></div>
        </div>
        <span class="w-6 text-right tabular-nums">${n}</span>
      </div>`;
  }
  const fail = dist.fail || 0;
  container.innerHTML += `
    <div class="flex items-center gap-2 text-sm mt-1">
      <span class="w-4 text-zinc-400">X</span>
      <div class="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
        <div class="h-full bg-rose-700/80" style="width:${Math.round((fail / max) * 100)}%"></div>
      </div>
      <span class="w-6 text-right tabular-nums">${fail}</span>
    </div>`;
}

function initParticles() {
  const canvas = $("#particles");
  if (!canvas || !game.settings.particles) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      vy: Math.random() * 0.4 + 0.1,
      vx: (Math.random() - 0.5) * 0.2,
      a: Math.random() * 0.3 + 0.05,
    });
  }

  function draw() {
    if (!game.settings.particles) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#a78bfa";
    particles.forEach((p) => {
      p.y += p.vy;
      p.x += p.vx;
      if (p.y > h) {
        p.y = -5;
        p.x = Math.random() * w;
      }
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function wireEvents() {
  const input = $("#guess-input");
  input?.addEventListener("input", () => {
    const q = input.value;
    renderAutocomplete(game.searchCountries(q));
  });
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
    }
    if (e.key === "Escape") {
      input.value = "";
      $("#autocomplete").classList.add("hidden");
    }
  });

  $("#guess-btn")?.addEventListener("click", () => submitGuess());

  $("#btn-stats")?.addEventListener("click", () => {
    renderStats();
    openModal("modal-stats");
  });
  $("#btn-settings")?.addEventListener("click", () => openModal("modal-settings"));
  $("#btn-help")?.addEventListener("click", () => openModal("modal-help"));
  $("#btn-practice")?.addEventListener("click", () => {
    game.startPractice();
    renderSilhouette();
    renderGuesses();
    updateStatus();
    $("#mode-label").textContent = "Practice";
    $("#guess-input").focus();
  });
  $("#btn-daily")?.addEventListener("click", () => {
    game.resetForToday();
    renderSilhouette();
    renderGuesses();
    updateStatus();
    $("#mode-label").textContent = "Daily";
  });

  $$("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  // Settings
  $("#setting-unit")?.addEventListener("change", (e) => {
    game.updateSettings({ unit: e.target.value });
    renderGuesses();
  });
  $("#setting-hard")?.addEventListener("change", (e) => {
    game.updateSettings({ hardMode: e.target.value });
    renderSilhouette();
  });
  $("#setting-sound")?.addEventListener("change", (e) => {
    game.updateSettings({ sound: e.target.checked });
  });
  $("#setting-particles")?.addEventListener("change", (e) => {
    game.updateSettings({ particles: e.target.checked });
  });

  $("#share-btn")?.addEventListener("click", async () => {
    const text = game.getShareText();
    try {
      await navigator.clipboard.writeText(text);
      $("#share-btn").textContent = "Copied!";
      setTimeout(() => ($("#share-btn").textContent = "Share"), 1500);
    } catch {
      $("#share-text").select();
    }
  });

  // Click outside autocomplete
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#guess-form")) {
      $("#autocomplete")?.classList.add("hidden");
    }
  });
}

async function boot() {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
    countries = await loadCountries();
    game = new ClayleGame(countries);

    // Apply saved settings to UI
    const s = game.settings;
    if ($("#setting-unit")) $("#setting-unit").value = s.unit;
    if ($("#setting-hard")) $("#setting-hard").value = s.hardMode;
    if ($("#setting-sound")) $("#setting-sound").checked = s.sound;
    if ($("#setting-particles")) $("#setting-particles").checked = s.particles;

    renderSilhouette();
    renderGuesses();
    updateStatus();
    wireEvents();
    initParticles();

    $("#app")?.classList.remove("opacity-0");
    $("#loading")?.classList.add("hidden");
  } catch (err) {
    console.error(err);
    $("#loading").innerHTML = `<p class="text-rose-400">Failed to load. Check console.</p>`;
  }
}

boot();
