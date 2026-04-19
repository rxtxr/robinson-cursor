// Action selection via urge system.
// Each attack-capable mutation produces an urge value.
// urge = level × (1 + specialAttribute * 0.2).
// Force tag (from cards) pushes the urge of the matching mutation family to ∞
// for the first action of this combat tick.

import { getMutation } from '../data/mutations.ts';
import type {
  ActionDef,
  DamageType,
  MonsterState,
  StatBlock,
} from '../data/types.ts';

export interface ActionChoice {
  mutationId: string;
  action: ActionDef;
}

/**
 * Picks the action for the next tempo tick.
 * @param forceTag Optional tag from focus cards. Overrides urge on the first action.
 */
export function chooseAction(
  monster: MonsterState,
  stats: StatBlock,
  forceTag?: DamageType,
  rand: () => number = Math.random,
): ActionChoice | null {
  const candidates: { id: string; level: number; action: ActionDef; urge: number }[] = [];

  for (const entry of monster.mutations) {
    const def = getMutation(entry.id);
    if (!def.action) continue; // passive
    const spec = specialFor(stats, def.action.type);
    let urge = entry.level * (1 + spec * 0.2);
    if (forceTag && def.action.type === forceTag) urge = Number.POSITIVE_INFINITY;
    candidates.push({ id: entry.id, level: entry.level, action: def.action, urge });
  }

  if (candidates.length === 0) return null;

  // If one is Infinity → pick it directly.
  const forced = candidates.find((c) => c.urge === Number.POSITIVE_INFINITY);
  if (forced) return { mutationId: forced.id, action: forced.action };

  // Weighted random pick.
  const total = candidates.reduce((s, c) => s + c.urge, 0);
  if (total <= 0) {
    const any = candidates[0]!;
    return { mutationId: any.id, action: any.action };
  }
  let roll = rand() * total;
  for (const c of candidates) {
    roll -= c.urge;
    if (roll <= 0) return { mutationId: c.id, action: c.action };
  }
  const last = candidates[candidates.length - 1]!;
  return { mutationId: last.id, action: last.action };
}

function specialFor(stats: StatBlock, type: DamageType): number {
  switch (type) {
    case 'poison': return stats.poison;
    case 'fire': return stats.fire;
    case 'electric': return stats.electric;
    case 'physical': return 0;
  }
}
