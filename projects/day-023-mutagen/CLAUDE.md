# Mutagen — MVP Prototype

A monster-builder with turn-based combat, auto-battler rhythm, and a card deck.
Goal of this repo: a **playable MVP in the browser** that runs a full gameplay loop (Main Menu → Creation → Battle → Level-up → Main Menu).

## Tech Stack

- **Vanilla TypeScript** (strict mode)
- **Vite** as dev server and bundler
- **HTML + CSS** (no framework, no UI library)
- **SVG** for monster rendering (inline, composed from layers)
- **LocalStorage** for persistence
- No runtime dependencies beyond Vite/TS dev tools

## Project Layout

```
mutagen/
├── index.html
├── src/
│   ├── main.ts                 # Entry, screen router
│   ├── state/
│   │   ├── store.ts            # Global state + subscribe pattern
│   │   └── persistence.ts      # LocalStorage save/load
│   ├── data/
│   │   ├── mutations.ts        # Mutation defs (8 + 3 fusions)
│   │   ├── cards.ts            # Starter deck + level-up pool
│   │   ├── enemies.ts          # 3 archetypes
│   │   └── types.ts            # Central TS interfaces
│   ├── engine/
│   │   ├── stats.ts            # Stat calc from mutations
│   │   ├── combat.ts           # Combat engine (phases, actions)
│   │   ├── actions.ts          # Action selection (urge system)
│   │   ├── damage.ts           # Damage calc incl. type matrix
│   │   └── ai.ts               # Enemy behavior
│   ├── screens/
│   │   ├── menu.ts             # Main menu
│   │   ├── creation.ts         # Monster creation
│   │   ├── battle.ts           # Combat UI
│   │   └── levelup.ts          # Level-up screen
│   ├── render/
│   │   ├── monster.ts          # SVG composition of the monster
│   │   └── sprites/            # SVG fragments per mutation
│   └── style.css
├── CLAUDE.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Game Design Spec

### 1. Stats

**Core stats** (every monster has these):
- `hp` — hit points (base 20, +mutations)
- `attack` — base damage multiplier
- `defense` — flat damage reduction
- `tempo` — actions per auto-battle phase (min 1, max 4)

**Special stats** (only if a matching mutation is equipped):
- `poison` (toxicity)
- `fire` (firepower)
- `electric` (shock potential)
- `toughness` (buffs `defense`)

**Meta rule:** Each special stat is the sum of its matching mutation levels. It acts as a **damage multiplier** on actions of the same family (e.g. `poison` × base damage of poison gland).

Damage formula for a single action:
```
damage = (action.base + attack) * (1 + specialStat * 0.15) * typeMatrix(attackType, defenderType) - enemy.defense
```
Special stat is 0 if the matching mutation is absent. Minimum damage is 1.

### 2. The 10 Starter Mutations

| ID | Name | Cost | Slot | Primary Stats | Type | Action Effect |
|----|------|------|------|---------------|------|---------------|
| `claws` | Claws | 2 | front | +3 attack, +1 tempo | physical | Fast strike, base 4 |
| `horns` | Horns | 2 | head | +4 attack, -1 tempo | physical | Heavy ram, base 6 |
| `poison_gland` | Poison Gland | 3 | body | +3 poison | poison | DoT: 2 dmg/turn for 3 turns |
| `fire_sac` | Fire Sac | 3 | body | +3 fire | fire | Fire blast, base 5 |
| `electric_organ` | Electric Organ | 3 | body | +3 electric, +1 tempo | electric | Shock, base 4 |
| `leather_hide` | Leather Hide | 2 | skin | +4 hp, +1 defense | — | passive |
| `chitin_plate` | Chitin Plate | 3 | skin | +6 hp, +3 defense, -1 tempo | — | passive |
| `wings` | Wings | 2 | back | +2 tempo, +1 attack | physical | Dive attack, boosts hit chance |
| `stone_skin` | Stone Skin | 3 | skin | +8 hp, +2 defense, -1 tempo | — | passive, base for Magma fusion |
| `keen_senses` | Keen Senses | 2 | head | +1 tempo, +10% hit chance | — | passive |

*Note: 10 instead of 8 — `stone_skin` and `keen_senses` exist for fusion requirements and balancing. Creation budget stays 15 points.*

Each mutation has a **level from 1 to 5**. Level effect: all stat bonuses scale linearly (Lv2 = 2× bonuses, etc.), action base damage = `base * (1 + (level-1) * 0.3)`.

### 3. Fusions

Unlock condition: both parent mutations at **level 3**. Fusion unlocks automatically and appears as an extra slot (parents stay active).

| Fusion | Parents | Stats | Action |
|--------|---------|-------|--------|
| `magma_crust` (Magma Crust) | stone_skin + fire_sac | +10 hp, +2 defense, +2 fire | Passive: 3 fire damage counter when hit |
| `venom_claws` (Venom Claws) | claws + poison_gland | +2 attack, +2 poison | Physical strike + poison DoT |
| `thunder_strike` (Thunder Strike) | electric_organ + wings | +2 electric, +2 tempo | Ignores 50% enemy defense |

### 4. Type Matrix

Damage multiplier (attacker row × defender column):

```
          vs physical  vs poison  vs fire  vs electric
physical      1.0        1.0       1.0       1.0
poison        0.5*       1.0       1.0       1.0
fire          1.0        1.0       1.0       1.0
electric      1.5**      1.0       1.0       1.0
```

Special rules:
- \* Poison vs `chitin_plate` is halved (chitin blocks poison)
- \*\* Electric vs monsters with `stone_skin` drops to 0.8 (grounding)
- Fire vs monsters with `chitin_plate` or `stone_skin`: +50% (melts)
- All special rules are hardcoded `if`-cases in `damage.ts`, no generic engine.

### 5. Creation

Budget: **15 points**. Constraints:
- No prerequisites in MVP except: must pick at least one mutation.
- One copy per mutation (no stacking at creation).

UI: left column is the mutation catalog with cost + tooltip, right column shows a live stat block + SVG monster, bottom shows budget indicator and a "Start Battle" button (enabled when ≥1 mutation picked and budget ≤ 15).

### 6. Card Deck

**Starter Deck (12 cards, fixed):**

| Card | Energy | Effect |
|------|--------|--------|
| Adrenaline | 1 | +2 tempo this turn (×2) |
| Focus Poison | 1 | Next action uses poison gland if available, else random (×2) |
| Focus Physical | 1 | Next action prefers claws/horns (×2) |
| Tough | 1 | +3 defense this turn (×2) |
| Frenzy | 2 | +4 attack this turn (×1) |
| Heal | 2 | +5 hp (×1) |
| Scan | 1 | Reveal enemy's next action (×1) |
| Weak Point | 2 | Enemy -3 defense for 2 turns (×1) |

**Card rules:**
- Hand limit 5
- Starting hand 3
- Draw up to 3 each turn
- Energy: 2 per turn, doesn't carry over
- Cards have levels (1-3 in MVP). Level-up on a card: +1 to primary numeric values.

**Level-up Pool (after battle, pick 1 of 3 random):**
- Poison Dart (2 energy, 4 poison damage + DoT)
- Paralyze (2, enemy skips 1 action)
- Empower Mutation (1, +1 level on a random own mutation for this battle)
- Double Strike (2, repeats next action)
- Aegis (1, fully blocks the next attack)
- Permanent Tempo (0, +1 tempo permanently — rare)

### 7. Combat Loop

A battle is a sequence of turns. Each turn has three phases:

**Phase 1 — Draw & Plan:**
- Both monsters regen energy (2)
- Player draws until hand = 3 (max 5)
- UI shows both monsters, stats, status effects, enemy hand (face-down)

**Phase 2 — Card Play:**
- Player plays any number of cards from hand while energy allows
- Enemy also plays cards via AI rule (simple: random buff card when energy allows, max 1 per turn)
- Effects apply as "pending modifiers" on monster stats
- "Ready" button → Phase 3

**Phase 3 — Auto-Battle:**
- Compute `effectiveTempo` for both monsters including all modifiers
- Action order: alternating, faster monster starts. Tie → random roll.
- Each monster executes `tempo` actions.
- Action is chosen via **urge system**: each attacking mutation has urge = `level × (1 + specialStat * 0.2)`. Weighted random pick. Focus cards from Phase 2 set the urge of the matching mutation to infinity for the first action.
- Each action computes damage + status effects, UI writes a log line ("Your monster bites with venom claws for 8 damage + 2 poison/turn")
- Status effects tick at end of turn (DoT, duration countdown)
- HP ≤ 0 → battle ends

**Victory:** Level-up screen.
**Defeat:** Game-Over screen with "New Monster" button.

### 8. Enemy Archetypes

On battle start one of three is picked at random; mutation levels scale to player progress (sum of player mutation levels → enemy levels in the same range).

**Stinger (poison specialist):**
- Mutations: `poison_gland` Lv3, `claws` Lv2, `keen_senses` Lv1
- Strategy: Spams poison DoTs, high hit chance

**Bulwark (tank):**
- Mutations: `chitin_plate` Lv3, `horns` Lv3, `stone_skin` Lv1
- Strategy: High defense, slow, heavy hits

**Sparker (glass cannon):**
- Mutations: `electric_organ` Lv3, `wings` Lv3, `keen_senses` Lv2
- Strategy: High tempo, low HP, defense-piercing

### 9. Level-up

After a won battle:
1. +1 skill point auto-granted
2. UI shows mutation list with "+1 Level" buttons (costs 1 skill point) — max level 5
3. UI shows **3 random cards** from the level-up pool, player picks 1 (added to deck)
4. "Back to Main Menu" button — next battle starts from there

Fusions unlock **automatically** when conditions are met. Display: small banner "Fusion unlocked: Magma Crust!".

---

## Central Types (TypeScript)

These interfaces live in `src/data/types.ts` and are the single source of truth:

```typescript
export type DamageType = 'physical' | 'poison' | 'fire' | 'electric';
export type MutationSlot = 'front' | 'head' | 'body' | 'skin' | 'back';

export interface MutationDef {
  id: string;
  name: string;
  cost: number;
  slot: MutationSlot;
  statBonuses: Partial<StatBlock>;
  action?: ActionDef;            // undefined = passive
  isFusion?: boolean;
  fusionParents?: [string, string];
}

export interface ActionDef {
  type: DamageType;
  base: number;
  statusEffect?: StatusEffectDef;
  description: string;
}

export interface StatusEffectDef {
  kind: 'dot' | 'debuff' | 'stun';
  value: number;
  duration: number;
}

export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  tempo: number;
  poison: number;
  fire: number;
  electric: number;
  toughness: number;
}

export interface MonsterState {
  mutations: { id: string; level: number }[];
  currentHp: number;
  statusEffects: ActiveStatusEffect[];
  turnModifiers: TurnModifier[];
}

export interface ActiveStatusEffect {
  kind: 'dot' | 'debuff' | 'stun';
  damageType?: DamageType;
  value: number;
  remainingTurns: number;
}

export interface TurnModifier {
  stat: keyof StatBlock;
  delta: number;
  expiresIn: number; // turns
}

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  effect: CardEffect;
  description: string;
}

export type CardEffect =
  | { kind: 'self_mod'; stat: keyof StatBlock; delta: number; duration: number }
  | { kind: 'opponent_mod'; stat: keyof StatBlock; delta: number; duration: number }
  | { kind: 'force_action'; mutationTag: 'poison' | 'physical' | 'fire' | 'electric' }
  | { kind: 'heal'; amount: number }
  | { kind: 'reveal' }
  | { kind: 'skip_opponent_action'; count: number };

export interface CardInDeck {
  defId: string;
  level: number;
}

export interface GameState {
  phase: 'menu' | 'creation' | 'battle' | 'levelup' | 'gameover';
  player: {
    monster: MonsterState;
    deck: CardInDeck[];
    skillPoints: number;
    battlesWon: number;
  };
  battle?: BattleState;
}

export interface BattleState {
  enemy: MonsterState;
  enemyArchetype: string;
  turn: number;
  playerHand: CardInDeck[];
  playerDeck: CardInDeck[];
  playerDiscard: CardInDeck[];
  playerEnergy: number;
  enemyEnergy: number;
  log: string[];
  subPhase: 'draw' | 'cards' | 'autobattle' | 'end';
}
```

---

## Rendering Rules

### Monster SVG

- Base canvas 200×200, viewBox `0 0 200 200`
- Base blob as `<ellipse>` or path, color depends on dominant special stat (green = poison, red = fire, yellow = electric, grey = physical)
- One SVG fragment per slot. If multiple mutations claim the same slot (e.g. `leather_hide` + `chitin_plate` are both skin), the more expensive one wins visually; the other's stats still apply.
- Level drives size/count: claws Lv1 = 2 small claws, Lv5 = 4 large claws.
- Fusions get their own overlays drawn on top of the parents.
- Fragments are TS functions returning SVG strings, e.g. `renderClaws(level: number): string`.

### UI Style

- Minimal, dark theme (dark bg, light text)
- Cards as rectangular divs with header (name + energy) and body (description)
- Stat block as a simple key-value list
- Combat log as a scrollable list at the bottom
- No animations in MVP except: HP bar smooth transitions, card-play fade-out

---

## MVP Acceptance Criteria

The MVP is done when these scenarios all run without errors:

1. **Happy path:** Player starts new game → creates a monster on exactly 15 points (3 mutations) → fights a random archetype → wins → picks level-up + card → back to main menu, "Continue" starts the next battle with leveled stats and new deck.
2. **Fusion path:** Player levels `stone_skin` and `fire_sac` to Lv3 → after level-up screen sees fusion notification and has `magma_crust` in the mutation list → next battle the passive counter-damage rule logs visibly.
3. **Loss path:** Player loses → Game-Over screen → "New Monster" returns to creation, old progress is wiped.
4. **Persistence:** Reload mid-game → state restored (mid-battle: battle state incl. hand and HP; in menu: monster + deck + skill points).
5. **Type matrix:** Player monster with `electric_organ` vs Bulwark (has `stone_skin`) → log shows lower electric damage than vs Stinger.
6. **No console errors** during a full run.
7. **`npm run build` with zero TS errors.**

---

## Dev Workflow

- `npm install`
- `npm run dev` → Vite serves on http://localhost:5173
- `npm run build` → production build in `dist/`
- TypeScript strict, no `any`
- Every game rule is an isolated, commented function under `engine/` and testable (no unit tests in MVP, but the architecture must allow them)
- Keep commits small, imperative messages ("add poison dot stacking"), no Conventional-Commits mandate

---

## Out of Scope (not in MVP by design)

- Sound
- Animations beyond HP bar transitions
- Multiplayer
- Expanded mutation pool (>10)
- Extended type matrix
- Skill trees
- Meta progression across runs
- Mobile touch optimization (desktop Chrome is the target)
- Accessibility (v2)

---

## When in doubt

If a design question is open, pick the **simpler option** and **comment the choice in code**. Better ask the user once too many than ship a wrong assumption — but only on substantial branches, not on small details.
