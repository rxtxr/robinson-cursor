# Day 013 — AIciiiid!

Browser-based acid bass machine with TB-303-style synthesis, drum machine, and step sequencer.

## Features

- **303-style synth engine** — VCO (saw/square) through resonant 18dB/oct VCF and VCA via Web Audio API
- **Authentic acid circuit** — Separate accent spike, RC-decay filter envelope, fixed 60ms slide glide
- **Step sequencer** — 8/12/16-step patterns with per-step note, accent, slide, rest, tie, and octave
- **Drum machine** — 8 channels (kick, snare, closed/open hat, clap, rim, tom, cymbal), 909-style synthesis
- **Preset bank** — 8 presets named after acids, including verified transcriptions
- **Knob controls** — Tuning, Cutoff, Resonance, Envelope Mod, Decay, Accent, Tempo, Volume
- **Pattern management** — 4 groups × 2 sections × 8 patterns with localStorage persistence
- **Live scope** — Fullscreen oscilloscope background visualization

## Controls

| Input | Effect |
|-------|--------|
| SAW / SQU toggle | Switch oscillator waveform |
| Run / Stop | Toggle sequencer playback |
| Pattern Write / Play | Switch between editing and playback mode |
| Knobs (drag up/down) | Tweak synth and drum parameters |
| Step cells | Select step for editing |
| Keyboard | Enter notes in write mode |
| 8 / 12 / 16 buttons | Set pattern length |
| Accent / Slide / Rest / Tie | Per-step articulation modifiers |
| Drum grid | Toggle drum hits per channel per step |

## Stack

Single-file HTML/JS/CSS (~2000 lines), zero dependencies. Web Audio API for all synthesis. Google Fonts (DSEG7 Classic) for LED display.
