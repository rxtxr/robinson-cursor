// Creation screen: mutation catalog left, live preview + stats right,
// budget readout at the bottom, confirm enabled once ≥1 mutation + budget ≤ 15.

import { STARTER_DECK } from '../data/cards.ts';
import { BASE_MUTATIONS, getMutation } from '../data/mutations.ts';
import type { MonsterState } from '../data/types.ts';
import { computeStats } from '../engine/stats.ts';
import { renderMonster } from '../render/monster.ts';
import { setState } from '../state/store.ts';
import { statBlockHtml } from './ui-shared.ts';

const BUDGET = 15;

// Picked mutations are kept in screen-local scope.
// Level = 1 at creation (leveling happens later).
let selected: Set<string> = new Set();

export function renderCreation(root: HTMLElement): void {
  if (selected.size === 0) selected = new Set();
  paint(root);
}

function paint(root: HTMLElement): void {
  const monster: MonsterState = {
    mutations: [...selected].map((id) => ({ id, level: 1 })),
    currentHp: 0,
    statusEffects: [],
    turnModifiers: [],
  };
  const stats = computeStats(monster);
  const spent = [...selected].reduce((s, id) => s + getMutation(id).cost, 0);
  const overBudget = spent > BUDGET;
  const canStart = selected.size > 0 && !overBudget;

  root.innerHTML = `
    <div class="screen creation">
      <header>
        <h2>Build Your Monster</h2>
        <button id="btn-back-menu" class="ghost">← Menu</button>
      </header>
      <div class="creation-grid">
        <section class="catalog">
          <h3>Mutations</h3>
          <ul class="mutation-list">
            ${BASE_MUTATIONS.map((m) => {
              const diceStr = m.action
                ? `<span class="m-dice">🎲 ${m.action.dice.count}d${m.action.dice.sides}</span>`
                : '<span class="m-passive">passive</span>';
              return `
              <li class="mutation-item ${selected.has(m.id) ? 'selected' : ''} ${!selected.has(m.id) && spent + m.cost > BUDGET ? 'too-expensive' : ''}"
                  data-id="${m.id}">
                <div class="m-head">
                  <span class="m-name">${m.name}</span>
                  ${diceStr}
                  <span class="m-cost">${m.cost}</span>
                </div>
                <div class="m-desc">${m.description ?? ''}</div>
              </li>`;
            }).join('')}
          </ul>
        </section>
        <section class="preview">
          <h3>Preview</h3>
          <div class="monster-frame">${renderMonster(monster)}</div>
          ${statBlockHtml(stats, stats.hp)}
          <div class="budget ${overBudget ? 'over' : ''}">Budget: ${spent} / ${BUDGET}</div>
          <button id="btn-confirm" ${canStart ? '' : 'disabled'}>Start Battle</button>
        </section>
      </div>
    </div>
  `;

  root.querySelectorAll<HTMLLIElement>('.mutation-item').forEach((el) => {
    el.onclick = () => {
      const id = el.dataset.id!;
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        if (spent + getMutation(id).cost > BUDGET) return;
        selected.add(id);
      }
      paint(root);
    };
  });

  root.querySelector<HTMLButtonElement>('#btn-back-menu')!.onclick = () => {
    selected.clear();
    setState(() => ({ phase: 'menu' }));
  };

  root.querySelector<HTMLButtonElement>('#btn-confirm')!.onclick = () => {
    if (!canStart) return;
    const finalMonster: MonsterState = {
      mutations: [...selected].map((id) => ({ id, level: 1 })),
      currentHp: stats.hp,
      statusEffects: [],
      turnModifiers: [],
    };
    selected.clear();
    setState(() => ({
      phase: 'battle',
      player: {
        monster: finalMonster,
        deck: [...STARTER_DECK],
        skillPoints: 0,
        battlesWon: 0,
      },
      battle: undefined,
    }));
  };
}
