// @ts-check
import { defineConfig } from 'astro/config';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Copy raw project files to dist/embed/ after Astro build completes
function copyProjectsIntegration() {
  return {
    name: 'copy-projects',
    hooks: {
      'astro:build:done'() {
        const src = resolve('projects');
        const dest = resolve('dist/embed');
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true });
        }
      }
    }
  };
}

export default defineConfig({
  site: 'https://robinson-cursor.com',
  output: 'static',
  base: '/',
  integrations: [copyProjectsIntegration()],
});
