#!/usr/bin/env python3
"""Compute a flat-field map from a temporal median of sampled frames,
then triple-apply a large Gaussian blur to strip all content.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True,
                    help="Path to _flatfield_map.png")
    ap.add_argument("--pattern", default="frame_*.png")
    ap.add_argument("--step", type=int, default=8,
                    help="Sample every Nth frame (lower = more memory)")
    ap.add_argument("--blur", type=int, default=100)
    ap.add_argument("--blur-passes", type=int, default=3)
    args = ap.parse_args()

    in_dir = Path(args.inp)
    paths = sorted(in_dir.glob(args.pattern))
    if not paths:
        print(f"[ff] no frames in {in_dir}", file=sys.stderr)
        sys.exit(1)

    sample = paths[::args.step]
    print(f"[ff] {len(paths)} frames, sampling every {args.step} = "
          f"{len(sample)} samples")

    first = np.array(Image.open(sample[0]).convert("L"), dtype=np.uint8)
    h, w = first.shape
    stack = np.zeros((len(sample), h, w), dtype=np.uint8)
    stack[0] = first
    for i, p in enumerate(sample[1:], start=1):
        stack[i] = np.array(Image.open(p).convert("L"), dtype=np.uint8)
        if (i + 1) % 200 == 0:
            print(f"[ff] loaded {i+1}/{len(sample)}")

    print("[ff] computing per-pixel temporal median ...")
    median_frame = np.median(stack, axis=0).astype(np.uint8)
    del stack

    pil = Image.fromarray(median_frame)
    for _ in range(args.blur_passes):
        pil = pil.filter(ImageFilter.GaussianBlur(radius=args.blur))
    pil.save(args.out)
    arr = np.array(pil, dtype=np.float64)
    print(f"[ff] saved {args.out}, mean={arr.mean():.1f} "
          f"range={arr.min():.1f}-{arr.max():.1f}")


if __name__ == "__main__":
    main()
