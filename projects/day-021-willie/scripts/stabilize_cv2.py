#!/usr/bin/env python3
"""Stage 1 stabilizer for cartoon film gate-weave.

Pipeline:
  1. ORB features per frame, match consecutive pairs (BF + ratio).
  2. RANSAC similarity fit (translation + rotation + scale).
     Character motion becomes outliers -> background wins the fit.
  3. Cumulative trajectory -> Gaussian-smoothed trajectory.
  4. Per-frame correction = smoothed - raw; warpAffine with BORDER_REPLICATE.

Outputs stabilized PNGs and a transforms.npy with per-frame (dx, dy, da, ds).
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d


def detect_and_match(prev_gray, curr_gray, orb, bf, ratio=0.75, max_kp=2000):
    kp1, des1 = orb.detectAndCompute(prev_gray, None)
    kp2, des2 = orb.detectAndCompute(curr_gray, None)
    if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
        return None, None, 0
    # knnMatch k=2 for Lowe ratio
    matches = bf.knnMatch(des1, des2, k=2)
    good = []
    for m in matches:
        if len(m) < 2:
            continue
        a, b = m
        if a.distance < ratio * b.distance:
            good.append(a)
    if len(good) < 10:
        return None, None, 0
    pts1 = np.float32([kp1[m.queryIdx].pt for m in good])
    pts2 = np.float32([kp2[m.trainIdx].pt for m in good])
    return pts1, pts2, len(good)


def decompose_affine(M):
    """M is 2x3. Returns (dx, dy, angle_rad, scale)."""
    dx = float(M[0, 2])
    dy = float(M[1, 2])
    a = float(M[0, 0])
    b = float(M[1, 0])
    scale = float(np.sqrt(a * a + b * b))
    angle = float(np.arctan2(b, a))
    return dx, dy, angle, scale


def compose_affine(dx, dy, angle, scale):
    ca = np.cos(angle) * scale
    sa = np.sin(angle) * scale
    M = np.array([[ca, -sa, dx], [sa, ca, dy]], dtype=np.float64)
    return M


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True, help="Input frame dir")
    ap.add_argument("--out", dest="out", required=True, help="Output frame dir")
    ap.add_argument("--pattern", default="frame_%05d.png")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--count", type=int, default=0, help="0 = all")
    ap.add_argument("--smooth-sigma", type=float, default=15.0,
                    help="Gaussian sigma in frames for trajectory smoothing")
    ap.add_argument("--orb-features", type=int, default=3000)
    ap.add_argument("--ransac-thresh", type=float, default=3.0)
    ap.add_argument("--ratio", type=float, default=0.75)
    ap.add_argument("--downsample", type=float, default=1.0,
                    help="Downsample factor for feature detection (1=full res)")
    ap.add_argument("--transforms-out", default="transforms_cv2.json")
    ap.add_argument("--border", default="replicate",
                    choices=["replicate", "reflect", "black"])
    ap.add_argument("--clamp-dxy", type=float, default=8.0,
                    help="Max per-pair translation in px; bigger = zeroed (scene cut / runaway fit)")
    ap.add_argument("--clamp-deg", type=float, default=0.6,
                    help="Max per-pair rotation in degrees; bigger = zeroed")
    ap.add_argument("--clamp-scale", type=float, default=0.01,
                    help="Max per-pair |scale-1|; bigger = zeroed")
    ap.add_argument("--min-inliers", type=int, default=20,
                    help="Minimum RANSAC inliers; below = zeroed")
    args = ap.parse_args()

    in_dir = Path(args.inp)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # collect frames
    if args.count > 0:
        frame_nums = list(range(args.start, args.start + args.count))
    else:
        existing = sorted(in_dir.glob("frame_*.png"))
        frame_nums = []
        for p in existing:
            try:
                n = int(p.stem.split("_")[1])
                frame_nums.append(n)
            except (IndexError, ValueError):
                pass
        frame_nums.sort()
    n_frames = len(frame_nums)
    print(f"[stab] {n_frames} frames from {in_dir}")
    if n_frames < 2:
        print("[stab] need at least 2 frames", file=sys.stderr)
        sys.exit(1)

    orb = cv2.ORB_create(nfeatures=args.orb_features,
                         scaleFactor=1.2, nlevels=8,
                         edgeThreshold=15, fastThreshold=10)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    # pass 1: per-pair transforms
    deltas = []  # (dx, dy, angle, scale) -- how curr maps onto prev
    prev_path = in_dir / (args.pattern % frame_nums[0])
    prev = cv2.imread(str(prev_path))
    if prev is None:
        print(f"[stab] cannot read {prev_path}", file=sys.stderr)
        sys.exit(1)
    h, w = prev.shape[:2]
    print(f"[stab] frame size {w}x{h}")

    def to_feat_gray(img):
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if args.downsample != 1.0:
            g = cv2.resize(g, None, fx=1.0 / args.downsample,
                           fy=1.0 / args.downsample,
                           interpolation=cv2.INTER_AREA)
        return g

    prev_gray = to_feat_gray(prev)
    t0 = time.time()
    n_failed = 0
    for i in range(1, n_frames):
        curr_path = in_dir / (args.pattern % frame_nums[i])
        curr = cv2.imread(str(curr_path))
        if curr is None:
            print(f"[stab] cannot read {curr_path}", file=sys.stderr)
            deltas.append((0.0, 0.0, 0.0, 1.0))
            prev_gray = prev_gray
            continue
        curr_gray = to_feat_gray(curr)
        pts1, pts2, ngood = detect_and_match(
            prev_gray, curr_gray, orb, bf, ratio=args.ratio
        )
        if pts1 is None:
            deltas.append((0.0, 0.0, 0.0, 1.0))
            n_failed += 1
        else:
            if args.downsample != 1.0:
                pts1 = pts1 * args.downsample
                pts2 = pts2 * args.downsample
            # map prev -> curr, so decomposed delta equals the forward
            # motion of content from frame i-1 to frame i (right shift -> +dx).
            # Cumulative then tracks "where content is" relative to frame 0,
            # and correction = smoothed - raw warps content back to smoothed path.
            M, inliers = cv2.estimateAffinePartial2D(
                pts1, pts2,
                method=cv2.RANSAC,
                ransacReprojThreshold=args.ransac_thresh,
                maxIters=2000, confidence=0.99,
            )
            if M is None:
                deltas.append((0.0, 0.0, 0.0, 1.0))
                n_failed += 1
            else:
                n_in = int(inliers.sum()) if inliers is not None else 0
                ddx, ddy, dda, dds = decompose_affine(M)
                implausible = (
                    n_in < args.min_inliers
                    or abs(ddx) > args.clamp_dxy
                    or abs(ddy) > args.clamp_dxy
                    or abs(np.degrees(dda)) > args.clamp_deg
                    or abs(dds - 1.0) > args.clamp_scale
                )
                if implausible:
                    deltas.append((0.0, 0.0, 0.0, 1.0))
                    n_failed += 1
                else:
                    deltas.append((ddx, ddy, dda, dds))
        prev_gray = curr_gray
        if i % 50 == 0:
            dt = time.time() - t0
            print(f"[stab] pair {i}/{n_frames-1} "
                  f"failed={n_failed} {dt:.1f}s")

    # pass 2: build cumulative trajectory (frame i transform relative to frame 0)
    # composition: if M_i maps frame i -> frame i-1,
    # then C_i = C_{i-1} @ M_i maps frame i -> frame 0
    # We keep it simple: accumulate decomposed params (valid for small deltas).
    dx = np.zeros(n_frames)
    dy = np.zeros(n_frames)
    da = np.zeros(n_frames)
    ds = np.ones(n_frames)
    for i, (ddx, ddy, dda, dds) in enumerate(deltas, start=1):
        dx[i] = dx[i - 1] + ddx
        dy[i] = dy[i - 1] + ddy
        da[i] = da[i - 1] + dda
        ds[i] = ds[i - 1] * dds

    # smoothed trajectory
    sig = max(0.1, args.smooth_sigma)
    dx_s = gaussian_filter1d(dx, sig, mode="nearest")
    dy_s = gaussian_filter1d(dy, sig, mode="nearest")
    da_s = gaussian_filter1d(da, sig, mode="nearest")
    ds_s = gaussian_filter1d(ds, sig, mode="nearest")

    # pass 3: warp each frame by (smoothed - raw) correction
    border_flag = {
        "replicate": cv2.BORDER_REPLICATE,
        "reflect": cv2.BORDER_REFLECT,
        "black": cv2.BORDER_CONSTANT,
    }[args.border]

    t0 = time.time()
    for i in range(n_frames):
        frame_path = in_dir / (args.pattern % frame_nums[i])
        img = cv2.imread(str(frame_path))
        if img is None:
            print(f"[stab] warp: cannot read {frame_path}", file=sys.stderr)
            continue
        # correction: we want frame i to behave like smoothed trajectory,
        # so apply transform (smoothed - raw) about frame center
        cdx = dx_s[i] - dx[i]
        cdy = dy_s[i] - dy[i]
        cda = da_s[i] - da[i]
        cds = ds_s[i] / max(1e-6, ds[i])
        cx, cy = w / 2.0, h / 2.0
        M = compose_affine(0.0, 0.0, cda, cds)
        # rotate/scale about image center
        M[0, 2] = cx - M[0, 0] * cx - M[0, 1] * cy + cdx
        M[1, 2] = cy - M[1, 0] * cx - M[1, 1] * cy + cdy
        out = cv2.warpAffine(img, M, (w, h),
                             flags=cv2.INTER_LINEAR,
                             borderMode=border_flag)
        out_path = out_dir / (args.pattern % frame_nums[i])
        cv2.imwrite(str(out_path), out,
                    [int(cv2.IMWRITE_PNG_COMPRESSION), 3])
        if (i + 1) % 100 == 0:
            dt = time.time() - t0
            print(f"[stab] warp {i+1}/{n_frames} {dt:.1f}s")

    # save transforms
    transforms_path = out_dir / args.transforms_out
    data = {
        "n_frames": n_frames,
        "size": [w, h],
        "smooth_sigma": args.smooth_sigma,
        "failed_pairs": n_failed,
        "raw": {"dx": dx.tolist(), "dy": dy.tolist(),
                "da": da.tolist(), "ds": ds.tolist()},
        "smooth": {"dx": dx_s.tolist(), "dy": dy_s.tolist(),
                   "da": da_s.tolist(), "ds": ds_s.tolist()},
    }
    with open(transforms_path, "w") as f:
        json.dump(data, f)
    print(f"[stab] wrote {transforms_path}")
    print(f"[stab] done. failed pairs: {n_failed}/{n_frames-1}")
    # print summary stats
    print(f"[stab] raw trajectory range: "
          f"dx [{dx.min():.2f},{dx.max():.2f}] "
          f"dy [{dy.min():.2f},{dy.max():.2f}] "
          f"da [{np.degrees(da).min():.3f},{np.degrees(da).max():.3f}] deg")


if __name__ == "__main__":
    main()
