// Damage calc with real dice notation (NdX).
//
// Flow:
//   Invisibility check (defender) — on dodge: miss, 0 damage
//   rolls = [r1, r2, ...]   ← N individual rolls, each 1..X
//   sum   = Σ rolls
//   mod   = attack + rollBonus + (level-1)
//   raw   = (sum + mod) * (1 + spec*0.15) * matrixMult
//   def   = defense * (1 - ignoreDefensePct)
//   damage = max(1, round(raw - def))
//
// Design choice for the type matrix: "defender type" = dominant special
// (max of poison/fire/electric), else 'physical'. Special rules (* / **)
// are hardcoded.

import type {
  ActionDef,
  DamageType,
  MonsterState,
  StatBlock,
  StatusEffectDef,
} from '../data/types.ts';

export interface DamageResult {
  damage: number;
  statusEffects: StatusEffectDef[];
  note: string;
  // Roll details for the UI:
  rolls: number[];        // individual dice results
  diceSpec: string;       // "2d6" etc
  modifier: number;       // attack + rollBonus + (level-1)
  rollTotal: number;      // sum(rolls) + modifier (before multipliers)
  missed: boolean;        // invisibility dodge
}

interface DamageInputs {
  attackerStats: StatBlock;
  defenderStats: StatBlock;
  defenderState: MonsterState;
  action: ActionDef;
  actionLevel: number;
  rollBonus?: number;
}

export function calculateDamage(inputs: DamageInputs): DamageResult {
  const {
    attackerStats,
    defenderStats,
    defenderState,
    action,
    actionLevel,
    rollBonus = 0,
  } = inputs;

  const diceSpec = `${action.dice.count}d${action.dice.sides}`;
  // Modifier formula: attack/2 + rollBonus + floor((level-1)/2).
  // Attack and level are explicitly halved so the dice aren't buried by mods.
  // rollBonus (from cards) counts full — that's the sweet spot the player
  // actively controls.
  const modifier = Math.floor(attackerStats.attack / 2)
    + rollBonus
    + Math.floor((actionLevel - 1) / 2);

  // --- Invisibility dodge check ---
  const invis = defenderState.mutations.find((m) => m.id === 'invisibility');
  if (invis) {
    const dodgeChance = Math.min(0.7, 0.1 + invis.level * 0.1);
    if (Math.random() < dodgeChance) {
      return {
        damage: 0,
        statusEffects: [],
        note: `${action.description} — Miss (invisible)!`,
        rolls: [],
        diceSpec,
        modifier,
        rollTotal: 0,
        missed: true,
      };
    }
  }

  // --- Dice roll ---
  const rolls: number[] = [];
  for (let i = 0; i < action.dice.count; i++) {
    rolls.push(randomInt(1, action.dice.sides));
  }
  const sum = rolls.reduce((a, b) => a + b, 0);
  const rollTotal = sum + modifier;

  // --- Type matrix + special rules ---
  const spec = specialAttributeValue(attackerStats, action.type);
  const defenderType = dominantDefenderType(defenderStats);
  let multiplier = baseMatrix(action.type, defenderType);
  const hasChitin = hasMutation(defenderState, 'chitin_plate');
  const hasStone = hasMutation(defenderState, 'stone_skin');
  if (action.type === 'poison' && hasChitin) multiplier *= 0.5;
  if (action.type === 'electric' && hasStone) multiplier = 0.8;
  if (action.type === 'fire' && (hasChitin || hasStone)) multiplier *= 1.5;

  const defenseEffective = Math.floor(
    defenderStats.defense * (1 - (action.ignoreDefensePct ?? 0)),
  );

  // Spec multiplier was 0.15 (CLAUDE.md). Halved to 0.08 because it stacked
  // with the type matrix and hits were snowballing.
  const raw = rollTotal * (1 + spec * 0.08) * multiplier;
  const damage = Math.max(1, Math.round(raw - defenseEffective));

  const status = action.statusEffect ? [action.statusEffect] : [];
  const typeLabel = labelType(action.type);
  const modStr = modifier === 0 ? '' : (modifier > 0 ? `+${modifier}` : `${modifier}`);
  const rollsStr = rolls.length > 0 ? `[${rolls.join('+')}]` : '';
  const multStr = multiplier !== 1 ? ` ×${multiplier.toFixed(2)}` : '';
  const note = `🎲 ${diceSpec}${modStr} → ${rollsStr}${modStr}=${rollTotal} → ${damage} ${typeLabel}${multStr}`;

  return {
    damage,
    statusEffects: status,
    note,
    rolls,
    diceSpec,
    modifier,
    rollTotal,
    missed: false,
  };
}

/** Passive magma counter-hit if the defender wears `magma_crust`. */
export function magmaCounter(defender: MonsterState): number {
  return hasMutation(defender, 'magma_crust') ? 3 : 0;
}

// ---- helpers ----

function randomInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function specialAttributeValue(stats: StatBlock, type: DamageType): number {
  switch (type) {
    case 'poison': return stats.poison;
    case 'fire': return stats.fire;
    case 'electric': return stats.electric;
    case 'physical': return 0;
  }
}

function dominantDefenderType(stats: StatBlock): DamageType {
  const { poison, fire, electric } = stats;
  const max = Math.max(poison, fire, electric);
  if (max <= 0) return 'physical';
  if (poison === max) return 'poison';
  if (fire === max) return 'fire';
  return 'electric';
}

function baseMatrix(attack: DamageType, defender: DamageType): number {
  // Softened vs CLAUDE.md: 0.5→0.75 (poison not completely useless vs
  // physical) and 1.5→1.25 (electric boosts without runaway scaling).
  if (attack === 'poison' && defender === 'physical') return 0.75;
  if (attack === 'electric' && defender === 'physical') return 1.25;
  return 1.0;
}

function hasMutation(m: MonsterState, id: string): boolean {
  return m.mutations.some((x) => x.id === id);
}

function labelType(t: DamageType): string {
  return t === 'poison' ? 'Poison' : t === 'fire' ? 'Fire' : t === 'electric' ? 'Electric' : 'Physical';
}
