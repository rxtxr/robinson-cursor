// Composes a monster image from a MonsterState.
//
// Three-tier rendering:
//  1. Multi-mutation atlas match — if the monster's mutation set has a PNG
//     (e.g. player build matches a Stinger archetype), use that image.
//  2. Dominant single-mutation PNG — pick the strongest mutation and use its
//     single-mutation sprite.
//  3. SVG fallback — layered inline SVG from sprites/index.ts for empty
//     monsters or cases without any atlas match.
//
// Dominant selection rules (in order):
//  - Any fusion wins (late-game statement mutations)
//  - Highest level × cost among non-fusions
//  - Tiebreak: higher level, then higher cost

import { getMutation } from '../data/mutations.ts';
import { lookupAtlas, lookupMulti } from '../data/monsterAtlas.ts';
import type { MonsterState, MutationSlot } from '../data/types.ts';
import { computeStats } from '../engine/stats.ts';
import { SPRITE_FUNCTIONS, renderBody } from './sprites/index.ts';

// How far can levels drift before we stop accepting a multi-match. Tight
// enough that "Stinger at Lv5" doesn't match "Stinger at Lv1" builds.
const MAX_MULTI_LEVEL_DRIFT = 4;

export function renderMonster(monster: MonsterState): string {
  if (monster.mutations.length === 0) {
    return svg(renderBody('#5a5a66'));
  }

  // 1. Try exact/near-exact multi-mutation match
  if (monster.mutations.length >= 2) {
    const multi = lookupMulti(monster.mutations);
    if (multi && (multi.score ?? 0) <= MAX_MULTI_LEVEL_DRIFT) {
      return imgTag(multi.url, multiAlt(monster.mutations));
    }
  }

  // 2. Dominant single-mutation PNG
  const dominant = pickDominant(monster);
  if (dominant) {
    const entry = lookupAtlas(dominant.id, dominant.level);
    if (entry) {
      return imgTag(entry.url, `${dominant.id} Lv${dominant.level}`);
    }
  }

  // 3. SVG composition
  return renderSvgFallback(monster);
}

function imgTag(url: string, alt: string): string {
  return `<img src="${url}" class="monster-png" alt="${alt}" draggable="false"/>`;
}

function multiAlt(mutations: { id: string; level: number }[]): string {
  return mutations.map((m) => `${m.id} Lv${m.level}`).join(', ');
}

interface Dominant { id: string; level: number }

function pickDominant(monster: MonsterState): Dominant | null {
  if (monster.mutations.length === 0) return null;
  const scored = monster.mutations.map((m) => {
    const def = getMutation(m.id);
    return {
      id: m.id,
      level: m.level,
      isFusion: def.isFusion === true,
      score: m.level * Math.max(1, def.cost),
    };
  });
  scored.sort((a, b) => {
    if (a.isFusion !== b.isFusion) return a.isFusion ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return a.id.localeCompare(b.id);
  });
  const top = scored[0]!;
  return { id: top.id, level: top.level };
}

function renderSvgFallback(monster: MonsterState): string {
  const stats = computeStats(monster);
  const bodyColor = dominantColor(stats);

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

  const order: MutationSlot[] = ['skin', 'back', 'body', 'head', 'front'];
  const layers: string[] = [renderBody(bodyColor)];

  for (const slot of order) {
    const entry = perSlot.get(slot);
    if (!entry) continue;
    const fn = SPRITE_FUNCTIONS[entry.id];
    if (fn) layers.push(fn(entry.level));
  }

  for (const f of fusions) {
    const fn = SPRITE_FUNCTIONS[f.id];
    if (fn) layers.push(fn(f.level));
  }

  return svg(layers.join('\n'));
}

function svg(inner: string): string {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="monster-svg">${inner}</svg>`;
}

function dominantColor(stats: { poison: number; fire: number; electric: number }): string {
  const { poison, fire, electric } = stats;
  const max = Math.max(poison, fire, electric);
  if (max <= 0) return '#7a7a84';
  if (poison === max) return '#4a8a4a';
  if (fire === max) return '#c24a2a';
  return '#d4a835';
}
