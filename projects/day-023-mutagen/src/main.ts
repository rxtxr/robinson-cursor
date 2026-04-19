// Entry + screen router. Subscribes to the store and paints the matching screen.

import './style.css';
import { renderBattle } from './screens/battle.ts';
import { renderCreation } from './screens/creation.ts';
import { renderGameOver } from './screens/gameover.ts';
import { renderLevelup } from './screens/levelup.ts';
import { renderMenu } from './screens/menu.ts';
import { resetAll, subscribe } from './state/store.ts';

const root = document.getElementById('app');
if (!root) throw new Error('#app container missing in index.html');

subscribe((state) => {
  switch (state.phase) {
    case 'menu':      return renderMenu(root);
    case 'creation':  return renderCreation(root);
    case 'battle':    return renderBattle(root);
    case 'levelup':   return renderLevelup(root);
    case 'gameover':  return renderGameOver(root);
  }
});

// Global escape hatch: visible on every screen, wipes the save and returns to
// the menu. Rescues stuck states.
const restartBtn = document.getElementById('global-restart') as HTMLButtonElement | null;
if (restartBtn) {
  restartBtn.onclick = () => {
    if (confirm('Discard current run and restart?')) {
      resetAll();
    }
  };
}
