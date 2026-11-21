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

function detectWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

if (!detectWebGL2()) {
  const warning = document.createElement('p');
  warning.id = 'graphics-compatibility-warning';
  warning.className = 'graphics-compatibility-warning';
  warning.textContent = 'GRAFIS TIDAK DIDUKUNG: Browser tidak menyediakan WebGL 2. Aktifkan akselerasi perangkat keras dan perbarui driver grafis sebelum bermain.';
  document.querySelector('.menu-actions').after(warning);
  document.getElementById('start-button').disabled = true;
  document.getElementById('continue-button').disabled = true;
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('[FREKUENSI] Offline cache tidak tersedia:', error));
  });
}
