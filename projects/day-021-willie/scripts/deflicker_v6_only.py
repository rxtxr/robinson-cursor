#!/usr/bin/env python3
"""Standalone v6-style gentle deflicker (no flat-field).

Port of the deflicker portion of restore_v6.py, operating on frames that
are already flat-field corrected. Keeps the original's parameters:
  - 64 percentile anchors (2..98)
  - temporal window 21 (rolling mean over percentile curves)
  - LUT smoothed with uniform_filter size=25
  - gain clamped to [0.8, 1.25]
  - blend strength 0.8 with identity
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter1d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    ap.add_argument("--pattern", default="frame_*.png")
    ap.add_argument("--window", type=int, default=21)
    ap.add_argument("--strength", type=float, default=0.8,
                    help="Blend with identity (1.0 = full, 0 = no deflicker)")
    ap.add_argument("--num-pts", type=int, default=64)
    ap.add_argument("--lut-smooth", type=int, default=25)
    ap.add_argument("--clamp-low", type=float, default=0.8)
    ap.add_argument("--clamp-high", type=float, default=1.25)
    args = ap.parse_args()

    in_dir = Path(args.inp)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    paths = sorted(in_dir.glob(args.pattern))
    n = len(paths)
    if n < 2:
        print("[v6-deflick] need at least 2 frames", file=sys.stderr)
        sys.exit(1)
    print(f"[v6-deflick] {n} frames window={args.window} "
          f"strength={args.strength}")

    pct_points = np.linspace(2, 98, args.num_pts)

    # pass 1: per-frame percentile curves (on gray)
    percentiles = np.zeros((n, args.num_pts), dtype=np.float64)
    for i, fp in enumerate(paths):
        gray = np.array(Image.open(fp).convert("L"), dtype=np.float64)
        percentiles[i] = np.percentile(gray, pct_points)
        if (i + 1) % 200 == 0:
            print(f"[v6-deflick] pct {i+1}/{n}")

    # pass 2: temporal rolling mean
    half_w = args.window // 2
    pct_smooth = np.zeros_like(percentiles)
    for i in range(n):
        a = max(0, i - half_w)
        b = min(n, i + half_w + 1)
        pct_smooth[i] = percentiles[a:b].mean(axis=0)

    # pass 3: apply per-frame LUT via luminance ratio
    for i, fp in enumerate(paths):
        rgb = np.array(Image.open(fp).convert("RGB"), dtype=np.float64)

        orig = percentiles[i]
        target = pct_smooth[i]
        gains = np.where(orig > 3, target / orig, 1.0)
        lut_gains = np.interp(np.arange(256), orig, gains)
        lut_gains = uniform_filter1d(lut_gains, size=args.lut_smooth)
        lut_gains = np.clip(lut_gains, args.clamp_low, args.clamp_high)
        lut_gains = 1.0 + args.strength * (lut_gains - 1.0)

        gray_u8 = np.clip(rgb.mean(axis=2), 0, 255).astype(np.uint8)
        new_vals = np.clip(np.arange(256, dtype=np.float64) * lut_gains,
                           0, 255)
        old_vals = gray_u8.astype(np.float64)
        ratio = np.where(old_vals > 2,
                         new_vals[gray_u8] / np.maximum(old_vals, 1), 1.0)
        ratio = np.clip(ratio, args.clamp_low, args.clamp_high)
        for c in range(3):
            rgb[:, :, c] *= ratio
        rgb = np.clip(rgb, 0, 255).astype(np.uint8)
        Image.fromarray(rgb).save(out_dir / fp.name)

        if (i + 1) % 100 == 0:
            print(f"[v6-deflick] apply {i+1}/{n}")
    print("[v6-deflick] done")


if __name__ == "__main__":
    main()
