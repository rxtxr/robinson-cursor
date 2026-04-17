# Day 021 — Willie (v4)

Continuation of [Day 020](../day-020-willie/README.md). The day-20 pipeline was
flat-field + gentle deflicker + nlmeans denoise on the first minute and shipped
with stabilization, local-flicker, and a proper viewer still open. Day 21 closes
those gaps and runs on the full 7 min 40 s.

**Status:** complete.

## What's in the build

- `willie_full_restored.mp4` — full 7:40, HEVC CRF 36 (23 MB; fits Cloudflare's 25 MB per-file limit).
- `willie_original_60s.mp4` / `willie_restored_60s.mp4` — 60-second clips driving the before/after scrubber on the project page.
- `index.html` — scrubber (drag handle) + full-film tab + pipeline notes.
- `scripts/` — full, reproducible pipeline.

## Pipeline (v4)

```
raw
  → flatfield (temporal-median map, triple Gaussian blur r=100)
  → stabilize (ORB + RANSAC similarity, clamped deltas, smoothed trajectory)
  → deflicker global (v6 gentle: 64-pt percentile, 21-frame rolling mean, ±25% clamp, 80% blend)
  → deflicker residual (per-pixel temporal Gaussian σ=5, bilateral weight T=12, motion gate @ offsets ±1, ±σ, ±2σ)
  → nlmeans denoise + mild unsharp
```

See `scripts/run_full_pipeline.sh` for the exact invocation.

## What's new vs. day 20

### Stabilization that actually works on animation

Day 20 tried `vidstab` and the result wobbled more than the source — vidstab's
model fights hand-drawn character motion. Day 21 uses ORB features + RANSAC
`estimateAffinePartial2D` on consecutive frames (prev → curr ordering), which
lets the character features be outliers while the background wins the fit.
Per-pair deltas are clamped to ±8 px / ±0.6° / ±1 % scale so that scene cuts
and dark frames can't poison the cumulative trajectory. The trajectory is
then Gaussian-smoothed (σ=15 frames) and each frame is warped by
`smooth − raw` with `BORDER_REPLICATE`.

Correction magnitude ends up at σ ≈ 2 px, 0.08° — the classic gate-weave
profile.

### Residual per-pixel deflicker with motion gate

Day 20's v6 global deflicker left visible local flicker on mid-gray surfaces
(the wall behind the steering wheel). On stabilized frames, per-pixel temporal
smoothing directly eliminates this, but a naive smooth introduces ghosts both
before and after moving objects. Day 21's residual pass uses:

- **Bilateral weight**: `w = exp(-dev² / 2T²)` with `dev = orig − temporal_gaussian(orig)`. Small deviations (flicker-sized) get full correction; large deviations (character) are left alone.
- **Motion gate**: per pixel, `motion = max(|I_t − I_{t ± k}|)` sampled at offsets `k ∈ {1, σ, 2σ}` so the gate covers the Gaussian's full support. Multiplicative with `w`, it protects pixels that are about to move or just moved from the smoothing — no pre-ghost, no post-ghost.

### Full-length run

11 052 frames (7:40 @ 24 fps). Flat-field map recomputed from a full-film
sample — mean 135 vs. the 60-second test's 122, confirming the opening is
overall darker than the rest.

## Honest assessment

- Gate-weave stabilization: ✅ solid.
- Global flicker: ✅ reduced further by the residual pass; bright-gray and mid-gray walls now stable.
- Ghosting (pre- and post-motion): ✅ fixed by the 3-offset motion gate.
- Cel misregistration (Stage 2 from my first sketch — background-plate vs. character-cel drift): ⏳ not addressed. Would need separate figure/plate masks, then independent registration. Candidate for a follow-up day.
- 4× Real-ESRGAN upscale, RIFE 48 fps, audio hiss reduction: ⏳ future work.

## Dust / scratch

Skipped on purpose. The 1080p VP9 source scan is already dust/scratch-cleaned
upstream — a pass here would only risk eating line strokes (that's what the
day-20 v1 attempt did).

## Size budget

Cloudflare Pages limits single files to 25 MB. Encodes chosen to stay under that
while keeping h264 everywhere for browser compatibility:
- `willie_full_restored.mp4`: h264 2-pass at 340 kb/s video + AAC 56 kb/s, downscaled to 864×720 → 23 MB for the full 7:40.
- `willie_original_60s.mp4`: h264 CRF 23, full 1296×1080, AAC 96 kb/s → 19 MB.
- `willie_restored_60s.mp4`: h264 CRF 23, full 1296×1080, AAC 96 kb/s → 15 MB.

## Source & licensing

- Steamboat Willie (1928, Walt Disney / Ub Iwerks) — US public domain since 2024-01-01.
- OpenCV — Apache-2.0.
- NumPy / SciPy — BSD.
- Pillow — HPND.
- FFmpeg — LGPL/GPL.
