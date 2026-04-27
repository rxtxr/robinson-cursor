# Day 031 — Oh Boid

3D flocking simulation in the browser. Boids self-organize into shifting clouds via Reynolds rules (separation, alignment, cohesion) augmented with a curl-noise flow field, density-modulated cohesion, and per-boid wander. Rendered as instanced billboard quads in WebGL2 against a procedural sky.

## Controls

- **Drag** — orbit camera
- **Scroll** — zoom
- **Double-click** — re-enable auto-rotate
- **Hamburger button** — toggle parameter panel

## Parameters

| Slider | Range | Effect |
|---|---|---|
| Count | 50–2000 | Number of boids |
| Separation | 0–4 | Push away from close neighbors |
| Alignment | 0–4 | Match neighbor velocities |
| Cohesion | 0–4 | Steer toward neighbor centroid |
| Vision | 20–200 | Neighbor radius (also scales separation range) |
| Speed | 0.5–8 | Max speed (min speed = 0.4 × max) |
| Wind | 0–2 | Slowly rotating directional drift |
| Particle size | 1–8 | Billboard radius |

## Tech

- **`boids.js`** — flock simulation: spatial hashing for neighbor queries, Reynolds rules with density modulation (edges shed, dense cores stay), curl-noise field for spatial coherence, per-boid wander direction on the unit sphere.
- **`renderer.js`** — WebGL2: instanced billboard quads with depth fog, procedural sky shader (FBM clouds), orbit camera.
- **`main.js`** — UI sync, mouse/scroll handling, animation loop.

No dependencies. Plain ES modules.

## Run

```bash
python3 -m http.server 8031
# → http://localhost:8031/
```
