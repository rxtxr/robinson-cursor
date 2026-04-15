# Day 019 — Essentia Live

Real-time audio analysis of YouTube videos using [Essentia.js](https://mtg.github.io/essentia.js/) (MTG Barcelona) in the browser.

## Features

- YouTube audio via local yt-dlp proxy (with caching)
- Real-time analysis powered by Essentia.js (WASM):
  - **Mel Spectrogram** — 96-band scrolling waterfall
  - **Oscilloscope** — raw waveform display
  - **Frequency Spectrum** — log-scaled spectral bars
  - **Pitch Track** — scrolling pitch detection (YIN)
  - **Chromagram** — scrolling HPCP heatmap
  - **Key Detection** — musical key + scale with confidence
  - **Chroma / HPCP** — 12 pitch class bars
  - **MFCC** — 13 mel-frequency cepstral coefficients
  - **Spectral Contrast** — frequency band contrast
  - **Track Profile** — brightness, roughness, density, dynamics, tonality, mood and more
  - **Rhythm** — BPM, danceability, dynamic complexity (buffer analysis)
  - **Levels** — RMS, energy, spectral centroid, dissonance, inharmonicity

## Usage

1. Paste a YouTube URL or Video ID (default: Aphex Twin)
2. Click Load — audio is fetched via yt-dlp on the local server
3. Press play — analysis runs in real-time

## Tech

- Essentia.js 0.1.3 (AGPL-3.0) — WASM port of Essentia C++ library
- Web Audio API (ScriptProcessorNode for frame access)
- yt-dlp — server-side YouTube audio extraction
- Python dev server with audio caching
