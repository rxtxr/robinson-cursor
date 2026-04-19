// Central types for Mutagen — source: CLAUDE.md §"Central Types".
// All other modules import only from here, so the data schema has a single
// definition site.

export type DamageType = 'physical' | 'poison' | 'fire' | 'electric';
export type MutationSlot = 'front' | 'head' | 'body' | 'skin' | 'back';

export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  tempo: number;
  poison: number;
  fire: number;
  electric: number;
  toughness: number;
}

export interface StatusEffectDef {
  kind: 'dot' | 'debuff' | 'stun';
  value: number;
  duration: number;
  // DoT types need the damage type later in combat — optional, since stun/debuff don't use it.
  damageType?: DamageType;
  // 0..1 — chance the effect lands on hit. Undefined = deterministic (100%).
  chance?: number;
}

export interface DiceSpec {
  count: number;  // number of dice (N in NdX)
  sides: number;  // sides per die (X in NdX)
}

export interface ActionDef {
  type: DamageType;
  dice: DiceSpec;          // dice roll: NdX, e.g. 2d6 or 1d20
  statusEffect?: StatusEffectDef;
  description: string;
  // If set: ignores this fraction of the defender's defense (0..1).
  ignoreDefensePct?: number;
}

export interface MutationDef {
  id: string;
  name: string;
  cost: number;
  slot: MutationSlot;
  statBonuses: Partial<StatBlock>;
  action?: ActionDef;            // undefined = passive
  isFusion?: boolean;
  fusionParents?: [string, string];
  // Tooltip copy; not required by CLAUDE.md but handy for the UI.
  description?: string;
}

export interface MonsterState {
  mutations: { id: string; level: number }[];
  currentHp: number;
  statusEffects: ActiveStatusEffect[];
  turnModifiers: TurnModifier[];
}

export interface ActiveStatusEffect {
  kind: 'dot' | 'debuff' | 'stun';
  damageType?: DamageType;
  value: number;
  remainingTurns: number;
  // For debuffs: which stat is hit. Unused for DoT/stun.
  stat?: keyof StatBlock;
}

export interface TurnModifier {
  stat: keyof StatBlock;
  delta: number;
  expiresIn: number; // turns
}

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  effect: CardEffect;
  description: string;
  // Curses are injected into the deck by defeated enemies. UI renders them red.
  curse?: boolean;
}

export type CardEffect =
  | { kind: 'self_mod'; stat: keyof StatBlock; delta: number; duration: number }
  | { kind: 'opponent_mod'; stat: keyof StatBlock; delta: number; duration: number }
  // force_action forces the next attack's action family; bonus adds to the
  // roll max of that attack.
  | { kind: 'force_action'; mutationTag: 'poison' | 'physical' | 'fire' | 'electric'; bonus?: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'reveal' }
  | { kind: 'skip_opponent_action'; count: number }
  // Status mechanics:
  // status_boost adds `chanceAdd` (e.g. 0.5) to the player's next `uses`
  // status rolls. status_immune blocks the next `uses` incoming status
  // effects. cleanse removes all active statuses from self.
  | { kind: 'status_boost'; chanceAdd: number; uses: number }
  | { kind: 'status_immune'; uses: number }
  | { kind: 'cleanse' };

export interface CardInDeck {
  defId: string;
  level: number;
}

export interface BattleState {
  enemy: MonsterState;
  enemyArchetype: string;
  turn: number;
  playerHand: CardInDeck[];
  playerDeck: CardInDeck[];
  playerDiscard: CardInDeck[];
  playerEnergy: number;
  enemyEnergy: number;
  log: string[];
  subPhase: 'draw' | 'cards' | 'autobattle' | 'end';
  // Action queue for auto-battle — planAutobattle() fills it, tickAutobattle()
  // drains it one step at a time.
  pendingActors?: ('player' | 'enemy')[];
  // Transient: has the force tag (focus card) already been consumed?
  forceUsed?: boolean;
  playerForcedTag?: 'poison' | 'physical' | 'fire' | 'electric';
  playerForcedBonus?: number;
  enemySkippedActions?: number;
  revealedEnemyAction?: string;
  // Status boost (Catalyst): +chanceAdd on the next `uses` player status rolls.
  playerStatusBoost?: { chanceAdd: number; uses: number };
  // Status immunity: blocks the next N incoming status effects on the player.
  playerStatusImmune?: number;
}

export interface PlayerState {
  monster: MonsterState;
  deck: CardInDeck[];
  skillPoints: number;
  battlesWon: number;
  // Card id of a freshly cursed deck; the levelup screen shows a banner for it.
  pendingCurseNotice?: string;
}

export interface GameState {
  phase: 'menu' | 'creation' | 'battle' | 'levelup' | 'gameover';
  // Optional: in a fresh state (pre-creation) no player exists yet.
  player?: PlayerState;
  battle?: BattleState;
}

// Enemy archetype: spawn-time definition, before it becomes a MonsterState.
export interface EnemyArchetype {
  id: string;
  name: string;
  description: string;
  mutations: { id: string; level: number }[];
}
