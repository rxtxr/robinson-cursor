# Day 008 — 20 Years Wrapped pt. I

Interactive visualization of 20 years of listening history (2006–2025), built from enriched data across Last.fm, Spotify, ListenBrainz, MusicBrainz, and Discogs.

## Visualizations

### Genre Timeline (Streamgraph)
Normalized stacked area chart showing genre proportions per year. Toggle between 17 detail genres and 8 grouped super-categories. Peak dots mark each genre's highest-share year with top 3 artists on hover.

### Artist Similarity Network
Force-directed graph of 3,269 artists connected by Last.fm similarity (4,977 edges). Node size = play count, color = genre. Filterable by min plays and min similarity weight.

### Credits Network
Producer, remix, and collaboration connections between the top 500 most-played artists via Discogs credits. Hover/click highlights direct connections. Color-coded by role (Remix, Producer, Featuring, etc.).

## Data pipeline

Source: `projects/day-002-music-charts/data/music.duckdb`

- Genre mapping: Discogs styles > Last.fm tags > Spotify genres, normalized to 17 categories
- Non-music filtering: audiobooks, Hörspiele, children's content excluded
- Audio features from AcousticBrainz (BPM, danceability, mood)

## Stack

D3.js v7, vanilla JS/CSS, data pre-extracted as JSON from DuckDB.
