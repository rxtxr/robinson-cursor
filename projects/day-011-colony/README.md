# Day 011 — Colony

Pixel-art ant colony simulation. Watch a colony grow from 20 workers and a queen — tunnels branch, chambers form, foragers collect food, nurses tend brood, corpses get carried to waste areas.

## Features

- **ImageData rendering** — pure pixel buffer, no fillRect
- **Pheromone system** — trail (yellow) and home (blue) gradients
- **Brood lifecycle** — egg → larva (needs feeding) → pupa → worker/soldier
- **Age polyethism** — young ants nurse, old ants forage and dig
- **Trophallaxis** — worker-to-worker and worker-to-queen food sharing
- **Necrophorese** — dead ants carried to waste areas
- **Tunnel planning** — dig goals with ~120° branching, functional chambers
- **Day/night cycle** — foragers stay inside at night
- **3 food types** — crumbs (red), seeds (yellow), honeydew (green)
- **Zoom** — mouse wheel + drag to pan

## Controls

| Input | Action |
|-------|--------|
| Click | Drop food |
| Mouse wheel | Zoom in/out |
| Drag | Pan (when zoomed) |
| Space | Pause/resume |
| +/- | Speed (1x–20x) |
| R | Reset colony |
| Esc | Reset zoom |

## Tech

- Canvas 2D with ImageData pixel manipulation
- No framework, no external dependencies
- ~1400 lines vanilla JavaScript
