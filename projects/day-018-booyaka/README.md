# Day 018 — BOOYAKA!

Fullscreen camo pattern slideshow with complementary color lettering overlay.

## What it does

Every 0.5 seconds: a new procedurally generated camouflage pattern fills the screen, with lettering composited on top in the complementary color of the camo palette. Click/tap for next.

## Camo generators

5 pattern types based on real military camouflage specifications:

- **Woodland** — DPM-style layered organic blobs (dark=smaller, elongated, edge detail)
- **Digital** — MARPAT multi-scale clustering (macro/meso/micro pixel hierarchy)
- **Splinter** — Splittertarnmuster angular shards with rain streak overlay
- **Flecktarn** — Bundeswehr overlapping dots with correct 5-color distribution
- **Multicam** — Crye gradient background + blob overlay + detail shapes

24 color palettes: military classics, fashion/editorial, unusual/bold, futuristic/sci-fi, monochrome extremes.

## Color logic

The lettering color is computed as the complementary hue of the averaged camo palette, with boosted saturation and inverted lightness for maximum contrast.
