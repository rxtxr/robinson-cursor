# CLAUDE.md — robinson-cursor.com

This repo contains robinson-cursor.com, a 365-day vibecoding project.

## Critical Rules
- Read ROBINSON_CURSOR_CONTEXT.md for full project context
- Projects in /projects/ are frozen after publication
- Every new project needs meta.json and README.md
- No API keys in the repo
- Document all library licenses in meta.json
- Isolation: projects must not affect each other

## Thumbnails
Files must be named exactly (Astro globs these patterns):
- `thumb.png` — required, base thumbnail
- `thumb.webp` — full-size WebP for detail page
- `thumb-sm.webp` — small WebP for index cards (~400px wide)

Generate: `magick source.png -resize 1200x630 -quality 85 thumb.webp`
Small: `magick thumb.png -resize 400x -quality 80 thumb-sm.webp`

NOT `thumbnail.png` — that won't be found.

## GitHub Link in meta.json
```json
"github": "https://github.com/rxtxr/robinson-cursor/tree/main/projects/day-NNN-slug"
```
Repo is `rxtxr/robinson-cursor` (no `.com`). Path starts at `projects/`.

## Stack-Pills in meta.json
`stack` ist eine Liste **kurzer technischer Tags** — Bibliotheken, Frameworks, Sprachen, Web-APIs, Tools, Datenquellen/APIs. Keine Sätze, keine Erklärungen, keine Algorithmen/Techniken, keine Vibe-Beschreibungen.

- Gut: `"Three.js"`, `"Canvas 2D"`, `"Web Audio API"`, `"MusicBrainz"`, `"FFmpeg"`, `"Python"`, `"Vite"`
- Mini-Qualifier OK wenn kurz: `"Three.js 0.160"`, `"node-web-audio-api (build)"`, `"Real-ESRGAN (planned)"`
- Schlecht: `"Last.fm scrobble data (pre-processed from day-002, enriched via MusicBrainz)"`, `"Moore Boundary Tracing"`, `"Procedural texture generation"`

Faustregel: max. ~3 Wörter, sofort als technischer Begriff erkennbar. Versionen, Quellen, Build-vs-Runtime-Details gehören in `license_notes`. Vollständige Konvention in ROBINSON_CURSOR_CONTEXT.md.

## Commits
Format: `day NNN: project-name — short description`
Example: `day 001: music-visualizer — webaudio fft canvas visualization`

## Deploy
git push main → Cloudflare Pages builds automatically
Preview: every branch gets its own preview URL
