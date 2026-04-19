// Combat state machine. Holds the three phases (draw / cards / autobattle / end)
// and exposes the functions the UI calls.
//
// Auto-battle runs sequentially: planAutobattle() fills the action list,
// tickAutobattle() runs ONE action, finishAutobattle() does the end-of-turn
// bookkeeping. The UI drives ticks via setTimeout so HP changes are visible
// one at a time.

import { CARDS, STARTER_DECK } from '../data/cards.ts';
import { ENEMIES, ENEMY_LIST, applyReinforcements, scaleEnemy } from '../data/enemies.ts';
import { getMutation } from '../data/mutations.ts';
import type {
  BattleState,
  CardDef,
  CardInDeck,
  DamageType,
  MonsterState,
  PlayerState,
  StatBlock,
  StatusEffectDef,
} from '../data/types.ts';
import { chooseAction } from './actions.ts';
import { applyEnemyCard, enemyPickCard } from './ai.ts';
import { calculateDamage, magmaCounter } from './damage.ts';
import { computeEffectiveStats } from './stats.ts';

const HAND_SIZE = 3;
const HAND_LIMIT = 5;
const ENERGY_PER_TURN = 2;

// --- Public API ---

export function startBattle(player: PlayerState): BattleState {
  const archetype = pickEnemy(player);
  const enemy: MonsterState = {
    mutations: archetype.mutations,
    currentHp: 0,
    statusEffects: [],
    turnModifiers: [],
  };
  enemy.currentHp = computeEffectiveStats(enemy).hp;

  player.monster.currentHp = computeEffectiveStats(player.monster).hp;
  player.monster.statusEffects = [];
  player.monster.turnModifiers = [];

  const deck = shuffle([...(player.deck.length ? player.deck : STARTER_DECK)]);

  const battle: BattleState = {
    enemy,
    enemyArchetype: archetype.id,
    turn: 0,
    playerHand: [],
    playerDeck: deck,
    playerDiscard: [],
    playerEnergy: 0,
    enemyEnergy: 0,
    log: [`Fight vs ${archetype.name} starts!`],
    subPhase: 'draw',
  };
  startNewTurn(battle);
  return battle;
}

export function playCard(
  battle: BattleState,
  player: PlayerState,
  handIndex: number,
): boolean {
  if (battle.subPhase !== 'cards') return false;
  const card = battle.playerHand[handIndex];
  if (!card) return false;
  const def = CARDS[card.defId]!;
  if (def.cost > battle.playerEnergy) return false;

  battle.playerEnergy -= def.cost;
  battle.playerHand.splice(handIndex, 1);
  battle.playerDiscard.push(card);

  applyPlayerCard(battle, player, def, card.level);
  battle.log.push(`You play ${def.name}.`);
  return true;
}

/**
 * Ends the card phase: enemy draws a card, action order is planned and
 * stored in battle.pendingActors. subPhase → 'autobattle'.
 * The UI then calls tickAutobattle() repeatedly.
 */
export function endCardPhase(battle: BattleState, player: PlayerState): void {
  if (battle.subPhase !== 'cards') return;
  const enemyCard = enemyPickCard(battle);
  if (enemyCard) applyEnemyCard(battle, enemyCard, battle.enemy);

  const playerStats = computeEffectiveStats(player.monster);
  const enemyStats = computeEffectiveStats(battle.enemy);
  const playerTempo = Math.max(1, Math.min(3, Math.floor(playerStats.tempo)));
  const enemyTempo = Math.max(1, Math.min(3, Math.floor(enemyStats.tempo)));

  battle.pendingActors = planActorSequence(playerTempo, enemyTempo);
  battle.forceUsed = false;
  battle.subPhase = 'autobattle';
  battle.log.push(
    `Auto-Battle: you ${playerTempo}× / enemy ${enemyTempo}× (order: ${battle.pendingActors
      .map((a) => (a === 'player' ? 'P' : 'E'))
      .join(' ')})`,
  );
}

/** Rich tick result for the UI (highlights, damage floaters, etc.). */
export interface TickResult {
  done: boolean;
  actor?: 'player' | 'enemy';
  // On a successful attack:
  mutationId?: string;
  mutationName?: string;
  actionType?: DamageType;
  damage?: number;
  defenderDefense?: number;
  counterDamage?: number;
  // Roll details:
  diceSpec?: string;         // "2d6" etc
  rolls?: number[];          // individual rolls
  modifier?: number;         // attack + bonus + level-1
  rollTotal?: number;        // sum(rolls) + modifier
  // Invisibility dodge?
  missed?: boolean;
  // Status outcome: if the action carries a status effect:
  statusLabel?: string;         // "Poison", "Burn", "Bleed", "Stun"
  statusChance?: number;        // 0..1 (after boost)
  statusApplied?: boolean;
  statusBlocked?: boolean;      // blocked by immunity
  // If no action happened:
  skipReason?: 'stun' | 'paralysis' | 'no-action';
}

/**
 * Runs the next action in pendingActors. Returns info for UI rendering
 * (attacker badge, damage number, defense flash).
 */
export function tickAutobattle(
  battle: BattleState,
  player: PlayerState,
): TickResult {
  if (!battle.pendingActors || battle.pendingActors.length === 0) {
    return { done: true };
  }

  const playerStats = computeEffectiveStats(player.monster);
  const enemyStats = computeEffectiveStats(battle.enemy);

  const actor = battle.pendingActors.shift()!;
  const result: TickResult = { done: false, actor };

  if (actor === 'player') {
    if (hasActiveStun(player.monster)) {
      battle.log.push('Your monster is stunned.');
      result.skipReason = 'stun';
    } else {
      const force = !battle.forceUsed ? battle.playerForcedTag : undefined;
      const forceBonus = !battle.forceUsed ? (battle.playerForcedBonus ?? 0) : 0;
      battle.forceUsed = true;
      const choice = chooseAction(player.monster, playerStats, force);
      if (!choice) {
        battle.log.push('Your monster has no action available.');
        result.skipReason = 'no-action';
      } else {
        const level = player.monster.mutations.find((m) => m.id === choice.mutationId)?.level ?? 1;
        const res = calculateDamage({
          attackerStats: playerStats,
          defenderStats: enemyStats,
          defenderState: battle.enemy,
          action: choice.action,
          actionLevel: level,
          rollBonus: forceBonus,
        });
        battle.enemy.currentHp -= res.damage;
        battle.log.push(`You → ${getMutation(choice.mutationId).name}: ${res.note}`);
        result.mutationId = choice.mutationId;
        result.mutationName = getMutation(choice.mutationId).name;
        result.actionType = choice.action.type;
        result.damage = res.damage;
        result.defenderDefense = enemyStats.defense;
        result.diceSpec = res.diceSpec;
        result.rolls = res.rolls;
        result.modifier = res.modifier;
        result.rollTotal = res.rollTotal;
        result.missed = res.missed;
        for (const se of res.statusEffects) {
          rollStatus(battle, se, battle.enemy, 'player', result);
        }
        const counter = magmaCounter(battle.enemy);
        if (counter > 0 && res.damage > 0) {
          player.monster.currentHp -= counter;
          battle.log.push(`  Enemy Magma Crust triggers: ${counter} fire`);
          result.counterDamage = counter;
        }
      }
    }
  } else {
    if ((battle.enemySkippedActions ?? 0) > 0) {
      battle.enemySkippedActions! -= 1;
      battle.log.push('Enemy skips action (paralyzed).');
      result.skipReason = 'paralysis';
    } else if (hasActiveStun(battle.enemy)) {
      battle.log.push('Enemy is stunned.');
      result.skipReason = 'stun';
    } else {
      const choice = chooseAction(battle.enemy, enemyStats);
      if (!choice) {
        battle.log.push('Enemy has no action.');
        result.skipReason = 'no-action';
      } else {
        const level = battle.enemy.mutations.find((m) => m.id === choice.mutationId)?.level ?? 1;
        const res = calculateDamage({
          attackerStats: enemyStats,
          defenderStats: playerStats,
          defenderState: player.monster,
          action: choice.action,
          actionLevel: level,
        });
        player.monster.currentHp -= res.damage;
        battle.log.push(`Enemy → ${getMutation(choice.mutationId).name}: ${res.note}`);
        result.mutationId = choice.mutationId;
        result.mutationName = getMutation(choice.mutationId).name;
        result.actionType = choice.action.type;
        result.damage = res.damage;
        result.defenderDefense = playerStats.defense;
        result.diceSpec = res.diceSpec;
        result.rolls = res.rolls;
        result.modifier = res.modifier;
        result.rollTotal = res.rollTotal;
        result.missed = res.missed;
        for (const se of res.statusEffects) {
          rollStatus(battle, se, player.monster, 'enemy', result);
        }
        const counter = magmaCounter(player.monster);
        if (counter > 0 && res.damage > 0) {
          battle.enemy.currentHp -= counter;
          battle.log.push(`  Your Magma Crust triggers: ${counter} fire`);
          result.counterDamage = counter;
        }
      }
    }
  }

  if (player.monster.currentHp <= 0 || battle.enemy.currentHp <= 0) {
    battle.pendingActors = [];
    result.done = true;
    return result;
  }

  result.done = battle.pendingActors.length === 0;
  return result;
}

/** Ends the turn: DoT/modifiers tick, death check, next turn or battle end. */
export function finishAutobattle(battle: BattleState, player: PlayerState): void {
  if (battle.subPhase !== 'autobattle') return;
  if (checkDeath(battle, player)) return;

  endOfTurnUpkeep(battle, player);
  if (checkDeath(battle, player)) return;

  startNewTurn(battle);
}

export function playerWon(battle: BattleState): boolean {
  return battle.subPhase === 'end' && battle.enemy.currentHp <= 0;
}

export function playerLost(battle: BattleState, player: PlayerState): boolean {
  return battle.subPhase === 'end' && player.monster.currentHp <= 0;
}

// --- internals ---

function checkDeath(battle: BattleState, player: PlayerState): boolean {
  if (player.monster.currentHp <= 0) {
    battle.subPhase = 'end';
    battle.log.push('Your monster has fallen.');
    return true;
  }
  if (battle.enemy.currentHp <= 0) {
    battle.subPhase = 'end';
    battle.log.push('Enemy defeated!');
    return true;
  }
  return false;
}

function planActorSequence(pTempo: number, eTempo: number): ('player' | 'enemy')[] {
  let playerFirst =
    pTempo > eTempo || (pTempo === eTempo && Math.random() < 0.5);
  const queue: ('player' | 'enemy')[] = [];
  let pLeft = pTempo;
  let eLeft = eTempo;
  while (pLeft > 0 || eLeft > 0) {
    let actor: 'player' | 'enemy';
    if (pLeft === 0) actor = 'enemy';
    else if (eLeft === 0) actor = 'player';
    else actor = playerFirst ? 'player' : 'enemy';
    playerFirst = actor === 'enemy'; // swap
    queue.push(actor);
    if (actor === 'player') pLeft--;
    else eLeft--;
  }
  return queue;
}

function startNewTurn(battle: BattleState): void {
  battle.turn += 1;
  battle.subPhase = 'draw';

  battle.playerEnergy = ENERGY_PER_TURN;
  battle.enemyEnergy = ENERGY_PER_TURN;

  while (
    battle.playerHand.length < HAND_SIZE &&
    battle.playerHand.length < HAND_LIMIT
  ) {
    const next = drawOne(battle);
    if (!next) break;
    battle.playerHand.push(next);
  }

  battle.subPhase = 'cards';
  battle.log.push(`— Turn ${battle.turn} —`);

  battle.playerForcedTag = undefined;
  battle.playerForcedBonus = 0;
  battle.enemySkippedActions = 0;
  battle.revealedEnemyAction = undefined;
  battle.forceUsed = false;
  battle.pendingActors = [];
}

function drawOne(battle: BattleState): CardInDeck | null {
  if (battle.playerDeck.length === 0) {
    if (battle.playerDiscard.length === 0) return null;
    battle.playerDeck = shuffle(battle.playerDiscard);
    battle.playerDiscard = [];
  }
  return battle.playerDeck.pop() ?? null;
}

function applyPlayerCard(
  battle: BattleState,
  player: PlayerState,
  def: CardDef,
  cardLevel: number,
): void {
  const bonus = cardLevel - 1;

  switch (def.effect.kind) {
    case 'self_mod':
      player.monster.turnModifiers.push({
        stat: def.effect.stat,
        delta: def.effect.delta + (def.effect.delta > 0 ? bonus : -bonus),
        expiresIn: def.effect.duration,
      });
      return;
    case 'opponent_mod':
      battle.enemy.turnModifiers.push({
        stat: def.effect.stat,
        delta: def.effect.delta - (def.effect.delta < 0 ? bonus : 0),
        expiresIn: def.effect.duration,
      });
      return;
    case 'heal': {
      const maxHp = computeEffectiveStats(player.monster).hp;
      player.monster.currentHp = Math.min(
        maxHp,
        player.monster.currentHp + def.effect.amount + bonus,
      );
      return;
    }
    case 'force_action':
      battle.playerForcedTag = def.effect.mutationTag;
      battle.playerForcedBonus = def.effect.bonus ?? 0;
      return;
    case 'reveal': {
      const peek = chooseAction(battle.enemy, computeEffectiveStats(battle.enemy));
      battle.revealedEnemyAction = peek
        ? `${getMutation(peek.mutationId).name}: ${peek.action.description}`
        : 'no action available';
      battle.log.push(`Scan: enemy plans → ${battle.revealedEnemyAction}`);
      return;
    }
    case 'skip_opponent_action':
      battle.enemySkippedActions = (battle.enemySkippedActions ?? 0) + def.effect.count;
      return;
    case 'status_boost': {
      // Stacking: uses add, chance bonus takes the higher value.
      const existing = battle.playerStatusBoost;
      if (existing) {
        battle.playerStatusBoost = {
          chanceAdd: Math.max(existing.chanceAdd, def.effect.chanceAdd),
          uses: existing.uses + def.effect.uses,
        };
      } else {
        battle.playerStatusBoost = { chanceAdd: def.effect.chanceAdd, uses: def.effect.uses };
      }
      return;
    }
    case 'status_immune':
      battle.playerStatusImmune = (battle.playerStatusImmune ?? 0) + def.effect.uses;
      return;
    case 'cleanse':
      if (player.monster.statusEffects.length === 0) {
        battle.log.push('Antidote: no effects to remove.');
      } else {
        battle.log.push(`Antidote removes ${player.monster.statusEffects.length} status effect(s).`);
      }
      player.monster.statusEffects = [];
      return;
  }
}

function hasActiveStun(m: MonsterState): boolean {
  return m.statusEffects.some((e) => e.kind === 'stun' && e.remainingTurns > 0);
}

/**
 * Rolls status chance, applies boost/immunity, then pushes the effect or logs
 * the miss. Also updates `result` for UI rendering.
 */
function rollStatus(
  battle: BattleState,
  se: StatusEffectDef,
  target: MonsterState,
  attackerSide: 'player' | 'enemy',
  result: TickResult,
): void {
  // Base chance (undefined = 100%).
  let chance = se.chance ?? 1;
  let boosted = false;

  // Consume player boost.
  if (attackerSide === 'player' && battle.playerStatusBoost && battle.playerStatusBoost.uses > 0) {
    chance = Math.min(1, chance + battle.playerStatusBoost.chanceAdd);
    battle.playerStatusBoost.uses -= 1;
    boosted = true;
    if (battle.playerStatusBoost.uses <= 0) battle.playerStatusBoost = undefined;
  }

  const label = statusLabel(se);
  const chancePct = Math.round(chance * 100);
  result.statusLabel = label;
  result.statusChance = chance;

  const roll = Math.random();
  if (roll >= chance) {
    battle.log.push(`  → ${label} misses (chance ${chancePct}%${boosted ? ', boosted' : ''}).`);
    result.statusApplied = false;
    return;
  }

  // Incoming status on the player → check immunity.
  if (attackerSide === 'enemy' && (battle.playerStatusImmune ?? 0) > 0) {
    battle.playerStatusImmune = (battle.playerStatusImmune ?? 0) - 1;
    battle.log.push(`  → ${label} blocked (immunity).`);
    result.statusApplied = false;
    result.statusBlocked = true;
    return;
  }

  // Apply effect.
  target.statusEffects.push({
    kind: se.kind,
    value: se.value,
    remainingTurns: se.duration,
    ...(se.damageType ? { damageType: se.damageType } : {}),
  });
  battle.log.push(`  → ${label} lands (${chancePct}%${boosted ? ', boosted' : ''}).`);
  result.statusApplied = true;
}

function statusLabel(se: StatusEffectDef): string {
  if (se.kind === 'stun') return 'Stun';
  if (se.kind === 'debuff') return `Debuff ${se.value}`;
  // DoT variants named by type:
  switch (se.damageType) {
    case 'poison': return 'Poison';
    case 'fire': return 'Burn';
    case 'physical': return 'Bleed';
    case 'electric': return 'Overload';
    default: return 'DoT';
  }
}

function endOfTurnUpkeep(battle: BattleState, player: PlayerState): void {
  tickStatusAndModifiers(player.monster, battle.log, 'Your monster');
  tickStatusAndModifiers(battle.enemy, battle.log, 'Enemy');

  while (battle.playerHand.length > HAND_LIMIT) {
    const dropped = battle.playerHand.shift();
    if (dropped) battle.playerDiscard.push(dropped);
  }
}

function tickStatusAndModifiers(
  m: MonsterState,
  log: string[],
  label: string,
): void {
  for (const eff of m.statusEffects) {
    if (eff.kind === 'dot' && eff.remainingTurns > 0) {
      m.currentHp -= eff.value;
      log.push(`${label} takes ${eff.value} ${eff.damageType ?? ''} (DoT).`);
    }
    eff.remainingTurns -= 1;
  }
  m.statusEffects = m.statusEffects.filter((e) => e.remainingTurns > 0);

  for (const mod of m.turnModifiers) mod.expiresIn -= 1;
  m.turnModifiers = m.turnModifiers.filter((x) => x.expiresIn > 0);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function pickEnemy(player: PlayerState) {
  const playerTotal = player.monster.mutations.reduce((s, m) => s + m.level, 0);
  const wins = player.battlesWon;
  const archetype = ENEMY_LIST[Math.floor(Math.random() * ENEMY_LIST.length)]!;
  // Level scaling: player progress + half the win count (previously +wins →
  // too steep). Rounds up a bit so wins 1 already has an effect.
  const target = Math.max(3, playerTotal) + Math.ceil(wins / 2);
  const scaled = scaleEnemy(ENEMIES[archetype.id]!, target);
  return applyReinforcements(scaled, wins);
}

export function maxHp(m: MonsterState): number {
  return computeEffectiveStats(m).hp;
}
export function effectiveStats(m: MonsterState): StatBlock {
  return computeEffectiveStats(m);
}
