# CLAUDE.md — robinson-cursor.com

This repo contains robinson-cursor.com, a 365-day vibecoding project.

## Critical Rules
- Read ROBINSON_CURSOR_CONTEXT.md for full project context
- Projects in /projects/ are frozen after publication
- Every new project needs meta.json and README.md
- No API keys in the repo
- Document all library licenses in meta.json
- Isolation: projects must not affect each other

## Commits
Format: `day NNN: project-name — short description`
Example: `day 001: music-visualizer — webaudio fft canvas visualization`

## Deploy
git push main → Cloudflare Pages builds automatically
Preview: every branch gets its own preview URL
