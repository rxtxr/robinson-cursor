// Mutation catalog.
// Each offensive mutation carries a dice spec (e.g. 1d6, 2d6, 1d20).
// Level scaling: statBonuses × level + a flat "+ (level-1)" to the roll total
// (applied in damage.ts).

import type { MutationDef } from './types.ts';

export const MUTATIONS: Record<string, MutationDef> = {
  // --- Standard mutations ---
  claws: {
    id: 'claws',
    name: 'Claws',
    cost: 2,
    slot: 'front',
    statBonuses: { attack: 3, tempo: 1 },
    action: {
      type: 'physical',
      dice: { count: 1, sides: 6 },
      description: 'Fast strike with sharp claws (1d6).',
    },
    description: 'Sharp, fast claws. +3 Attack, +1 Tempo per level. 1d6.',
  },
  horns: {
    id: 'horns',
    name: 'Horns',
    cost: 4,
    slot: 'head',
    statBonuses: { attack: 4, tempo: -1 },
    action: {
      type: 'physical',
      dice: { count: 1, sides: 12 },
      description: 'Heavy horn ram (1d12), 20% stun.',
      statusEffect: { kind: 'stun', value: 0, duration: 1, chance: 0.2 },
    },
    description: 'Heavy horns. +4 Attack, -1 Tempo per level. 1d12 · 20% stun.',
  },
  poison_gland: {
    id: 'poison_gland',
    name: 'Poison Gland',
    cost: 5,
    slot: 'body',
    statBonuses: { poison: 3 },
    action: {
      type: 'poison',
      dice: { count: 1, sides: 4 },
      description: 'Venom bite (1d4), 75% poison (DoT 2/turn ×3).',
      statusEffect: { kind: 'dot', value: 2, duration: 3, damageType: 'poison', chance: 0.75 },
    },
    description: 'Injector for toxic secretions. +3 Poison per level. 1d4 · 75% DoT poison.',
  },
  fire_sac: {
    id: 'fire_sac',
    name: 'Fire Sac',
    cost: 5,
    slot: 'body',
    statBonuses: { fire: 3 },
    action: {
      type: 'fire',
      dice: { count: 2, sides: 6 },
      description: 'Fire blast (2d6), 40% burn (DoT 2/turn ×2).',
      statusEffect: { kind: 'dot', value: 2, duration: 2, damageType: 'fire', chance: 0.4 },
    },
    description: 'Combustible gland. +3 Fire per level. 2d6 · 40% burn DoT.',
  },
  electric_organ: {
    id: 'electric_organ',
    name: 'Electric Organ',
    cost: 6,
    slot: 'body',
    statBonuses: { electric: 3, tempo: 1 },
    action: {
      type: 'electric',
      dice: { count: 2, sides: 4 },
      description: 'Shock (2d4).',
    },
    description: 'Voltage generator. +3 Electric, +1 Tempo per level. 2d4. Strong vs physical.',
  },
  leather_hide: {
    id: 'leather_hide',
    name: 'Leather Hide',
    cost: 2,
    slot: 'skin',
    statBonuses: { hp: 4, defense: 1 },
    description: 'Rugged skin. +4 HP, +1 Defense per level.',
  },
  chitin_plate: {
    id: 'chitin_plate',
    name: 'Chitin Plate',
    cost: 6,
    slot: 'skin',
    statBonuses: { hp: 6, defense: 3, tempo: -1 },
    description: 'Hard carapace. +6 HP, +3 Defense, -1 Tempo per level. Blocks poison.',
  },
  wings: {
    id: 'wings',
    name: 'Wings',
    cost: 5,
    slot: 'back',
    statBonuses: { tempo: 2, attack: 1 },
    action: {
      type: 'physical',
      dice: { count: 1, sides: 6 },
      description: 'Dive attack (1d6).',
    },
    description: 'Leathery wings. +2 Tempo, +1 Attack per level. 1d6.',
  },
  stone_skin: {
    id: 'stone_skin',
    name: 'Stone Skin',
    cost: 5,
    slot: 'skin',
    statBonuses: { hp: 8, defense: 2, tempo: -1 },
    description: 'Mineralized skin. +8 HP, +2 Defense, -1 Tempo per level. Grounds electric.',
  },
  keen_senses: {
    id: 'keen_senses',
    name: 'Keen Senses',
    cost: 3,
    slot: 'head',
    statBonuses: { tempo: 1 },
    description: 'Sharpened senses. +1 Tempo per level, +10% hit chance.',
  },

  // --- Weapons (disabled — no FLUX sprites yet, re-enable when sprites ship) ---
  /*
  blade: {
    id: 'blade',
    name: 'Blade',
    cost: 4,
    slot: 'front',
    statBonuses: { attack: 3 },
    action: {
      type: 'physical',
      dice: { count: 1, sides: 10 },
      description: 'Clean slice (1d10), 30% bleed (DoT 2/turn ×2).',
      statusEffect: { kind: 'dot', value: 2, duration: 2, damageType: 'physical', chance: 0.3 },
    },
    description: 'Sharp blade. +3 Attack per level. 1d10 · 30% bleed.',
  },
  mace: {
    id: 'mace',
    name: 'Mace',
    cost: 5,
    slot: 'head',
    statBonuses: { attack: 4, tempo: -1 },
    action: {
      type: 'physical',
      dice: { count: 2, sides: 6 },
      description: 'Heavy smash (2d6), 30% stun.',
      statusEffect: { kind: 'stun', value: 0, duration: 1, chance: 0.3 },
    },
    description: 'Heavy weapon. +4 Attack, -1 Tempo per level. 2d6 · 30% stun.',
  },
  */

  // --- Ability: Invisibility (disabled — no FLUX sprite yet) ---
  // Passive dodge chance. When re-enabled, damage.ts already handles the
  // lookup: `defenderState.mutations.find((m) => m.id === 'invisibility')`.
  /*
  invisibility: {
    id: 'invisibility',
    name: 'Invisibility',
    cost: 6,
    slot: 'skin',
    statBonuses: {},
    description: 'Passive: chance to go invisible (untouchable) per attack. Lv1 20%, Lv5 60%.',
  },
  */

  // --- Fusions ---
  magma_crust: {
    id: 'magma_crust',
    name: 'Magma Crust',
    cost: 0,
    slot: 'skin',
    statBonuses: { hp: 10, defense: 2, fire: 2 },
    isFusion: true,
    fusionParents: ['stone_skin', 'fire_sac'],
    description: 'Passive: attacker takes 3 fire counter damage on hit.',
  },
  venom_claws: {
    id: 'venom_claws',
    name: 'Venom Claws',
    cost: 0,
    slot: 'front',
    statBonuses: { attack: 2, poison: 2 },
    action: {
      type: 'physical',
      dice: { count: 2, sides: 6 },
      description: 'Physical strike (2d6), 85% poison.',
      statusEffect: { kind: 'dot', value: 2, duration: 2, damageType: 'poison', chance: 0.85 },
    },
    isFusion: true,
    fusionParents: ['claws', 'poison_gland'],
    description: 'Claws with venom channels. 2d6 · 85% DoT poison.',
  },
  thunder_strike: {
    id: 'thunder_strike',
    name: 'Thunder Strike',
    cost: 0,
    slot: 'back',
    statBonuses: { electric: 2, tempo: 2 },
    action: {
      type: 'electric',
      dice: { count: 1, sides: 20 },
      description: 'Lightning dive (1d20), ignores 50% defense, 20% stun.',
      ignoreDefensePct: 0.5,
      statusEffect: { kind: 'stun', value: 0, duration: 1, chance: 0.2 },
    },
    isFusion: true,
    fusionParents: ['electric_organ', 'wings'],
    description: 'Electrified dive. 1d20 · 50% def-pierce · 20% stun.',
  },
};

/** All non-fusion mutations (for the creation UI). */
export const BASE_MUTATIONS: MutationDef[] = Object.values(MUTATIONS).filter(
  (m) => !m.isFusion,
);

/** All fusion mutations (for auto-unlock). */
export const FUSION_MUTATIONS: MutationDef[] = Object.values(MUTATIONS).filter(
  (m) => m.isFusion === true,
);

/** Lookup helper, throws on unknown id — we work strictly on id basis. */
export function getMutation(id: string): MutationDef {
  const def = MUTATIONS[id];
  if (!def) throw new Error(`Unknown mutation: ${id}`);
  return def;
}

/** Compact dice spec as string "NdX". */
export function diceToString(dice: { count: number; sides: number }): string {
  return `${dice.count}d${dice.sides}`;
}
