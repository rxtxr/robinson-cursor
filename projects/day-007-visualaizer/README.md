# Day 007 — visualAIzer

Milkdrop-inspired browser music visualizer with 3D metallic text tunnel and beat-driven scene switching.

## Features

- WebGL moiré shader (from Day 001) with audio-reactive parameters
- Real 3D extruded metallic text (Three.js TextGeometry + PBR material) arranged as tunnel rings
- 8 visualization scenes with distinct character
- Beat-detected scene switching — intensity-aware (4otf kicks + offbeats at high energy)
- Drag & drop or browse to add your own audio files
- Keyboard control: 1-8 select scene, 0 = auto

## Scenes

| Key | Name | Character |
|-----|------|-----------|
| 1 | Tunnel | Classic straight-on view |
| 2 | Angled | Camera orbits, depth reacts to hits |
| 3 | Wireframe | Stripped geometry, extreme reactivity |
| 4 | Flythrough | Fast rush through tunnel |
| 5 | Vortex | Spiral, bass zooms FOV, per-letter depth |
| 6 | Breathing | Slow meditative pulse |
| 7 | Chaos | Erratic camera, wireframe flickers on hits |
| 8 | Monolith | Static front, deep bass extrusion |

## Bundled Tracks

| Track | Artist | License |
|-------|--------|---------|
| Arrive to Asgardia | EJAY IVAN LAC | [CC BY-ND 3.0](https://creativecommons.org/licenses/by-nd/3.0/) |

## How it works

- Web Audio API FFT analysis splits into bass (20-200Hz), mid (200-2kHz), treble (2k-16kHz)
- Moiré shader uniforms (frequency, rotation, zoom, amplitude) modulated by audio bands
- Three.js scene with TextGeometry, MeshStandardMaterial (metalness 0.95), environment map
- Beat detection via bass transients + mid/treble offbeats, intensity-scaled cooldown and probability
