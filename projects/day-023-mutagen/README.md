# day-023 — Mutagen

Browser-based monster-builder. Design a creature by picking mutations under a 15-point budget, then fight a run of auto-battlers while a card deck gives you turn-level control. Level-up, fuse mutations, survive.

## Status

**Playable MVP.** All five phases from `INITIAL_PROMPT.md` are wired: data model, state/router, SVG monster rendering, combat engine (dice, urge-based action picking, type matrix, status effects, curses, fusions), level-up, game-over. Full spec in `CLAUDE.md`.

## Stack

- Vanilla TypeScript (strict)
- Vite dev server / bundler
- Inline SVG for monster rendering
- LocalStorage for saves
- No runtime dependencies

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — Vite serves from `src/`, the dev entry is `src/index.html`.

## Build

```bash
npm run build
```

Runs `tsc` then `vite build`, then flattens `dist/` into the project root (root `index.html` + `assets/`). This lets the Astro archive-site copy the project as-is into `dist/embed/day-023-mutagen/` at deploy time. `vite.config.ts` uses `base: './'` so the bundle is relocatable under any subpath.

The root `index.html` and `assets/` are committed build artifacts — regenerate them with `npm run build` before publishing a new version.
