# Clayle — Worldle by Clay

A polished, modern, production-ready daily geography guessing game inspired by [Worldle](https://worldle.teuteuf.fr).

**Clayle** (or “Worldle by Clay”) keeps the exact core loop of Worldle while adding a refined dark-purple aesthetic, practice mode, PWA support, and thoughtful polish.

## Features

- Daily country/territory silhouette (one puzzle per local calendar day)
- Exactly 6 guesses
- Valid ISO 3166-1 countries & territories (~249 entries)
- After each wrong guess: distance (km/mi), direction arrow (8-way), proximity %, visual 🟩🟨⬛ bar
- Shareable result grid (spoiler-free)
- Stats: played, win %, current/max streak, guess distribution
- Settings: units, hard mode (rotate or hide silhouette), sound, particles
- Practice mode (unlimited random)
- Confetti + animation on win
- Keyboard shortcuts, ARIA, mobile-first
- Offline-capable after first load (static assets)
- Progressive Web App installable

## Data Sources

- **Country list, names, capitals, borders (neighbours), currencies, flags, areas, lat/lng**: [mledoze/countries](https://github.com/mledoze/countries) (ODbL)
- **Improved centroids (largest landmass preference)**: [gavinr/world-countries-centroids](https://github.com/gavinr/world-countries-centroids) (merged where available)
- **Silhouette SVGs**: [djaiss/mapsicon](https://github.com/djaiss/mapsicon) (loaded via jsDelivr CDN; cacheable)
- Distance: pure Haversine formula
- Daily seed: deterministic mulberry32 PRNG seeded from `YYYY-MM-DD`

## Tech Stack

- Pure vanilla HTML + CSS + modern ES modules
- Tailwind CSS via CDN
- No framework, no backend required
- Static files only → Cloudflare Pages (free)

## Local Development

```bash
npx serve .
# or python -m http.server 8080
```

## Deployment (Cloudflare Pages – Free plan)

1. This repo is at https://github.com/claymorely/game
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → select `game`
3. Framework preset: None · Build command: empty · Output directory: `/`
4. Deploy
5. Optional: add custom domain `game.claymorely.com` (free plan supports it)

No Portainer needed.

Built for Clay.
