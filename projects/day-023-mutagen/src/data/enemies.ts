// Enemy archetypes (CLAUDE.md §8).
// Mutation levels are rescaled to player progress on spawn — the levels here
// are the base distribution (relative profiles).

import type { EnemyArchetype } from './types.ts';

export const ENEMIES: Record<string, EnemyArchetype> = {
  // Base levels kept mild on purpose (sum 5) so the first battle against a
  // fresh player (all mutations Lv1) doesn't end in cheap turn-1 losses.
  // Scaling and reinforcements kick in after that.
  stinger: {
    id: 'stinger',
    name: 'Stinger',
    description: 'Poison specialist. Spams DoTs, high hit chance.',
    mutations: [
      { id: 'poison_gland', level: 2 },
      { id: 'claws', level: 2 },
      { id: 'keen_senses', level: 1 },
    ],
  },
  bulwark: {
    id: 'bulwark',
    name: 'Bulwark',
    description: 'Heavy tank. High defense, slow, hard-hitting.',
    mutations: [
      { id: 'chitin_plate', level: 2 },
      { id: 'horns', level: 2 },
      { id: 'stone_skin', level: 1 },
    ],
  },
  sparker: {
    id: 'sparker',
    name: 'Sparker',
    description: 'Glass cannon. High tempo, low HP, pierces defense.',
    mutations: [
      { id: 'electric_organ', level: 2 },
      { id: 'wings', level: 2 },
      { id: 'keen_senses', level: 1 },
    ],
  },
};

export const ENEMY_LIST: EnemyArchetype[] = Object.values(ENEMIES);

/** Simple scaling: rescales all enemy mutations so the sum of their levels
 *  roughly matches the sum of player mutation levels. Min 1, max 5. */
export function scaleEnemy(
  archetype: EnemyArchetype,
  playerTotalLevel: number,
): EnemyArchetype {
  const baseTotal = archetype.mutations.reduce((s, m) => s + m.level, 0);
  if (baseTotal === 0 || playerTotalLevel <= 0) return archetype;
  const factor = playerTotalLevel / baseTotal;
  return {
    ...archetype,
    mutations: archetype.mutations.map((m) => ({
      id: m.id,
      level: Math.max(1, Math.min(5, Math.round(m.level * factor))),
    })),
  };
}

/**
 * Reinforcement pool per archetype. As battlesWon climbs, extra mutations
 * from this pool get tacked on to the enemy until the deck is full.
 */
const ARCHETYPE_REINFORCEMENTS: Record<string, string[]> = {
  stinger: ['wings', 'fire_sac', 'horns'],
  bulwark: ['fire_sac', 'electric_organ', 'poison_gland'],
  sparker: ['claws', 'poison_gland', 'chitin_plate'],
};

/**
 * Adds extra mutations from the archetype pool once battlesWon ≥ 3.
 * Threshold raised (was wins≥2) so early fights don't immediately spawn new
 * mutation slots.
 *  - wins 3–5:  +1 mutation
 *  - wins 6–8:  +2 mutations
 *  - wins 9+:   +3 mutations
 * Reinforcement level scales slowly with wins (max 5).
 */
export function applyReinforcements(
  archetype: EnemyArchetype,
  wins: number,
): EnemyArchetype {
  const pool = ARCHETYPE_REINFORCEMENTS[archetype.id] ?? [];
  if (wins < 3 || pool.length === 0) return archetype;
  const count = Math.min(pool.length, 1 + Math.floor((wins - 3) / 3));
  const level = Math.max(1, Math.min(5, 1 + Math.floor((wins - 3) / 2)));
  const muts = [...archetype.mutations];
  for (let i = 0; i < count; i++) {
    if (!muts.some((m) => m.id === pool[i]!)) {
      muts.push({ id: pool[i]!, level });
    }
  }
  return { ...archetype, mutations: muts };
}
