// Main menu. Shows "New Game" and "Continue" (latter disabled without a save).

import { clearState } from '../state/persistence.ts';
import { getState, setState } from '../state/store.ts';

export function renderMenu(root: HTMLElement): void {
  const s = getState();
  const hasSave = !!s.player;
  const wins = s.player?.battlesWon ?? 0;

  root.innerHTML = `
    <div class="menu">
      <h1>Mutagen</h1>
      <p class="subtitle">Build a monster. Fight. Survive.</p>
      <div class="menu-buttons">
        <button id="btn-new">New Game</button>
        <button id="btn-continue" ${hasSave ? '' : 'disabled'}>
          Continue ${hasSave ? `(${wins} ${wins === 1 ? 'win' : 'wins'})` : ''}
        </button>
      </div>
    </div>
  `;

  root.querySelector<HTMLButtonElement>('#btn-new')!.onclick = () => {
    clearState();
    setState(() => ({ phase: 'creation' }));
  };
  root.querySelector<HTMLButtonElement>('#btn-continue')!.onclick = () => {
    if (!hasSave) return;
    // If we were mid-battle, resume there; otherwise jump into the next battle from menu.
    if (s.battle) {
      setState((p) => ({ ...p, phase: 'battle' }));
    } else {
      // Battle start happens in the phase switch in main.ts.
      setState((p) => ({ ...p, phase: 'battle', battle: undefined }));
    }
  };
}
