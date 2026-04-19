// Stat calc from mutations.
// Rule (CLAUDE.md §2): each mutation contributes statBonuses * level.
// Base HP = 20, base tempo = 1 (min 1, max 4).

import { getMutation } from '../data/mutations.ts';
import type { MonsterState, StatBlock, TurnModifier } from '../data/types.ts';

/** Empty stat block — starting state before mutation bonuses.
 *  HP base bumped from 20 (CLAUDE.md) to 30 so fresh monsters don't get one-
 *  shot by a Sparker burst on turn 1. */
export function emptyStats(): StatBlock {
  return {
    hp: 30,
    attack: 0,
    defense: 0,
    tempo: 1,
    poison: 0,
    fire: 0,
    electric: 0,
    toughness: 0,
  };
}

/** Base stats of a monster: base + Σ(mutation bonus × level), tempo clamped. */
export function computeStats(monster: MonsterState): StatBlock {
  const stats = emptyStats();

  for (const entry of monster.mutations) {
    const def = getMutation(entry.id);
    for (const [key, value] of Object.entries(def.statBonuses) as [
      keyof StatBlock,
      number,
    ][]) {
      stats[key] += value * entry.level;
    }
  }

  // toughness buffs defense — simple 1:0.5 conversion, CLAUDE.md leaves the
  // formula open. Picking the conservative variant and commenting the choice.
  stats.defense += Math.floor(stats.toughness * 0.5);

  stats.tempo = clamp(stats.tempo, 1, 3);
  // HP can't drop below 1 even if mutations push it negative.
  stats.hp = Math.max(1, stats.hp);

  return stats;
}

/** Stats including active turn modifiers (for combat calculations). */
export function computeEffectiveStats(
  monster: MonsterState,
  modifiers: TurnModifier[] = monster.turnModifiers,
): StatBlock {
  const stats = computeStats(monster);
  for (const mod of modifiers) {
    stats[mod.stat] += mod.delta;
  }
  stats.tempo = clamp(stats.tempo, 1, 3);
  stats.hp = Math.max(1, stats.hp);
  return stats;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
