import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const gameRoot = resolve(here, '../../games/frekuensi-0317');

test('Game UI element references exist in the game HTML', async () => {
  const html = await readFile(resolve(gameRoot, 'index.html'), 'utf8');
  const ui = await readFile(resolve(gameRoot, 'src/ui/UI.js'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
  const referenced = new Set([...ui.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(match => match[1]));
  const missing = [...referenced].filter(id => !ids.has(id));
  assert.deepEqual(missing, []);
});

test('Game entry point and CSS are wired into the HTML document', async () => {
  const html = await readFile(resolve(gameRoot, 'index.html'), 'utf8');
  assert.match(html, /src="\.\/src\/main\.js"/);
  assert.match(html, /href="\.\/src\/style\.css"/);
  assert.match(html, /id="world-layer"/);
  assert.match(html, /id="frequency-slider"/);
});
