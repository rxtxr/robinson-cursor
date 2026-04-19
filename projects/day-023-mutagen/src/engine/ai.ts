// Very simple card AI for the enemy.
// CLAUDE.md §7: "random pick from enemy pool, max 1 per turn" + 50% chance
// (§Prompt Phase 4). Enemy has no real deck state in the MVP — it pulls
// from a small fixed pool.

import type { BattleState, CardDef, MonsterState } from '../data/types.ts';
import { CARDS } from '../data/cards.ts';

const ENEMY_CARD_POOL = ['tough', 'bloodlust', 'adrenaline'];

/** Decides whether and which card the enemy plays this turn. */
export function enemyPickCard(
  battle: BattleState,
  rand: () => number = Math.random,
): CardDef | null {
  if (rand() >= 0.5) return null;
  const affordable = ENEMY_CARD_POOL
    .map((id) => CARDS[id]!)
    .filter((c) => c.cost <= battle.enemyEnergy);
  if (affordable.length === 0) return null;
  return affordable[Math.floor(rand() * affordable.length)]!;
}

/**
 * Applies a card played by the enemy to battle state. Buff cards are only
 * handled for self_mod and heal — the enemy pool contains nothing else.
 */
export function applyEnemyCard(
  battle: BattleState,
  card: CardDef,
  enemy: MonsterState,
): void {
  if (card.cost > battle.enemyEnergy) return;
  battle.enemyEnergy -= card.cost;
  if (card.effect.kind === 'self_mod') {
    enemy.turnModifiers.push({
      stat: card.effect.stat,
      delta: card.effect.delta,
      expiresIn: card.effect.duration,
    });
    battle.log.push(`Enemy plays ${card.name}.`);
  } else if (card.effect.kind === 'heal') {
    enemy.currentHp += card.effect.amount;
    battle.log.push(`Enemy plays ${card.name} (+${card.effect.amount} HP).`);
  }
}
