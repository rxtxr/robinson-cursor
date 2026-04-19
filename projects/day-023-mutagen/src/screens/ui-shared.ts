// Small shared UI helpers used by several screens.

import type { StatBlock } from '../data/types.ts';

export function statBlockHtml(stats: StatBlock, currentHp?: number): string {
  const row = (label: string, value: number | string, key: string) =>
    `<div class="stat-row" data-stat="${key}"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;

  const hpStr = currentHp !== undefined ? `${currentHp} / ${stats.hp}` : `${stats.hp}`;

  return `
    <div class="stat-block">
      ${row('HP', hpStr, 'hp')}
      ${row('Attack', stats.attack, 'attack')}
      ${row('Defense', stats.defense, 'defense')}
      ${row('Tempo', stats.tempo, 'tempo')}
      ${stats.poison ? row('Poison', stats.poison, 'poison') : ''}
      ${stats.fire ? row('Fire', stats.fire, 'fire') : ''}
      ${stats.electric ? row('Electric', stats.electric, 'electric') : ''}
    </div>
  `;
}

export function hpBarHtml(current: number, max: number): string {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return `
    <div class="hp-bar">
      <div class="hp-fill" style="width:${pct}%"></div>
      <div class="hp-label">${Math.max(0, current)} / ${max}</div>
    </div>
  `;
}

export function clearAndAppend(root: HTMLElement, html: string): void {
  root.innerHTML = html;
}
