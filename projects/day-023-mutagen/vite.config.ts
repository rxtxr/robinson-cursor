import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Dev & build entry lives in src/. Build output is flattened into the project
// root so Astro's copy-to-embed picks up index.html + assets/ directly.
export default defineConfig({
  root: 'src',
  base: './',
  server: { port: 5173 },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
