# CLAUDE.md — robinson-cursor.com

This repo contains robinson-cursor.com, a 365-day vibecoding project.

## Critical Rules
- Read ROBINSON_CURSOR_CONTEXT.md for full project context
- Projects in /projects/ are frozen after publication
- Every new project needs meta.json and README.md
- No API keys in the repo
- Document all library licenses in meta.json
- Isolation: projects must not affect each other

## Thumbnails
Files must be named exactly (Astro globs these patterns):
- `thumb.png` — required, base thumbnail
- `thumb.webp` — full-size WebP for detail page
- `thumb-sm.webp` — small WebP for index cards (~400px wide)

Generate: `magick source.png -resize 1200x630 -quality 85 thumb.webp`
Small: `magick thumb.png -resize 400x -quality 80 thumb-sm.webp`

NOT `thumbnail.png` — that won't be found.

## GitHub Link in meta.json
```json
"github": "https://github.com/rxtxr/robinson-cursor/tree/main/projects/day-NNN-slug"
```
Repo is `rxtxr/robinson-cursor` (no `.com`). Path starts at `projects/`.

## Commits
Format: `day NNN: project-name — short description`
Example: `day 001: music-visualizer — webaudio fft canvas visualization`

## Deploy
git push main → Cloudflare Pages builds automatically
Preview: every branch gets its own preview URL
