// Card defs: starter deck + level-up pool.
// Card-level mechanic (Lv1-3) is handled later in the combat engine — here
// we only carry base values (level 1).

import type { CardDef, CardInDeck } from './types.ts';

export const CARDS: Record<string, CardDef> = {
  // --- Starter pool ---
  adrenaline: {
    id: 'adrenaline',
    name: 'Adrenaline',
    cost: 1,
    effect: { kind: 'self_mod', stat: 'tempo', delta: 2, duration: 1 },
    description: '+2 Tempo this turn.',
  },
  focus_poison: {
    id: 'focus_poison',
    name: 'Focus Poison',
    cost: 1,
    effect: { kind: 'force_action', mutationTag: 'poison', bonus: 4 },
    description: 'Next action uses poison, +4 to roll max.',
  },
  focus_physical: {
    id: 'focus_physical',
    name: 'Focus Physical',
    cost: 1,
    effect: { kind: 'force_action', mutationTag: 'physical', bonus: 4 },
    description: 'Next action uses claws/horns, +4 to roll max.',
  },
  tough: {
    id: 'tough',
    name: 'Tough',
    cost: 1,
    effect: { kind: 'self_mod', stat: 'defense', delta: 3, duration: 1 },
    description: '+3 Defense this turn.',
  },
  bloodlust: {
    id: 'bloodlust',
    name: 'Bloodlust',
    cost: 2,
    effect: { kind: 'self_mod', stat: 'attack', delta: 4, duration: 1 },
    description: '+4 Attack this turn.',
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    cost: 2,
    effect: { kind: 'heal', amount: 5 },
    description: '+5 HP.',
  },
  analyze: {
    id: 'analyze',
    name: 'Scan',
    cost: 1,
    effect: { kind: 'reveal' },
    description: 'Reveal enemy\'s next action.',
  },
  weakpoint: {
    id: 'weakpoint',
    name: 'Weak Point',
    cost: 2,
    effect: { kind: 'opponent_mod', stat: 'defense', delta: -3, duration: 2 },
    description: 'Enemy -3 Defense for 2 turns.',
  },

  // --- Status support ---
  catalyst: {
    id: 'catalyst',
    name: 'Catalyst',
    cost: 1,
    effect: { kind: 'status_boost', chanceAdd: 0.5, uses: 1 },
    description: '+50% status chance on your next attack.',
  },
  immunity: {
    id: 'immunity',
    name: 'Immunity',
    cost: 1,
    effect: { kind: 'status_immune', uses: 1 },
    description: 'Block the next incoming status effect.',
  },

  // --- Level-up pool ---
  poison_arrow: {
    id: 'poison_arrow',
    name: 'Poison Dart',
    cost: 2,
    // MVP shape: forces a poison attack with +6 roll bonus (noticeably stronger
    // than Focus Poison, but costs 2 energy). Replace with a real direct_damage
    // effect later if needed.
    effect: { kind: 'force_action', mutationTag: 'poison', bonus: 6 },
    description: 'Forces poison attack, +6 to roll max.',
  },
  paralysis: {
    id: 'paralysis',
    name: 'Paralyze',
    cost: 2,
    effect: { kind: 'skip_opponent_action', count: 1 },
    description: 'Enemy skips 1 action.',
  },
  strengthen: {
    id: 'strengthen',
    name: 'Empower Mutation',
    cost: 1,
    effect: { kind: 'empower_mutation' },
    description: '+1 level on a random own mutation for this fight.',
  },
  double_strike: {
    id: 'double_strike',
    name: 'Double Strike',
    cost: 2,
    effect: { kind: 'double_strike' },
    description: 'Your next action fires twice.',
  },
  aegis: {
    id: 'aegis',
    name: 'Aegis',
    cost: 1,
    effect: { kind: 'self_mod', stat: 'defense', delta: 99, duration: 1 },
    description: 'Fully blocks the next attack.',
  },
  tempo_boost: {
    id: 'tempo_boost',
    name: 'Haste',
    cost: 0,
    effect: { kind: 'permanent_stat', stat: 'tempo', delta: 1 },
    description: '+1 Tempo permanently (persists across battles).',
  },
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    cost: 2,
    effect: { kind: 'cleanse' },
    description: 'Remove all active status effects from self.',
  },

  // --- Curses ---
  // Injected into your deck by defeated enemies. cost 0 + painful effect
  // → either waste a hand slot or eat the damage yourself.
  curse_poison_trail: {
    id: 'curse_poison_trail',
    name: 'Poison Trail',
    cost: 0,
    curse: true,
    effect: { kind: 'heal', amount: -3 },
    description: '[Curse] -3 HP on play. Left by the Stinger.',
  },
  curse_heaviness: {
    id: 'curse_heaviness',
    name: 'Heaviness',
    cost: 0,
    curse: true,
    effect: { kind: 'self_mod', stat: 'tempo', delta: -2, duration: 2 },
    description: '[Curse] -2 Tempo for 2 turns. Left by the Bulwark.',
  },
  curse_echo: {
    id: 'curse_echo',
    name: 'Echo',
    cost: 0,
    curse: true,
    effect: { kind: 'self_mod', stat: 'attack', delta: -3, duration: 2 },
    description: '[Curse] -3 Attack for 2 turns. Left by the Sparker.',
  },
};

/** Which curse does which archetype leave behind? */
export const CURSES_BY_ARCHETYPE: Record<string, string> = {
  stinger: 'curse_poison_trail',
  bulwark: 'curse_heaviness',
  sparker: 'curse_echo',
};

/** Starter deck with the copy counts from CLAUDE.md §6
 *  plus Catalyst + Immunity for the new status mechanic. */
export const STARTER_DECK: CardInDeck[] = [
  { defId: 'adrenaline', level: 1 },
  { defId: 'adrenaline', level: 1 },
  { defId: 'focus_poison', level: 1 },
  { defId: 'focus_poison', level: 1 },
  { defId: 'focus_physical', level: 1 },
  { defId: 'focus_physical', level: 1 },
  { defId: 'tough', level: 1 },
  { defId: 'tough', level: 1 },
  { defId: 'bloodlust', level: 1 },
  { defId: 'heal', level: 1 },
  { defId: 'analyze', level: 1 },
  { defId: 'weakpoint', level: 1 },
  { defId: 'catalyst', level: 1 },
  { defId: 'immunity', level: 1 },
];

/** Level-up pool (3 random cards are offered post-battle). */
export const LEVELUP_POOL: string[] = [
  'poison_arrow',
  'paralysis',
  'strengthen',
  'double_strike',
  'aegis',
  'tempo_boost',
  'antidote',
];

export function getCard(id: string): CardDef {
  const def = CARDS[id];
  if (!def) throw new Error(`Unknown card: ${id}`);
  return def;
}
