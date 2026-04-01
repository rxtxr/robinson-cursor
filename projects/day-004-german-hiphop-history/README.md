# Day 004 — History of German Hip Hop BETA

Interactive genre history of German hip hop, inspired by Ishkur's Guide to Electronic Music.

**Iterated in [Day 005](../day-005-german-hiphop-ishkur/)** — the Ishkur-style Canvas visualization that this project was aiming for. Day 005 uses the curated data from this project with a completely rewritten rendering approach.

## Status: INCOMPLETE

The Temporal DAG / Phylogenetic Timeline visualization did not work as planned. After 3+ hours of iteration, the layout algorithm (parent-centered tree with bezier connections on a timeline) does not produce the clean "railroad map" aesthetic of the Ishkur reference. The current state is released as-is.

Known issues:
- Layout algorithm does not produce Ishkur-style flowing connections
- Genres not optimally positioned for visual genealogy tracing
- Data still inaccurate / incomplete in places

## What works
- 24 genres, 65 artists, 39 tracks, 11 labels, 33 connections from curated database
- Zoomable/pannable SVG canvas (D3.js)
- Click on genre → detail panel with full info
- Hover → highlights connected genres

## Stack
- D3.js v7 (ISC License) via CDN
- Single HTML file, no build process
