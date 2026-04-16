# Day 020 — Willie

Restoration of [Steamboat Willie](https://en.wikipedia.org/wiki/Steamboat_Willie) (1928), the Walt Disney / Ub Iwerks short that entered the US public domain on January 1, 2024.

**Status:** work in progress. The published version is a 1-minute test pipeline (flat-field → deflicker → denoise). The project will continue later — see "Planned next steps" below.

## What's in the build

- `willie_test_denoised_1min.mp4` — first minute, flat-field + deflicker + nlmeans denoise
- `willie_test_compare_1min.mp4` — side-by-side original vs. denoised

## Pipeline (current)

1. Frame extraction (`ffmpeg` → PNG)
2. Flat-field correction — temporal median + 3× Gaussian blur r=100. Material has an asymmetric lighting gradient (lower-left corner ~23% darker), radial vignette filters don't fit.
3. Deflicker — per-band gain from 64 percentile points per frame, temporal window=21, clamped to ±25%, 80% blend. Gentle version of CDF matching (aggressive CDF produced cloud artifacts).
4. Denoise — `nlmeans=s=4:p=3:r=9`
5. Mild sharpen — `unsharp=3:3:0.4:3:3:0.0`
6. Re-mux with original audio

See `scripts/restore_v6.py` and `scripts/run_pipeline_test.sh`.

## Honest assessment

- **Flicker reduction:** good in dark/mid tones, still visibly insufficient in bright greys.
- **Stabilization:** failed. vidstab fights the hand-drawn motion and introduces wobble.
- **Noise reduction:** unsatisfying — grain is reduced but fine line strokes soften.
- **Dust/scratch cleanup:** failed. Temporal median destroys 1–2-frame line strokes (animation moves more per frame than live-action footage).
- **Upscale:** not yet applied here (Real-ESRGAN pipeline exists but /tmp overflowed on the first run — see `scripts/upscale_batched.sh`).
- **Shadow/vignette:** reduced via flat-field, but further tuning possible.
- Bottom line: archival film restoration is hard, and animation breaks most of the off-the-shelf tools.

## What didn't work (and why)

- **ffmpeg `deflicker` alone** — global only, doesn't touch local flicker.
- **Tile-based deflicker** — too coarse for mid-greys.
- **Per-pixel blur illumination** — cloud artifacts from content bleed.
- **Polynomial deflicker (3rd order)** — fits content, not flicker.
- **Histogram CDF matching (v5)** — best numeric flicker reduction (MaxΔ 1.7) but produces heavy cloud artifacts.
- **Temporal-median dust/scratch** — eats animation line strokes.
- **vidstab** — wobble on hand-drawn frames.
- **Lens correction** — no measurable barrel distortion in the source.
- **ffmpeg `vignette` filter** — radial, but the gradient is asymmetric.

## Planned next steps

- Revisit bright-grey flicker with a content-masked percentile gain (exclude the brightest highlights from LUT fitting).
- Real-ESRGAN 4× upscale in 100-frame batches, output to project disk (not `/tmp`).
- Unsharp pass after upscale.
- Optional RIFE frame interpolation to 48 fps.
- Audio hiss reduction on the original Opus track.
- Proper before/after viewer with scrubber (currently a static side-by-side).

## Source & licensing

- Steamboat Willie (1928) — public domain in the US since 2024-01-01.
- Real-ESRGAN — BSD-3-Clause.
- RIFE — MIT.
- FFmpeg — LGPL/GPL.
