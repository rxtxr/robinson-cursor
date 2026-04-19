// Battle screen. Drives auto-battle via setTimeout ticks so you can see each
// action happen in sequence. Flash on HP bar on hit, floating damage number
// over the defender, active-mutation badge over the attacker.

import { CARDS, CURSES_BY_ARCHETYPE } from '../data/cards.ts';
import type { BattleState, DamageType, GameState, PlayerState } from '../data/types.ts';
import {
  type TickResult,
  effectiveStats,
  endCardPhase,
  finishAutobattle,
  maxHp,
  playCard,
  playerLost,
  playerWon,
  startBattle,
  tickAutobattle,
} from '../engine/combat.ts';
import { renderMonster } from '../render/monster.ts';
import { getState, setState } from '../state/store.ts';
import { hpBarHtml, statBlockHtml } from './ui-shared.ts';

const TICK_MS = 900;

// Module scope: tick timer + HP tracker + last tick info for rendering.
let tickTimer: number | null = null;
let lastPlayerHp: number | null = null;
let lastEnemyHp: number | null = null;
let lastBattleRef: BattleState | null = null;
let lastTick: TickResult | null = null;
// Monotonic counter so identical ticks retrigger the CSS animation.
let tickStamp = 0;

export function renderBattle(root: HTMLElement): void {
  const s = getState();
  if (!s.player) {
    setState(() => ({ phase: 'menu' }));
    return;
  }
  if (!s.battle) {
    const battle = startBattle(s.player);
    resetBattleTrackers();
    setState((prev) => ({ ...prev, battle }));
    return;
  }

  if (lastBattleRef !== s.battle) {
    resetBattleTrackers();
    lastBattleRef = s.battle;
  }

  paint(root, s as GameState & { player: PlayerState; battle: BattleState });
}

function resetBattleTrackers(): void {
  lastPlayerHp = null;
  lastEnemyHp = null;
  lastTick = null;
  if (tickTimer !== null) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
}

function paint(
  root: HTMLElement,
  s: GameState & { player: PlayerState; battle: BattleState },
): void {
  const { player, battle } = s;

  const playerStats = effectiveStats(player.monster);
  const enemyStats = effectiveStats(battle.enemy);
  const playerMax = maxHp(player.monster);
  const enemyMax = maxHp(battle.enemy);

  const playerDamaged =
    lastPlayerHp !== null && player.monster.currentHp < lastPlayerHp;
  const enemyDamaged =
    lastEnemyHp !== null && battle.enemy.currentHp < lastEnemyHp;
  lastPlayerHp = player.monster.currentHp;
  lastEnemyHp = battle.enemy.currentHp;

  // End screen
  if (battle.subPhase === 'end') {
    const won = playerWon(battle);
    const lost = playerLost(battle, player);
    root.innerHTML = `
      <div class="screen battle ended">
        <h2>${won ? 'Victory!' : lost ? 'Defeat' : 'Battle End'}</h2>
        <div class="log">${logHtml(battle.log)}</div>
        <button id="btn-next">${won ? 'Continue to Level-Up' : 'To Game Over'}</button>
      </div>
    `;
    root.querySelector<HTMLButtonElement>('#btn-next')!.onclick = () => {
      resetBattleTrackers();
      if (won) {
        const curseId = CURSES_BY_ARCHETYPE[battle.enemyArchetype];
        setState((prev) => ({
          ...prev,
          phase: 'levelup',
          player: {
            ...prev.player!,
            skillPoints: prev.player!.skillPoints + 1,
            battlesWon: prev.player!.battlesWon + 1,
            deck: curseId
              ? [...prev.player!.deck, { defId: curseId, level: 1 }]
              : prev.player!.deck,
            pendingCurseNotice: curseId,
          },
          battle: undefined,
        }));
      } else {
        setState((prev) => ({ ...prev, phase: 'gameover', battle: undefined }));
      }
    };
    return;
  }

  const autobattle = battle.subPhase === 'autobattle';
  const nextActor = battle.pendingActors?.[0];

  // --- Tick visuals ---
  // showTickFx is true for attacks AND for dodges (so "Miss" stays visible).
  const showTickFx = autobattle && lastTick
    && lastTick.actor
    && (lastTick.damage !== undefined || lastTick.missed);
  const attackerSide = showTickFx ? lastTick!.actor! : null;
  const defenderSide = attackerSide === 'player' ? 'enemy' : attackerSide === 'enemy' ? 'player' : null;
  const attackType = showTickFx ? lastTick!.actionType : null;
  const attackName = showTickFx ? lastTick!.mutationName : null;
  const dmgValue = showTickFx ? lastTick!.damage : null;
  const counterValue = showTickFx ? lastTick!.counterDamage : null;
  const missed = showTickFx ? !!lastTick!.missed : false;
  const diceSpec = showTickFx ? (lastTick!.diceSpec ?? '') : '';
  const rolls = showTickFx ? (lastTick!.rolls ?? []) : [];
  const modifier = showTickFx ? (lastTick!.modifier ?? 0) : 0;
  const rollTotal = showTickFx ? (lastTick!.rollTotal ?? 0) : 0;

  root.innerHTML = `
    <div class="screen battle">
      <header>
        <h2>Turn ${battle.turn} — vs ${capitalize(battle.enemyArchetype)}</h2>
        <div class="phase-badge">${phaseLabel(battle.subPhase)}</div>
      </header>
      <div class="battle-grid">
        ${sideHtml({
          side: 'player',
          label: 'You',
          mName: player.monster,
          stats: playerStats,
          maxHpVal: playerMax,
          damagedClass: playerDamaged ? 'damage-flash' : '',
          activeNext: autobattle && nextActor === 'player',
          isAttacker: attackerSide === 'player' && !missed,
          isDefender: defenderSide === 'player',
          attackType: attackerSide === 'player' ? attackType : null,
          attackName: attackerSide === 'player' ? attackName : null,
          incomingDamage: defenderSide === 'player' ? dmgValue : null,
          counterDamage: attackerSide === 'player' ? counterValue : null,
          diceSpec: attackerSide === 'player' ? diceSpec : '',
          rolls: attackerSide === 'player' ? rolls : [],
          modifier: attackerSide === 'player' ? modifier : 0,
          rollTotal: attackerSide === 'player' ? rollTotal : 0,
          missed: attackerSide === 'player' ? missed : false,
          showMissOverDefender: defenderSide === 'player' && missed,
        })}
        ${sideHtml({
          side: 'enemy',
          label: `Enemy (${capitalize(battle.enemyArchetype)})`,
          mName: battle.enemy,
          stats: enemyStats,
          maxHpVal: enemyMax,
          damagedClass: enemyDamaged ? 'damage-flash' : '',
          activeNext: autobattle && nextActor === 'enemy',
          isAttacker: attackerSide === 'enemy' && !missed,
          isDefender: defenderSide === 'enemy',
          attackType: attackerSide === 'enemy' ? attackType : null,
          attackName: attackerSide === 'enemy' ? attackName : null,
          incomingDamage: defenderSide === 'enemy' ? dmgValue : null,
          counterDamage: attackerSide === 'enemy' ? counterValue : null,
          diceSpec: attackerSide === 'enemy' ? diceSpec : '',
          rolls: attackerSide === 'enemy' ? rolls : [],
          modifier: attackerSide === 'enemy' ? modifier : 0,
          rollTotal: attackerSide === 'enemy' ? rollTotal : 0,
          missed: attackerSide === 'enemy' ? missed : false,
          showMissOverDefender: defenderSide === 'enemy' && missed,
        })}
      </div>
      <section class="cards-row ${autobattle ? 'locked' : ''}">
        <div class="row">
          <div class="energy">Energy: <strong>${battle.playerEnergy}</strong></div>
          ${autobattle
            ? `<div class="autobattle-status">⚡ Auto-Battle running…</div>`
            : `<button id="btn-end-turn">Start Auto-Battle</button>`}
        </div>
        <div class="hand">
          ${battle.playerHand
            .map((c, i) => cardHtml(c.defId, c.level, i, battle.playerEnergy, autobattle))
            .join('')}
        </div>
      </section>
      <section class="log-section">
        <h4>Log</h4>
        <div class="log">${logHtml(battle.log)}</div>
      </section>
    </div>
  `;

  if (!autobattle) {
    root.querySelectorAll<HTMLDivElement>('.card').forEach((el) => {
      if (el.classList.contains('unplayable')) return;
      el.onclick = () => {
        const idx = Number(el.dataset.idx);
        const ok = playCard(battle, player, idx);
        if (ok) setState((prev) => ({ ...prev, player, battle: { ...battle } }));
      };
    });

    const endBtn = root.querySelector<HTMLButtonElement>('#btn-end-turn');
    if (endBtn) {
      endBtn.onclick = () => {
        endCardPhase(battle, player);
        lastTick = null; // don't drag old visuals into a new turn
        setState((prev) => ({ ...prev, player, battle: { ...battle } }));
        scheduleTick();
      };
    }
  } else {
    if (tickTimer === null && (battle.pendingActors?.length ?? 0) > 0) {
      scheduleTick();
    } else if ((battle.pendingActors?.length ?? 0) === 0) {
      if (tickTimer === null) {
        tickTimer = window.setTimeout(() => {
          tickTimer = null;
          finishAutobattle(battle, player);
          setState((prev) => ({ ...prev, player, battle: { ...battle } }));
        }, TICK_MS);
      }
    }
  }

  const logEl = root.querySelector<HTMLDivElement>('.log-section .log');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
}

function scheduleTick(): void {
  if (tickTimer !== null) return;
  tickTimer = window.setTimeout(() => {
    tickTimer = null;
    const s = getState();
    if (!s.player || !s.battle) return;
    if (s.battle.subPhase !== 'autobattle') return;

    const tick = tickAutobattle(s.battle, s.player);
    lastTick = tick;
    tickStamp += 1;
    setState((prev) => ({ ...prev, player: s.player, battle: { ...s.battle! } }));

    if (!tick.done) {
      scheduleTick();
    }
  }, TICK_MS);
}

// ---------- UI fragments ----------

interface SideParams {
  side: 'player' | 'enemy';
  label: string;
  mName: import('../data/types.ts').MonsterState;
  stats: import('../data/types.ts').StatBlock;
  maxHpVal: number;
  damagedClass: string;
  activeNext: boolean;
  isAttacker: boolean;
  isDefender: boolean;
  attackType: DamageType | null | undefined;
  attackName: string | null | undefined;
  incomingDamage: number | null | undefined;
  counterDamage: number | null | undefined;
  diceSpec: string;
  rolls: number[];
  modifier: number;
  rollTotal: number;
  missed: boolean;
  showMissOverDefender: boolean;
}

function sideHtml(p: SideParams): string {
  const attackerCls = p.isAttacker ? `attacking attacking-${p.attackType ?? 'physical'}` : '';
  const defenderCls = p.isDefender ? 'defending' : '';
  const dmgFloat = p.isDefender && p.incomingDamage !== undefined && p.incomingDamage !== null
    ? `<div class="damage-float" data-stamp="${tickStamp}">-${p.incomingDamage}</div>`
    : '';
  const missFloat = p.showMissOverDefender
    ? `<div class="miss-float" data-stamp="${tickStamp}">Miss!</div>`
    : '';
  const counterFloat = p.counterDamage
    ? `<div class="damage-float counter" data-stamp="${tickStamp}">-${p.counterDamage}</div>`
    : '';

  let attackBadge = '';
  if (p.isAttacker && p.attackName) {
    const modStr = p.modifier === 0 ? '' : (p.modifier > 0 ? `+${p.modifier}` : `${p.modifier}`);
    const rollsStr = p.rolls.length > 0 ? `[${p.rolls.join('+')}]${modStr}=${p.rollTotal}` : '';
    attackBadge = `
      <div class="active-mutation-badge type-${p.attackType ?? 'physical'}" data-stamp="${tickStamp}">
        <span class="badge-title">${typeIcon(p.attackType)} ${p.attackName}</span>
        ${p.diceSpec ? `<span class="badge-dice">🎲 ${p.diceSpec}${modStr}</span>` : ''}
        ${rollsStr ? `<span class="badge-result">${rollsStr}</span>` : ''}
      </div>
    `;
  }

  const sideClasses = [
    'side',
    p.side,
    p.damagedClass,
    p.activeNext ? 'active' : '',
    attackerCls,
    defenderCls,
  ].filter(Boolean).join(' ');

  return `
    <section class="${sideClasses}">
      <h3>${p.label}</h3>
      <div class="monster-frame">
        ${renderMonster(p.mName)}
        ${attackBadge}
        ${dmgFloat}
        ${missFloat}
        ${counterFloat}
      </div>
      ${hpBarHtml(p.mName.currentHp, p.maxHpVal)}
      ${tempoBadgeHtml(p.stats.tempo, p.side)}
      ${statBlockHtml(p.stats, p.mName.currentHp)}
      <div class="statuses">${statusHtml(p.mName.statusEffects)}</div>
    </section>
  `;
}

function typeIcon(t: DamageType | null | undefined): string {
  switch (t) {
    case 'poison': return '☣';
    case 'fire': return '🔥';
    case 'electric': return '⚡';
    case 'physical': return '⚔';
    default: return '•';
  }
}

function phaseLabel(p: BattleState['subPhase']): string {
  switch (p) {
    case 'draw': return 'Draw';
    case 'cards': return 'Play Cards';
    case 'autobattle': return 'Auto-Battle';
    case 'end': return 'End';
  }
}

function tempoBadgeHtml(tempo: number, who: 'player' | 'enemy'): string {
  const clamped = Math.max(1, Math.min(3, Math.floor(tempo)));
  const s = getState();
  const battle = s.battle;
  const pending = battle?.pendingActors?.filter((a) => a === who).length ?? 0;
  const used = clamped - pending;
  const dots = Array.from({ length: clamped }, (_, i) => {
    const state = battle?.subPhase === 'autobattle'
      ? (i < used ? 'done' : 'pending')
      : 'idle';
    return `<span class="tempo-dot ${state}"></span>`;
  }).join('');
  return `
    <div class="tempo-row">
      <span class="tempo-label">Actions:</span>
      <span class="tempo-dots">${dots}</span>
      <span class="tempo-num">${clamped}</span>
    </div>
  `;
}

function cardHtml(
  defId: string,
  level: number,
  idx: number,
  energy: number,
  locked: boolean,
): string {
  const def = CARDS[defId]!;
  const playable = !locked && def.cost <= energy;
  return `
    <div class="card ${playable ? '' : 'unplayable'} ${def.curse ? 'curse' : ''}" data-idx="${idx}">
      <div class="card-head">
        <span>${def.name}${level > 1 ? ` Lv${level}` : ''}</span>
        <span class="card-cost">${def.cost}</span>
      </div>
      <div class="card-body">${def.description}</div>
    </div>
  `;
}

function statusHtml(list: BattleState['enemy']['statusEffects']): string {
  if (list.length === 0) return '<span class="muted">(no effects)</span>';
  return list
    .map(
      (e) =>
        `<span class="status-chip ${e.kind}">${labelStatus(e)} · ${e.remainingTurns}t</span>`,
    )
    .join('');
}

function labelStatus(e: BattleState['enemy']['statusEffects'][number]): string {
  if (e.kind === 'dot') return `DoT ${e.value}${e.damageType ? ' ' + e.damageType : ''}`;
  if (e.kind === 'debuff') return `Debuff ${e.value}`;
  return 'Stun';
}

function logHtml(lines: string[]): string {
  return lines.map((l) => `<div class="log-line">${escapeHtml(l)}</div>`).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

function capitalize(s: string): string {
  return s[0]!.toUpperCase() + s.slice(1);
}
