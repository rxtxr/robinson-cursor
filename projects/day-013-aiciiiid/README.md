# Day 013 — AIciiiid!

Browser-based Roland TB-303 Bass Line simulator. Full step sequencer with classic acid synthesis.

## Features

- **Analog-modeled synth engine** — VCO (saw/square) through resonant VCF and VCA, all via Web Audio API
- **Step sequencer** — 16-step patterns with per-step note, accent, slide, rest, tie, and octave controls
- **Knob controls** — Tuning, Cutoff Frequency, Resonance, Envelope Mod, Decay, Accent
- **Pattern management** — 4 groups × 2 sections × 8 patterns
- **Keyboard input** — Chromatic keyboard for note entry in pattern write mode
- **Tempo control** — Adjustable BPM with real-time playback

## Controls

| Input | Effect |
|-------|--------|
| Pattern Write / Pattern Play | Switch between editing and playback mode |
| Knobs | Tweak synth parameters (cutoff, resonance, decay, etc.) |
| Step buttons | Navigate and edit sequencer steps |
| Keyboard | Enter notes in write mode |
| Accent / Slide / Rest / Tie | Per-step articulation modifiers |
| Oct up/down | Shift note octave |

## Stack

Single-file HTML/JS/CSS. Web Audio API for synthesis. Google Fonts (DSEG7 Classic) for the LED display.
