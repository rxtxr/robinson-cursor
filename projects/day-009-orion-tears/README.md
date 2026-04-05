# Day 009 — Orion Tears

Water ripple simulation as graphic mask, revealing the Carina Nebula and Roy Batty's tears-in-rain monologue.

## How it works

Three layers composited via CSS stacking and WebGL alpha:

1. **Background** — JWST Carina Nebula image (CSS)
2. **Text** — Blade Runner monologue, bold uppercase, `mix-blend-mode: overlay` against the image
3. **Water mask** — WebGL2 canvas with alpha transparency; calm water = darkened image (opaque), wave crests = transparent holes revealing text + image

## Simulation

- **Wave equation** with Stormer-Verlet integration (stable for c² < 0.25)
- **Biharmonic surface tension** via 13-point stencil — produces capillary ripples
- **Ring-based impact model** (Engel/Rein) — crater, crown ring, Worthington rebound, secondary collapse
- **Absorbing boundary** — 35% edge zone with quadratic falloff, no reflections
- **3D perspective mesh** (1000x1000 grid) with heightmap displacement

## Rendering

- Hard black/white threshold on surface normal vs light direction (scherenschnitt aesthetic)
- Screen-space anti-aliasing via `fwidth()` — sharp edges without jaggies
- Normal scale decoupled from geometry height — flat surface, strong shading response
