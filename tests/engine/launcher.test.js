import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const launcher = await readFile(new URL('../../RUN-FREKUENSI.bat', import.meta.url), 'utf8');
const main = await readFile(new URL('../../games/frekuensi-0317/src/main.js', import.meta.url), 'utf8');
const game = await readFile(new URL('../../games/frekuensi-0317/src/game/Game.js', import.meta.url), 'utf8');

test('Windows launcher validates both Vite and Three.js before starting', () => {
  assert.match(launcher, /node_modules\\vite\\bin\\vite\.js/i);
  assert.match(launcher, /node_modules\\three\\build\\three\.module\.js/i);
  assert.match(launcher, /npm install --no-audit --no-fund/i);
});

test('Windows launcher asks Vite to open the browser after server startup', () => {
  assert.match(launcher, /dev:frekuensi -- --host 127\.0\.0\.1 --open/i);
  assert.doesNotMatch(launcher, /timeout \/t 2/i);
});

test('Game displays a visible compatibility warning when WebGL 2 is unavailable', () => {
  assert.match(main, /function detectWebGL2\(\)/);
  assert.match(main, /graphics-compatibility-warning/);
  assert.match(main, /start-button'\)\.disabled = true/);
});

test('Startup error refers to the actual Windows launcher filename', () => {
  assert.match(game, /RUN-FREKUENSI\.bat/);
});
