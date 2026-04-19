// Level-up screen: spend skill points on mutations + pick 1 of 3 random cards
// from the level-up pool. On fusion condition: auto-unlock + banner.

import { CARDS, LEVELUP_POOL } from '../data/cards.ts';
import type { CardDef } from '../data/types.ts';
import { FUSION_MUTATIONS, getMutation } from '../data/mutations.ts';
import type { MonsterState, PlayerState } from '../data/types.ts';
import { computeStats } from '../engine/stats.ts';
import { renderMonster } from '../render/monster.ts';
import { getState, setState } from '../state/store.ts';
import { statBlockHtml } from './ui-shared.ts';

// Keep the card offer stable per level-up entry (otherwise it would reroll
// on every repaint).
let offeredCards: string[] | null = null;
let chosenCard: string | null = null;
let grantedFusions: string[] = [];

export function renderLevelup(root: HTMLElement): void {
  const s = getState();
  if (!s.player) {
    setState(() => ({ phase: 'menu' }));
    return;
  }
  if (!offeredCards) {
    offeredCards = rollLevelupOffer();
    grantedFusions = autoGrantFusions(s.player.monster);
    if (grantedFusions.length > 0) {
      // Apply fusions (once) and update player
      setState((prev) => {
        if (!prev.player) return prev;
        const updated = { ...prev.player, monster: { ...prev.player.monster } };
        for (const fid of grantedFusions) {
          if (!updated.monster.mutations.some((m) => m.id === fid)) {
            updated.monster.mutations = [...updated.monster.mutations, { id: fid, level: 1 }];
          }
        }
        return { ...prev, player: updated };
      });
      return; // rerender flows through subscribe
    }
  }

  paint(root);
}

function paint(root: HTMLElement): void {
  const s = getState();
  if (!s.player) return;
  const player = s.player;
  const stats = computeStats(player.monster, player.bonusStats);

  const fusionBanner =
    grantedFusions.length > 0
      ? `<div class="banner success">Fusion unlocked: ${grantedFusions.map((id) => getMutation(id).name).join(', ')}!</div>`
      : '';

  const curseBanner = curseBannerHtml(player.pendingCurseNotice);
  const banner = `${fusionBanner}${curseBanner}`;

  root.innerHTML = `
    <div class="screen levelup">
      <header><h2>Level-Up</h2></header>
      ${banner}
      <div class="levelup-grid">
        <section>
          <h3>Your Monster</h3>
          <div class="monster-frame">${renderMonster(player.monster)}</div>
          ${statBlockHtml(stats, player.monster.currentHp)}
          <div class="skillpoints">Skill Points: <strong>${player.skillPoints}</strong></div>
        </section>
        <section>
          <h3>Mutations</h3>
          <ul class="mutation-list">
            ${player.monster.mutations
              .map(
                (m) => `
                <li class="mutation-item">
                  <div class="m-head">
                    <span class="m-name">${getMutation(m.id).name}</span>
                    <span class="m-level">Lv ${m.level} / 5</span>
                  </div>
                  <button class="level-btn" data-id="${m.id}"
                    ${m.level >= 5 || player.skillPoints <= 0 ? 'disabled' : ''}>
                    +1 Level
                  </button>
                </li>`,
              )
              .join('')}
          </ul>
        </section>
        <section>
          <h3>Pick a Card</h3>
          <div class="card-choices">
            ${offeredCards!
              .map(
                (id) => `
                <div class="card ${chosenCard === id ? 'chosen' : ''}" data-card="${id}">
                  <div class="card-head">
                    <span>${CARDS[id]!.name}</span>
                    <span class="card-cost">${CARDS[id]!.cost}</span>
                  </div>
                  <div class="card-body">${CARDS[id]!.description}</div>
                </div>`,
              )
              .join('')}
          </div>
        </section>
      </div>
      <div class="levelup-footer">
        <button id="btn-continue" ${chosenCard ? '' : 'disabled'}>Back to Main Menu</button>
      </div>
    </div>
  `;

  root.querySelectorAll<HTMLButtonElement>('.level-btn').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id!;
      setState((prev) => {
        if (!prev.player || prev.player.skillPoints <= 0) return prev;
        const updated: PlayerState = {
          ...prev.player,
          skillPoints: prev.player.skillPoints - 1,
          monster: {
            ...prev.player.monster,
            mutations: prev.player.monster.mutations.map((m) =>
              m.id === id && m.level < 5 ? { ...m, level: m.level + 1 } : m,
            ),
          },
        };
        return { ...prev, player: updated };
      });
    };
  });

  root.querySelectorAll<HTMLDivElement>('[data-card]').forEach((el) => {
    el.onclick = () => {
      chosenCard = el.dataset.card!;
      paint(root);
    };
  });

  root.querySelector<HTMLButtonElement>('#btn-continue')!.onclick = () => {
    if (!chosenCard) return;
    const picked = chosenCard;
    setState((prev) => {
      if (!prev.player) return prev;
      const updated: PlayerState = {
        ...prev.player,
        deck: [...prev.player.deck, { defId: picked, level: 1 }],
        pendingCurseNotice: undefined, // curse banner acknowledged
      };
      return { ...prev, phase: 'menu', player: updated, battle: undefined };
    });
    // Reset level-up screen state for next entry
    offeredCards = null;
    chosenCard = null;
    grantedFusions = [];
  };
}

function curseBannerHtml(curseId: string | undefined): string {
  if (!curseId) return '';
  const def = CARDS[curseId] as CardDef | undefined;
  if (!def) return '';
  return `
    <div class="banner curse">
      ⚠ The defeated enemy slips a curse into your deck:
      <strong>${def.name}</strong> — <span class="muted">${def.description}</span>
    </div>
  `;
}

function rollLevelupOffer(): string[] {
  const pool = [...LEVELUP_POOL];
  const picks: string[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(idx, 1)[0]!);
  }
  return picks;
}

/** Checks fusion prereqs (both parents Lv3) and returns newly unlockable ids. */
function autoGrantFusions(monster: MonsterState): string[] {
  const have = new Map(monster.mutations.map((m) => [m.id, m.level]));
  const granted: string[] = [];
  for (const fusion of FUSION_MUTATIONS) {
    if (!fusion.fusionParents) continue;
    const [a, b] = fusion.fusionParents;
    const la = have.get(a) ?? 0;
    const lb = have.get(b) ?? 0;
    if (la >= 3 && lb >= 3 && !have.has(fusion.id)) {
      granted.push(fusion.id);
    }
  }
  return granted;
}
