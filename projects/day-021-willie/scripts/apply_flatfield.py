#!/usr/bin/env python3
"""Standalone flat-field application.

Reuses the precomputed _flatfield_map.png (temporal median, triple-blurred)
and applies ff_target / flatfield correction, clamped to [0.7, 1.6].
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    ap.add_argument("--flatfield", required=True, help="Path to _flatfield_map.png")
    ap.add_argument("--pattern", default="frame_*.png")
    args = ap.parse_args()

    in_dir = Path(args.inp)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    flatfield = np.array(Image.open(args.flatfield).convert("L"),
                         dtype=np.float64)
    ff_target = flatfield.mean()
    ff_correction = np.where(flatfield > 10, ff_target / flatfield, 1.0)
    ff_correction = np.clip(ff_correction, 0.7, 1.6)
    print(f"[flatfield] target={ff_target:.1f} "
          f"range={ff_correction.min():.3f}-{ff_correction.max():.3f}")

    frames = sorted(in_dir.glob(args.pattern))
    if not frames:
        print(f"[flatfield] no frames in {in_dir}", file=sys.stderr)
        sys.exit(1)
    print(f"[flatfield] {len(frames)} frames")

    for i, fp in enumerate(frames):
        img = np.array(Image.open(fp), dtype=np.float64)
        if img.ndim == 2:
            img = img * ff_correction
        else:
            for c in range(img.shape[2]):
                img[:, :, c] = img[:, :, c] * ff_correction
        img = np.clip(img, 0, 255).astype(np.uint8)
        Image.fromarray(img).save(out_dir / fp.name)
        if (i + 1) % 200 == 0:
            print(f"[flatfield] {i+1}/{len(frames)}")
    print("[flatfield] done")


if __name__ == "__main__":
    main()
