# Day 017 — Game of Roguelife

Roguelike meets Conway's Game of Life. Pick gene cards to give your red cells an edge, then watch them battle through escalating levels of colored opponents.

## How it works

- **Card selection** — each card is a playing card with a pixel icon and value (2–Ace). Click a card to pick your gene and start immediately.
- **Genes** — Fertile (breed faster), Viral (infect enemies), Tough (cheat death), Fast (delay waves), Toxic (kills nearby on death), Regen (rise again). Strength stacks across levels.
- **Levels** — white → yellow → pink → blue → green → orange → cyan. Each level's opponent is tougher (survival chance, fertility bonus).
- **Mid-game draws** — bonus cards appear at tick thresholds with growing intervals.
- **Win** — eliminate all opponent cells. Lose — all your cells die.

## Aesthetic

- 160×90 pixel canvas scaled fullscreen with `image-rendering: pixelated`
- CRT scanlines and radial vignette
- All text rendered via custom 3×5 pixel font on canvas
- Playing cards with pixel-rounded corners, mirrored value/icon layout
- Level-win CRT raster wipe (red, line by line, alternating direction)
- Level intro: player cells appear first, then opponent

## Tech

Single `index.html`, no dependencies. Game of Life simulation with ownership-tracking (player vs opponent), gene modifiers applied per-tick, card system with random deals and value scaling.
