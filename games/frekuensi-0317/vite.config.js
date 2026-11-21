import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const gameDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(gameDir, '../..');

export default defineConfig({
  root: gameDir,
  base: './',
  publicDir: false,
  server: { host: '127.0.0.1', port: 4173, strictPort: true, open: false },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  resolve: { alias: { '@tcs-engine': resolve(repoRoot, 'src') } },
  build: {
    outDir: resolve(repoRoot, 'dist/frekuensi-0317'),
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three']
        }
      }
    }
  }
});
