# Day 024 — Musical Gravity Field

A scatter plot of my 20-year listening history — 30.470 tracks arranged by tempo (X) against a second musical dimension (Y), tinted by mood / energy / scale and sized by plays.

## Axes

- **X: BPM** — tempo from 60 to 200, extracted via Essentia on AcousticBrainz
- **Y switchable:**
  - `Key` — chromatic pitch class (C → B)
  - `Regularity` — Essentia's "danceability" metric, which actually measures rhythmic self-similarity (Streich 2005 DFA). Relabeled because its native name is misleading — a steady heartbeat scores higher than a groovy funk track.
  - `Loud` — perceptual loudness, 0-1
  - `Complexity` — dynamic complexity, sqrt-scaled so the long tail doesn't flatten the bulk

## Color & size

- **Mood / Energy / Major-Minor** — three independent colorings, derived from Last.fm tags and AcousticBrainz features in the day-002 enrichment pipeline
- **Plays** — radius scales with play count; flip to `Equal` for uniform dot size
- Click a legend label to dim a category, revealing the rest

## Known data quirks

AcousticBrainz tempo has a hard cap at ~185 BPM and frequently reports double-tempo (e.g. Paper Planes at 172 instead of 86). Clipping or folding those values just moves the artefact elsewhere, so the chart shows them honestly. The X-axis extends to 200 because there's no real data above 185.

The `Regularity` axis is an intentional rename: Essentia's `danceability` is a rhythm-regularity score, not a dancefloor one. Steady minimal trip-hop and Geiger-counter click tracks score near the top; grooving funk tracks sit in the middle. The data is correct — the original label was just misleading.

## Stack

- Vanilla HTML + Canvas 2D, no libraries
- Pre-computed `scatter_data.json` (~4 MB) from the day-002 music-charts enrichment pipeline

## Run locally

Any static HTTP server in the project root:

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765/`.
