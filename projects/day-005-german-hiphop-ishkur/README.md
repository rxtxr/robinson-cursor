# Day 005 — German Hip Hop: Ishkur-Style Genre Map

Interactive genre map of German hip hop history, inspired by [Ishkur's Guide to Electronic Music](https://music.ishkur.com/). Iteration on the day-004 approach — this time with a Canvas-based horizontal timeline instead of D3/SVG.

**Note:** Content (genre names, descriptions, artist info) is in German. This is a German-language project.

## Features
- Horizontal genre bars spanning active years on a timeline
- Diagonal branch lines showing genre genealogy (parent/child)
- Click on any genre bar to open a detail panel with description, characteristics, regions, influences, artists, key tracks, and labels
- Zoomable (scroll) and pannable (drag) canvas
- Onboarding hints on first load
- Old School fade-in effect showing the genre's emergence

## Data
- 23 genres, 60+ artists, 38 key tracks, 10 labels
- Curated and validated: genre names, artist placements, regional origins, historical accuracy
- Extended and corrected from day-004 database

## Stack
Pure HTML/CSS/JavaScript with Canvas API — no external dependencies. Single file, no build process.
