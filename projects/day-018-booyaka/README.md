# Day 018 — BOOYAKA!

Fullscreen camo pattern slideshow with graffiti lettering overlay.

## What it does

Every 0.5 seconds: a new procedurally generated camouflage pattern fills the screen, with a vectorized "BOOYAKA!" graffiti lettering composited on top in the complementary color of the camo palette. Click/tap for next.

## Camo generators

5 pattern types based on real military camouflage specifications:

- **Woodland** — DPM-style layered organic blobs (dark=smaller, elongated, edge detail)
- **Digital** — MARPAT multi-scale clustering (macro/meso/micro pixel hierarchy)
- **Splinter** — Splittertarnmuster angular shards with rain streak overlay
- **Flecktarn** — Bundeswehr overlapping dots with correct 5-color distribution
- **Multicam** — Crye gradient background + blob overlay + detail shapes

24 color palettes: military classics, fashion/editorial, unusual/bold, futuristic/sci-fi, monochrome extremes.

## Lettering

Original graffiti brush lettering vectorized with potrace, then split into per-letter shapes via weighted Voronoi pixel assignment. 10 dynamic variants with different transforms (rotation, shift, scale). All SVGs use `fill="currentColor"` for color overlay.

## Files

- `index.html` — fullscreen slideshow
- `booyaka.svg` — main vectorized lettering
- `variants/` — 10 SVG lettering variants
- `original.png` — source graffiti artwork
- `dynamize.py` — letter separation + variant generation script
- `kontext/` — standalone camo configurator app
