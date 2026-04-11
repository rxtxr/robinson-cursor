// @ts-check
import { defineConfig } from 'astro/config';
import { cpSync, createReadStream, existsSync, lstatSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

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
  vite: {
    plugins: [{
      name: 'serve-embed-dev',
      configureServer(server) {
        // In dev mode, serve /embed/* from /projects/* (mirrors the build-time copy)
        server.middlewares.use('/embed', (req, res, next) => {
          const filePath = join(process.cwd(), 'projects', req.url);
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const ext = extname(filePath);
            const mimeTypes = {
              '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
              '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
              '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
              '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      }
    }],
  },
});
