// LocalStorage persistence. Writes the whole state as JSON on every setState.
// Small enough that fragmentation isn't an issue.

import type { GameState } from '../data/types.ts';

const KEY = 'mutagen.state.v1';

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full / disabled → ignore so the game keeps running.
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
