# Initial Prompt for Claude Code

Paste the following prompt into Claude Code after creating an empty project directory with `CLAUDE.md`.

---

## Prompt

We're building a playable MVP of a browser-based monster-combat game called **Mutagen**. The full spec lives in `CLAUDE.md` — read it end-to-end before writing any code.

**What I expect from you:**

1. **No big-bang builds.** We work in phases. After each phase I want to see and test the result in the browser before we move on. Always call out the current phase at the top of your reply.

2. **Ask only on real ambiguity.** If a rule in `CLAUDE.md` is genuinely unclear, ask — but only on design decisions, not implementation details. For impl details, decide yourself and comment the choice.

3. **At the end of every phase, report:** (a) what works now, (b) what's still missing, (c) commands to test, (d) what the next phase is.

**Phase plan:**

**Phase 1 — Project setup + data model**
- Init Vite + TypeScript project (`npm create vite@latest . -- --template vanilla-ts`, then clean up)
- Set `tsconfig.json` to strict
- All interfaces from `CLAUDE.md` §"Central Types" into `src/data/types.ts`
- Mutation data in `src/data/mutations.ts`, cards in `src/data/cards.ts`, enemies in `src/data/enemies.ts` — each with the full defs from the spec
- `engine/stats.ts`: `computeStats(monster: MonsterState): StatBlock` — derives effective stats from mutations + levels
- Simple debug page `index.html` that builds a sample monster and logs its stats to the console
- **Exit criterion Phase 1:** `npm run dev` runs, console shows computed stats for a monster with Claws Lv2 + Poison Gland Lv3 + Leather Hide Lv1, zero TS errors.

**Phase 2 — Screens + routing, no combat yet**
- `state/store.ts` with a simple subscribe pattern (no Redux/Zustand, vanilla)
- Screen router in `main.ts` switches between Menu / Creation / Battle-stub / Levelup-stub
- Main menu: "New Game" / "Continue" (latter disabled if no save)
- Creation screen: mutation list with cost, budget readout, confirm button
- Battle screen: stub with "Win" and "Lose" buttons to click through
- Levelup screen: stub with continue button
- `state/persistence.ts` using LocalStorage
- **Exit criterion Phase 2:** full click-path Menu → Creation → Battle-stub → (Win) → Levelup → Menu works. Save and reload preserve state.

**Phase 3 — Monster rendering**
- SVG render functions for all 10 base mutations + 3 fusions in `render/sprites/`
- `render/monster.ts` composes a full SVG from a `MonsterState`
- Creation screen shows a live preview as mutations are clicked
- **Exit criterion Phase 3:** all mutations are visually distinct, level visibly changes the image, fusions have their own overlay.

**Phase 4 — Combat engine**
- `engine/damage.ts`: `calculateDamage(attacker, defender, action): {damage, statusEffects}` with the type matrix
- `engine/actions.ts`: `chooseAction(monster, forced?): ActionDef` with urge-weighted selection
- `engine/ai.ts`: simple card AI (50% chance to play a random buff card when energy allows)
- `engine/combat.ts`: state machine for the three phases, generates log entries
- Battle screen actually playable: card hand clickable, energy visible, log scrolls
- **Exit criterion Phase 4:** player can play a full battle start to finish, all 3 enemy archetypes work, all acceptance criteria from `CLAUDE.md` pass.

**Phase 5 — Level-up + polish**
- Level-up screen fully working: spend skill points, pick 1 of 3 cards
- Fusion check + banner
- Game-Over screen
- CSS polish: dark theme, readable typography, HP bar transitions
- All 7 acceptance criteria in `CLAUDE.md` §"Acceptance Criteria" manually ticked off
- **Exit criterion Phase 5:** MVP done. All criteria green. `npm run build` passes.

---

Start with Phase 1. Don't ask first — the spec in `CLAUDE.md` is complete enough for Phase 1. If you spot a real gap while reading, flag it at the top of your first reply and I'll answer before you code on.
