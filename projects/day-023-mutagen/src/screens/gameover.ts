// Game Over screen.

import { clearState } from '../state/persistence.ts';
import { getState, setState } from '../state/store.ts';

export function renderGameOver(root: HTMLElement): void {
  const wins = getState().player?.battlesWon ?? 0;
  root.innerHTML = `
    <div class="screen gameover">
      <h2>Game Over</h2>
      <p>Your monster fell after ${wins} ${wins === 1 ? 'win' : 'wins'}.</p>
      <button id="btn-new">New Monster</button>
    </div>
  `;
  root.querySelector<HTMLButtonElement>('#btn-new')!.onclick = () => {
    clearState();
    setState(() => ({ phase: 'creation' }));
  };
}
