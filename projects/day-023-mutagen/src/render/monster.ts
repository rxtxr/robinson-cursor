// Composes a full monster SVG from a MonsterState.
// Rules from CLAUDE.md §"Rendering Rules":
//  - 200×200 viewBox
//  - base-blob color from dominant special stat
//  - one fragment per slot (more expensive wins on conflict)
//  - fusions as overlay over the parents

import { SPRITE_FUNCTIONS, renderBody } from './sprites/index.ts';
import { getMutation } from '../data/mutations.ts';
import type { MonsterState, MutationSlot } from '../data/types.ts';
import { computeStats } from '../engine/stats.ts';

/** Renders the full monster SVG as a string. */
export function renderMonster(monster: MonsterState): string {
  if (monster.mutations.length === 0) {
    // Empty placeholder blob
    return svg(renderBody('#5a5a66'));
  }

  const stats = computeStats(monster);
  const bodyColor = dominantColor(stats);

  // Slot resolution: more expensive wins visually (not for stats).
  const perSlot = new Map<MutationSlot, { id: string; level: number; cost: number }>();
  const fusions: { id: string; level: number }[] = [];

  for (const entry of monster.mutations) {
    const def = getMutation(entry.id);
    if (def.isFusion) {
      fusions.push({ id: entry.id, level: entry.level });
      continue;
    }
    const existing = perSlot.get(def.slot);
    if (!existing || existing.cost < def.cost) {
      perSlot.set(def.slot, { id: entry.id, level: entry.level, cost: def.cost });
    }
  }

  // Z-order: skin first (over body), then back (wings), body organs,
  // head, front (claws on top).
  const order: MutationSlot[] = ['skin', 'back', 'body', 'head', 'front'];
  const layers: string[] = [renderBody(bodyColor)];

  for (const slot of order) {
    const entry = perSlot.get(slot);
    if (!entry) continue;
    const fn = SPRITE_FUNCTIONS[entry.id];
    if (fn) layers.push(fn(entry.level));
  }

  // Fusion overlays on top.
  for (const f of fusions) {
    const fn = SPRITE_FUNCTIONS[f.id];
    if (fn) layers.push(fn(f.level));
  }

  return svg(layers.join('\n'));
}

function svg(inner: string): string {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="monster-svg">${inner}</svg>`;
}

/** Dominant special stat → base-blob color. */
function dominantColor(stats: { poison: number; fire: number; electric: number }): string {
  const { poison, fire, electric } = stats;
  const max = Math.max(poison, fire, electric);
  if (max <= 0) return '#7a7a84';        // neutral grey = physical
  if (poison === max) return '#4a8a4a';  // green
  if (fire === max) return '#c24a2a';    // red
  return '#d4a835';                      // yellow = electric
}
