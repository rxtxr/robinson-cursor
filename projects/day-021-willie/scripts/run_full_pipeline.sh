#!/usr/bin/env bash
# Run the full v4 pipeline on pipeline_full/01_raw.
# Stages: flatfield -> stab -> v6-deflick -> residual-deflick -> denoise
#
# All intermediate outputs go under pipeline_full/ so nothing is lost.
set -euo pipefail

cd "$(dirname "$0")/.."

PY=".venv/bin/python"
ROOT="pipeline_full"

echo "=== [1/5] flatfield ==="
mkdir -p "$ROOT/02_flatfield"
$PY scripts/apply_flatfield.py \
  --in "$ROOT/01_raw" \
  --out "$ROOT/02_flatfield" \
  --flatfield "$ROOT/_flatfield_map.png"

echo "=== [2/5] stabilize ==="
mkdir -p "$ROOT/03_stab"
$PY scripts/stabilize_cv2.py \
  --in "$ROOT/02_flatfield" \
  --out "$ROOT/03_stab" \
  --smooth-sigma 15

echo "=== [3/5] v6 global deflicker ==="
mkdir -p "$ROOT/04_deflick"
$PY scripts/deflicker_v6_only.py \
  --in "$ROOT/03_stab" \
  --out "$ROOT/04_deflick" \
  --window 21 --strength 0.8

echo "=== [4/5] residual (bilateral temporal) deflicker ==="
mkdir -p "$ROOT/04b_residual"
$PY scripts/deflicker_residual.py \
  --in "$ROOT/04_deflick" \
  --out "$ROOT/04b_residual" \
  --sigma 5 --threshold 12 --motion-scale 6

echo "=== [5/5] denoise + unsharp (ffmpeg nlmeans) ==="
mkdir -p "$ROOT/05_denoise"
ffmpeg -y -framerate 24 -i "$ROOT/04b_residual/frame_%05d.png" \
  -vf "nlmeans=s=4:p=3:r=9,unsharp=3:3:0.4:3:3:0.0" \
  "$ROOT/05_denoise/frame_%05d.png"

echo "=== pipeline done ==="
