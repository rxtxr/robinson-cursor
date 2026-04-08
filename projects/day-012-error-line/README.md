# Day 012 — Error Line

Fullscreen spray paint canvas. Pick a cap, choose a color, and tag the entire browser window.

**Desktop first. Not optimized for mobile.**

## Features

- **5 cap types** — Skinny, Standard, Fat Cap, Super Fat, Clogged (asymmetric splatter)
- **Pressure** — 1–6 bar, affects paint density and drip threshold
- **Distance** — 3–40 cm, controls spot size and edge softness
- **Opacity** — 20–100%, global alpha multiplier
- **Sharpness** — 0–100%, hard edge vs. soft glow falloff
- **Paint drips** — accumulation-based, gravity-driven with bulge heads
- **Undo/Redo** — per stroke (mousedown→mouseup), Ctrl+Z / Ctrl+Y, up to 40 steps
- **Resize-safe** — canvas content preserved on window resize

## Controls

| Input | Effect |
|-------|--------|
| Mouse drag | Spray paint |
| Cap buttons | Switch nozzle type |
| Color dots | Switch paint color |
| Sliders | Pressure, distance, opacity, sharpness |
| Ctrl+Z | Undo last stroke |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Clear | Wipe canvas (undoable) |

## Stack

Single-file HTML/JS, no dependencies. Canvas 2D with radial gradients and per-frame particle rendering.
