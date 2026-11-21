import { Game } from './game/Game.js';
import './style.css';

const game = new Game();
window.__FREKUENSI_GAME__ = game;

const continueButton = document.getElementById('continue-button');
continueButton.classList.toggle('hidden', !game.saves.hasSave());

document.addEventListener('contextmenu', event => {
  if (event.target.closest('#game-root')) event.preventDefault();
});

window.addEventListener('beforeunload', () => game.dispose(), { once: true });

if (!('WebGL2RenderingContext' in window)) {
  document.getElementById('start-button').addEventListener('click', event => {
    event.preventDefault();
    game.ui.showMessage('KOMPATIBILITAS GRAFIS', 'WebGL 2 tidak tersedia', 'Perbarui browser dan driver grafis, lalu pastikan akselerasi perangkat keras aktif.', 'TUTUP', () => game.ui.hideMessage());
  }, { capture: true, once: true });
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('[FREKUENSI] Offline cache tidak tersedia:', error));
  });
}
