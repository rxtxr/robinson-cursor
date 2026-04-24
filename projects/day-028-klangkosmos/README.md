# day 028 — klangkosmos

20 years of listening history rendered as a 3D planetary system in the browser. Three.js, vanilla JS, no bundler.

## The metaphor

- **Sun** — music itself, gravitational centre.
- **Earth** — me, the listener. Fixed orbit at r=34, own moon.
- **Planets** — 24 top artists. Orbit radius maps inverse-log of plays (most-played → closest to the sun, strongest pull). Planet size log-scales with plays. Each planet is textured with the artist's iconic album cover.
- **Moons** — top tracks of the top 4 artists. Aphex Twin gets 2 (Avril 14th, Xtal), the others one each.
- **Asteroids** — phase-listens. Artists with bursty pattern: `loyalty_ratio < 0.80` or `active_years ≤ 3` with ≥180 plays. Elliptical orbits (e=0.35–0.80) that cross Earth's orbit. Slow tumble.

## Classification logic

```
planet     := top 24 by plays, loyalty ≥ 80%, span ≥ 2 years
asteroid   := plays ≥ 180, not already a planet, AND
                 (span ≥ 5 AND loyalty < 80%)    [gaps]
                 OR active_years ≤ 5              [short burst]
                 OR (no loyalty record AND plays ≥ 240)  [recent additions]
```

`loyalty_ratio = active_years / span_years`. 1.0 = played every year since first scrobble. 0.3 = long span but with many silent years — exactly the asteroid pattern.

## Three speed variables per planet

All planets moving at the same speed would kill the feel. Each planet's orbital speed combines:

1. **Kepler** `3.0 / r^1.2` — outer orbits visibly slower (~10× spread).
2. **Plays-bond** `0.7 … 1.5` — heavily-played artists orbit faster.
3. **Recency bonus** `1.0 … 1.2` — recently-heard artists get up to +20%.

Concrete spread: Aphex Twin (innermost, hot) ~18s/orbit; The Prodigy (outermost, cooling) ~8min/orbit.

## Album covers

- Fetched once at build time via `scripts/fetch_covers.py` → MusicBrainz release-group search → Cover Art Archive.
- A hand-curated `OVERRIDES` dict in the script forces the iconic album per artist (*Nevermind* for Nirvana, *OK Computer* for Radiohead, *Selected Ambient Works 85-92* for Aphex Twin, etc.) — otherwise the MB score often lands on obscure bootlegs.
- Covers land in `covers/{slug}.jpg` (~1.5 MB for 24 artists), mapped in `covers.json`.
- Runtime: each planet renders first with a procedural hash-colour badge (instant), then swaps to the cover texture when it finishes loading (progressive enhancement, no flicker).

## Data sources

20 years of personal **Last.fm scrobbles** (2005–2026), enriched with MusicBrainz metadata in day-002, then exported to the three aggregates below in `projects/day-002-music-charts/data/frontend/`:

- `top_artists.json` — top artists with plays, ms, firstPlay, lastPlay.
- `loyalty.json` — active years per artist + span.
- `top_tracks.json` — top tracks for moon labels.

Joined client-side, no build step beyond the one-shot cover fetch. ~140 KB JSON + ~1.5 MB covers.

## Controls

- **drag / 1-finger** — rotate camera
- **scroll / pinch** — zoom
- **right-drag / 2-finger** — pan
- **hover** — tooltip with body name
- **click** — info panel with plays, listening time, first/last scrobble, album title + year, 22-bar year strip
- **pause** — freeze all orbits
- **follow earth** — camera locks to Earth
- **EN/DE** — language toggle (3D scene labels switch too)

## Performance notes

- 3 star layers (500 bright / 3500 medium / 9000 dim) = 13 000 points total, 3 draw calls; `fog: false` so they don't get eaten by the scene FogExp2.
- Procedurally-drawn nebula skysphere (radius 1000, BackSide, tilted 35° so the Milky Way band doesn't slice horizontally).
- Orbit rings are `matrixAutoUpdate = false` (they never move) — saves 33 matrix multiplications per frame.
- Moons and asteroids use `MeshLambertMaterial` instead of Standard — PBR is overkill for rocky bodies.
- Pointer-move raycasts are throttled to 1 per animation frame via `requestAnimationFrame`.
- Label sprites and orbit rings have `fog: false`.
- Sphere segments scaled to body size (32×24 for planets, 14×10 for moons, 12×10 for Earth's moon).

## What's procedural, what's data-driven

| element | source |
|---|---|
| body count (1 sun + earth + 24 planets + 9 asteroids + 6 moons) | scrobble data |
| planet position on orbit | random phase at load |
| planet size | log(plays), deterministic |
| planet speed | plays + recency + orbit radius |
| planet colour / badge | hash(name) |
| planet texture (when loaded) | Cover Art Archive, once at build |
| asteroid ellipse (a, e, φ, tilt) | random per load |
| asteroid rotation | random per load |
| stars | random per load, seeded by `Math.random()` |

Reload → orbits look different, but bodies (sizes, identities, covers) stay stable.

## Files

```
day-028-klangkosmos/
├── index.html              static shell, i18n via data-de/data-en
├── main.js                 all the scene logic
├── meta.json               archive metadata
├── README.md               this file
├── thumb.png / .webp / -sm.webp   preview (1200×630 / 400×210)
├── scrobbles/              (named `scrobbles/` not `data/` because the
│   │                        archive site's Astro integration strips any
│   │                        folder called `data/` — that was designed
│   │                        for day-002's 7 GB DuckDB)
│   ├── top_artists.json    ~36 KB
│   ├── loyalty.json        ~68 KB
│   └── top_tracks.json     ~38 KB
├── covers/                 24 × ~60 KB JPEGs
├── covers.json             artist → cover path + album title/year
└── scripts/
    └── fetch_covers.py     one-shot MB + CAA fetch with OVERRIDES
```

## Ideas left on the table

- Use Spotify artist images / album mosaics instead of single covers.
- Highlight asteroid passes: brief glow when they cross the earth's orbit.
- Replay mode: scrub a timeline 2005 → 2026, asteroids appear/fade based on when they were actually played.
- Moon count driven by track-concentration entropy (an artist with 50 plays spread over 40 tracks ≠ one who has 50 plays on 2 tracks).
