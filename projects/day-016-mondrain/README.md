# Day 016 — mondrAIn

Painterly Mondrian composition generator. Not just the logic of neoplasticism — the texture of it. Brushstroke direction, pigment variation, paint buildup, canvas depth. Presented as a painting hanging on an atelier wall with warm window light.

## Features

- Recursive rectangle subdivision with golden ratio bias and line snapping
- Aesthetic color placement (red/blue/yellow/black) with adjacency constraints
- Painterly rendering: directional brushstrokes, per-stroke color variation, pigment drift
- Organic canvas texture (multi-layered value noise)
- Lines painted on top of fields — some don't reach the edge
- Stretched-canvas depth effect at edges
- Atelier wall with plaster texture and directional shadow
- Animated window light with curtain sway
- Bauhaus-style UI on tilted paper posters (A3 title, A4 controls)
- Hide/show UI by clicking the painting
- PNG download

## Controls

- **Complexity** — subdivision depth
- **Line weight** — black grid line width
- **Color** — sparse to full (includes black fills)
- **Texture** — painterly intensity

## Run

```bash
open index.html
```

No dependencies, no build step.
