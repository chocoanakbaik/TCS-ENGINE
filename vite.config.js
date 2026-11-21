import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, 'public'),
  publicDir: false,
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(rootDir, 'src/index.js'),
      name: 'TCSEngine',
      fileName: (format) => `tcs-engine.${format === 'es' ? 'es' : 'umd'}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['three'],
      output: { globals: { three: 'THREE' } }
    }
  }
});
