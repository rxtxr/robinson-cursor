# day-023 — Mutagen

Browser-based monster-builder. Design a creature by picking mutations under a 15-point budget, then fight a run of auto-battlers while a card deck gives you turn-level control. Level-up, fuse mutations, survive.

## Status

**Playable MVP.** All five phases from `INITIAL_PROMPT.md` are wired:

- Data model + stats engine (mutations, cards, enemies, type matrix)
- State store + screen router (menu → creation → battle → level-up → game-over) with LocalStorage persistence
- Monster rendering: **75 FLUX2-Pro PNG sprites** indexed by single-mutation state and by multi-mutation set, with SVG fallback for unknown combos
- Combat engine: dice-based damage with attack/level modifiers, urge-weighted action picking, status effects (DoT / stun / debuff) with hit-chance rolls, per-hit magma counter, three enemy archetypes with win-scaling reinforcements
- Level-up: spend skill points on mutation levels, pick 1 of 3 cards from the level-up pool, auto-unlock fusions when both parents hit Lv3
- Card deck with three "real" effects beyond stat mods: `empower_mutation` (temp +1 level), `double_strike` (next action fires twice), `permanent_stat` (Haste — persists across battles)
- Hit-reaction visuals: type-colored splash overlay + intensity-scaled sprite shake on the defender, fed by the attacking mutation's level

## Stack

- Vanilla TypeScript (strict)
- Vite dev server / bundler
- Inline SVG for monster-composition fallback; FLUX2-Pro PNGs for primary rendering
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

## Monster sprite import

Sprites live in the sibling `artworks/archive/monsters/` directory (outside this repo). Re-import them after new generations:

```bash
npm run import-monsters
```

This reads every sidecar JSON in the source, copies referenced PNGs into `src/assets/monsters/` (resized to 400×400 via ImageMagick), and emits `src/data/monsterAtlas.ts` with two typed lookups:

- `lookupAtlas(id, level)` — single-mutation sprite with level fallback (L2 → L1/L3 etc.)
- `lookupMulti(mutations)` — exact set match, distance-scored on levels

`src/render/monster.ts` tries multi-match first, then dominant single-mutation, then falls back to the old SVG composition.

## Acceptance criteria

All seven from `CLAUDE.md`:

- [x] Happy path (create → fight → win → level-up → menu → continue)
- [x] Fusion path (parents at Lv3 → fusion banner → passive in combat log)
- [x] Loss path (game-over → new monster resets progress)
- [x] Persistence mid-battle (reload restores state)
- [x] Type matrix visible in damage numbers
- [x] No console errors during a full run
- [x] `npm run build` passes with zero TS errors
