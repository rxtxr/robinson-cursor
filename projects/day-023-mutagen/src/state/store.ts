// Global game state with a minimal subscribe pattern (no external library).

import type { GameState } from '../data/types.ts';
import { loadState, saveState } from './persistence.ts';

type Listener = (s: GameState) => void;

const initialState: GameState = loadState() ?? {
  phase: 'menu',
};

let state: GameState = initialState;
const listeners = new Set<Listener>();

export function getState(): GameState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(state); // prime with current state
  return () => listeners.delete(fn);
}

/** Updater must return a fresh state reference (no mutation). */
export function setState(updater: (prev: GameState) => GameState): void {
  state = updater(state);
  saveState(state);
  for (const fn of listeners) fn(state);
}

/** Full reset — wipes persistence and returns to menu. */
export function resetAll(): void {
  setState(() => ({ phase: 'menu' }));
}
