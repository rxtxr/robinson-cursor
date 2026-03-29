// @ts-check
import { defineConfig } from 'astro/config';
import { cpSync, existsSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';

// Copy raw project files to dist/embed/ after Astro build completes
// Excludes: raw-data/, data/ (except frontend JSONs already in charts/),
// scripts/, .env, __pycache__, .duckdb, caches
function copyProjectsIntegration() {
  const EXCLUDE_DIRS = new Set(['raw-data', 'data', 'scripts', '__pycache__']);
  const EXCLUDE_FILES = [/^\.env$/, /\.duckdb$/, /\.duckdb\.wal$/];
  return {
    name: 'copy-projects',
    hooks: {
      'astro:build:done'() {
        const src = resolve('projects');
        const dest = resolve('dist/embed');
        if (existsSync(src)) {
          cpSync(src, dest, {
            recursive: true,
            filter: (source) => {
              const name = source.split('/').pop();
              if (lstatSync(source).isDirectory() && EXCLUDE_DIRS.has(name)) return false;
              if (EXCLUDE_FILES.some(p => p.test(name))) return false;
              return true;
            }
          });
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
