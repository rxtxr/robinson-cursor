#!/usr/bin/env python3
"""Per-pixel temporal bilateral deflicker.

Designed to eliminate residual local flicker (wall tones, steering wheel,
etc.) that survives global percentile-gain deflickering. Requires
stabilized input.

Method (per pixel):
  s(t) = gaussian_1d(orig(t), sigma) along time axis
  dev(t) = orig(t) - s(t)
  w(t) = exp(-dev(t)^2 / (2 * T^2))
  out_gray(t) = w*s(t) + (1-w)*orig(t)
  # apply as luminance ratio to RGB
  ratio = out_gray / orig_gray  (clipped)
  rgb_out = rgb_in * ratio

Small deviations (flicker): w->1, pixel pulled toward temporal smooth -> flat.
Large deviations (character passing): w->0, original preserved.

Processed in overlapping chunks to bound memory.
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    ap.add_argument("--pattern", default="frame_*.png")
    ap.add_argument("--sigma", type=float, default=5.0,
                    help="Temporal Gaussian sigma in frames")
    ap.add_argument("--threshold", type=float, default=12.0,
                    help="Bilateral weight T in gray levels (0-255)")
    ap.add_argument("--chunk", type=int, default=240,
                    help="Frames per chunk (inner)")
    ap.add_argument("--overlap", type=int, default=30,
                    help="Overlap frames on each side for Gaussian context")
    ap.add_argument("--clip-ratio", type=float, default=0.25,
                    help="Clip per-pixel luminance correction to [1-x, 1+x]")
    ap.add_argument("--motion-scale", type=float, default=6.0,
                    help="Motion gate scale in gray levels. Pixels with "
                         "temporal neighbor-diff >> this are protected. "
                         "0 disables the gate.")
    args = ap.parse_args()

    in_dir = Path(args.inp)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = sorted(in_dir.glob(args.pattern))
    N = len(paths)
    if N < 2:
        print("[res-deflick] need >=2 frames", file=sys.stderr)
        sys.exit(1)

    first = np.array(Image.open(paths[0]).convert("L"))
    H, W = first.shape
    print(f"[res-deflick] {N} frames {W}x{H} sigma={args.sigma} "
          f"T={args.threshold} chunk={args.chunk} overlap={args.overlap}")

    T = args.threshold
    cr_lo = 1.0 - args.clip_ratio
    cr_hi = 1.0 + args.clip_ratio

    t0 = time.time()
    for chunk_start in range(0, N, args.chunk):
        chunk_end = min(N, chunk_start + args.chunk)
        a = max(0, chunk_start - args.overlap)
        b = min(N, chunk_end + args.overlap)
        npad = b - a
        inner_a = chunk_start - a
        inner_b = inner_a + (chunk_end - chunk_start)

        # load gray stack for this window
        stack = np.zeros((npad, H, W), dtype=np.float32)
        for j in range(npad):
            stack[j] = np.array(Image.open(paths[a + j]).convert("L"),
                                dtype=np.float32)

        # temporal gaussian along axis 0
        smoothed = gaussian_filter1d(stack, sigma=args.sigma, axis=0,
                                     mode="reflect")

        # process inner frames
        M = args.motion_scale
        for k, i in enumerate(range(chunk_start, chunk_end)):
            idx = inner_a + k
            og = stack[idx]
            sg = smoothed[idx]
            dev = og - sg
            w = np.exp(-(dev * dev) / (2.0 * T * T))
            # motion gate: max neighbor-diff sampled at multiple offsets
            # covering the Gaussian support, so we catch approaching
            # motion (pre-ghost) as well as receding motion (post-ghost).
            if M > 0:
                s = max(1, int(round(args.sigma)))
                offsets = (1, s, 2 * s)
                motion = np.zeros_like(og)
                for off in offsets:
                    for dj in (-off, off):
                        j = idx + dj
                        if j < 0 or j >= npad:
                            continue
                        diff = np.abs(og - stack[j])
                        np.maximum(motion, diff, out=motion)
                m_gate = np.exp(-(motion * motion) / (2.0 * M * M))
                w = w * m_gate
            out_gray = w * sg + (1.0 - w) * og
            # apply as ratio to RGB
            rgb = np.array(Image.open(paths[i]).convert("RGB"),
                           dtype=np.float32)
            ratio = np.where(og > 2.0, out_gray / np.maximum(og, 1.0), 1.0)
            ratio = np.clip(ratio, cr_lo, cr_hi).astype(np.float32)
            rgb *= ratio[..., None]
            rgb = np.clip(rgb, 0, 255).astype(np.uint8)
            Image.fromarray(rgb).save(out_dir / paths[i].name)

        del stack, smoothed
        dt = time.time() - t0
        print(f"[res-deflick] chunk {chunk_start}..{chunk_end} "
              f"({chunk_end}/{N}) {dt:.1f}s")

    print("[res-deflick] done")


if __name__ == "__main__":
    main()
