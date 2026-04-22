# Day 026 — /\\~~||

Three photos — mountain, forest, water — are decomposed into polygonal slices that drift horizontally across the viewport at staggered speeds. The title glyph `/\~~||` encodes the three motifs: the peak for the summit, the waves for the water, the bars for the tree trunks.

## Per-image pipeline

1. **Downsample** to a ~450–480 px analysis width.
2. **Per-pixel luminance** via Rec.709 (`0.2126·R + 0.7152·G + 0.0722·B`), optionally smoothed with a box blur.
3. **Background removal** by flood-filling from the viewport border — pixels reachable from the edge through same-dark (or same-bright) neighbours are excluded from the pipeline (used to drop the mountain photo's dark sky).
4. **Posterisation** into `numBands` equal-width luminance levels.
5. **Morphological opening + closing** on each binary level mask removes pixel noise and fills pinhole gaps.
6. **Connected components** per level via 4-neighbour flood fill.
7. **Moore boundary tracing** yields a pixel-exact outline for every component.
8. **Douglas–Peucker** simplifies that outline to a handful of image-salient corners.
9. **Variance filter** drops regions whose luminance standard deviation is near zero — texturally flat blobs like blown-out suns or pure shadows get rejected.
10. **Highlight roll-off** softly compresses near-white pixels back into the dynamic range (active on the forest image only, where the sun gap would otherwise dominate).

## Slice bake and animation

- Each simplified polygon gets a small offscreen canvas (bbox-sized); the cover-fitted source image is drawn in and then `destination-in`-clipped to the polygon outline.
- Every baked canvas is converted to an `ImageBitmap` — GPU-resident sources, so per-frame `drawImage` is a direct texture blit (roughly 5× faster than canvas sources on most systems).
- Slices below 300 CSS-px² bounding-box area are dropped (drawImage overhead without visible contribution).
- Each slice gets its own hash-derived velocity between 10 and 26 px/s, all pointing rightward.
- Per frame: `x = (boxX + t · velocity) mod W`, plus a second blit at `x - W` only when the slice currently wraps the right edge.

## Stack order

Back to front: **water → forest → mountain**. Every image has its own tuned configuration (`numBands`, `blurRadius`, morphology radii, `dpEpsilon`, `minStdDev`, …):

- **Mountain** — 5 bands, stronger blur, high `morphClose`, sky removed via border-flood background mask
- **Forest** — 8 bands to resolve the thin trunks, aggressive DP simplification, highlight compression to tame the sun gap, variance filter to kill the texturally flat blow-outs
- **Water** — 5 bands, moderate blur — crest highlights become horizontally striping slices

## Controls

None. Loads, runs, drifts. The composition is recomposed every frame by the differing slice velocities.

## Stack

- Vanilla HTML + JS, no libraries, no build step
- Canvas 2D API, `createImageBitmap` for GPU-backed slice sources
- No runtime dependencies

## Run locally

The AVIF source photographs live in `img/` and need an HTTP server:

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765/`.
