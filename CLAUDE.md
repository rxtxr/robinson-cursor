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

## Description in meta.json (card excerpt)
Beschreibt das **Projekt** — die wichtigsten Aspekte, das Augenscheinlichste. Keine Randbemerkungen, keine internen Feature-Namen, kein Spec-Sheet.

- **Was es ist** (Subjekt) + **wie es sich zeigt** (Form). Optional: Skala / Bookends.
- ~25–40 Wörter, 1–2 Sätze. Lange aufzählende Multi-Klausel-Beschreibungen wirken im Card-Layout erschlagend.
- Gut: `"315,000 years of how Homo sapiens spread across the planet, as a self-playing scrubbable globe. 81 milestones from the earliest fossils to the last Polynesian voyages."`
- Schlecht (Spec-Sheet): `"...with hero image, plain-language excerpt, and primary citations. Dual projection: orthographic globe at world view, Natural Earth flat map when zoomed in. Routes follow plausible land corridors..."`

Faustregel: würde ein Außenstehender beim Card-Lesen "ah, das schau ich mir an" denken? Wenn der Text Mechanik / Backend / Implementations-Details erklärt → zu lang.

## Runtime-Daten: NICHT in `data/`
Die Astro-`copyProjectsIntegration` (in `astro.config.mjs`) excluded jedes Verzeichnis namens `data/` aus `dist/embed/` (ursprünglich um day-002's 20 GB Music-Charts und day-027's 32 MB Build-Skripte vom Production-Build fernzuhalten). Konvention:

- **Runtime-Files** (was im Browser gefetcht wird): am Project-Root, oder in `assets/`, oder unter dem üblichen `public/`-artigen Namen. Beispiel: `trees.json` direkt im day-027-Root, `assets/events.json` + `assets/images/` in day-030.
- **Build-Skripte / Rohdaten** (nicht produktiv geserved): dürfen in `data/` bleiben — werden nicht deployed.

Im Astro-Dev-Server greift die Vite-Middleware `/embed/*` direkt aus `projects/` ohne Filter — `data/`-Files funktionieren also lokal, aber **nicht in Production**. Symptom: 404 auf alle JSON-/Image-Pfade unter `/embed/<slug>/data/...` auf der Live-Site, lokal lädt alles.

Aktuelle `EXCLUDE_DIRS`: `raw-data`, `data`, `scripts`, `__pycache__` (siehe `astro.config.mjs`).

## Commits
Format: `day NNN: project-name — short description`
Example: `day 001: music-visualizer — webaudio fft canvas visualization`

## Deploy
git push main → Cloudflare Pages builds automatically
Preview: every branch gets its own preview URL
