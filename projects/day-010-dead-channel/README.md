# Day 010 — Dead Channel

> "The sky above the port was the colour of television, tuned to a dead channel."  
> — William Gibson, *Neuromancer* (1984)

A visualization of the iconic opening line. An industrial skyline photo used as a mask over WebGL shader-based TV static noise, layered with cloud textures and a semi-transparent water reflection.

## Tech

- **WebGL** fullscreen fragment shader for TV static noise
- Adaptive local threshold mask (integral image) to extract the skyline silhouette from a photo
- Two cloud photo textures with UV warping, crossfade morphing and tonal shifting
- Sky gradient (dusk/night atmosphere)
- Semi-transparent water zone with noise bleed-through
- No framework, no external dependencies
