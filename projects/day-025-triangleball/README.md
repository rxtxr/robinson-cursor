# Day 025 — Triangleball

A deforming polygonal sphere: 5,120 triangles of anthracite PBR metal, wrapped in a neon-purple wireframe that blooms. The mesh never sits still — five deformation modes cross-fade continuously so shape transitions are seamless.

## Modes

All five are evaluated every frame and weighted-summed by smooth cosine bumps around a 55-second cycle. There's never a moment where the mesh rests on its base shape between modes.

1. **radial-big** — wide, slow rings from the +Z pole with ~2× amplitude. Camera holds still while this mode dominates so the pulse reads cleanly.
2. **radial-pulse** — tighter, faster rings, smaller amplitude. Blends out of mode 1.
3. **noise-breath** — layered 3D value noise with a global breathing pulse. Integer bit-mix hash in the hot path, no transcendentals.
4. **twist-spiral** — rotation around Y proportional to height, plus a small radial ripple.
5. **axial-waves** — sine waves on all three axes, with a tangential sway.

## Rendering

- `IcosahedronGeometry` at detail 4 → 5,120 triangles (non-indexed, flat-shaded via `dFdx`/`dFdy` in the fragment shader — so no CPU normal recomputation)
- Anthracite `MeshStandardMaterial` with `RoomEnvironment` PMREM for reflections (metalness 0.82, roughness 0.48)
- `LineSegments2` / `LineMaterial` renders each edge as a screen-space quad with smooth alpha-AA — avoids the staircase that 1-pixel GL lines show at any internal→display downscale
- HDR-boosted purple line color so bloom threshold can fire only on lines, not on surface specular
- `UnrealBloomPass` with threshold 0.85 and moderate strength/radius
- Internal 1920×1080 render with MSAA 4× on the composer target. Half-res is ~¼ the bloom GPU cost of 4K; MSAA restores geometric edge AA on the surface

## Controls

No controls. Watch it breathe.

## Stack

- [Three.js 0.161](https://threejs.org/) (MIT) via [unpkg](https://unpkg.com/) — core, postprocessing, environments, lines addons
- Vanilla HTML + ES modules. No bundler, no build step.

## Run locally

Any static server at the project root:

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765/`.
