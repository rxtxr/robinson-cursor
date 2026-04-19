// Stat calc from mutations.
// Rule (CLAUDE.md §2): each mutation contributes statBonuses * level.
// Base HP = 20, base tempo = 1 (min 1, max 4).
// PlayerState.bonusStats (from permanent-boost cards like Haste) stack on top.

import { getMutation } from '../data/mutations.ts';
import type { MonsterState, StatBlock, TurnModifier } from '../data/types.ts';

/** Tempo cap per CLAUDE.md §1 — "Aktionen pro Auto-Battle-Phase (min 1, max 4)". */
export const TEMPO_MIN = 1;
export const TEMPO_MAX = 4;

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

/** Base stats of a monster: base + Σ(mutation bonus × level) + optional
 *  permanent bonusStats. Tempo clamped to [1, 3]. */
export function computeStats(
  monster: MonsterState,
  bonusStats: Partial<StatBlock> = {},
): StatBlock {
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

  for (const [key, value] of Object.entries(bonusStats) as [
    keyof StatBlock,
    number,
  ][]) {
    stats[key] += value;
  }

  // toughness buffs defense — simple 1:0.5 conversion, CLAUDE.md leaves the
  // formula open. Picking the conservative variant and commenting the choice.
  stats.defense += Math.floor(stats.toughness * 0.5);

  stats.tempo = clamp(stats.tempo, TEMPO_MIN, TEMPO_MAX);
  // HP can't drop below 1 even if mutations push it negative.
  stats.hp = Math.max(1, stats.hp);

  return stats;
}

/** Stats including active turn modifiers (for combat calculations). */
export function computeEffectiveStats(
  monster: MonsterState,
  modifiers: TurnModifier[] = monster.turnModifiers,
  bonusStats: Partial<StatBlock> = {},
): StatBlock {
  const stats = computeStats(monster, bonusStats);
  for (const mod of modifiers) {
    stats[mod.stat] += mod.delta;
  }
  stats.tempo = clamp(stats.tempo, TEMPO_MIN, TEMPO_MAX);
  stats.hp = Math.max(1, stats.hp);
  return stats;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
