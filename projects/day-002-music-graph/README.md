# Day 002 — Music Graph

Personal music charts spanning 20 years of listening history (2005-2026).

## Charts

- **Heart Top 100** — Songs ranked by intentional plays, penalizing instant skips and algorithmic inflation. Anomaly detection normalizes years with high skip rates.
- **Algo Top 100** — Raw play count ranking with correction column showing where each song lands in the organic scoring.
- **Decade Charts** — Top 100 songs and albums per decade, styled to match the era: classic billboard (pre-2000), web 1.0 (2000s), flat design (2010s), Spotify-style (2020s).
- **Yearly Charts** — Year-end top songs and albums for each year, automatically styled by era.
- **Newcomer Top 20** — Artists and tracks first heard in the last 12 months.

## Data Pipeline

Raw listening data was processed locally with DuckDB, enriched via MusicBrainz, Wikidata, Last.fm, and Spotify APIs, then exported as compact JSON for static deployment. No server-side dependencies.

### Data Normalization

- 28 non-music artists excluded (audiobooks, podcasts)
- 53 artist name variants merged to canonical forms
- 4 track renames fixing mis-scrobbles
- 23 anomaly years detected and neutralized (high play + high skip rate patterns)

## Stack

- Vanilla JS + Google Fonts for themed chart rendering
- Pre-computed JSON data (~444 KB total)
- Static deployment on Cloudflare Pages
