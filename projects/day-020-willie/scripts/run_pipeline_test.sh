#!/bin/bash
# Steamboat Willie Restoration — Test-Pipeline (erste Minute, ohne Upscale)
# Run from the willie/ directory
set -e

WORKDIR="$(pwd)/pipeline_test"
SRC="$(pwd)/Steamboat_Willie_(1928)_by_Walt_Disney.webm.1080p.vp9.webm"
START_TS="00:00:00"
END_TS="00:01:00"

echo "=== Willie Restoration Test Pipeline (0:00 – 1:00, ohne Upscale) ==="
echo "Working directory: $WORKDIR"

# ---- Step 1: Frames + Audio ----
echo -e "\n--- Step 1: Extracting frames + audio ---"
mkdir -p "$WORKDIR/01_raw"
ffmpeg -y -loglevel error -ss "$START_TS" -to "$END_TS" -i "$SRC" \
  "$WORKDIR/01_raw/frame_%05d.png"
ffmpeg -y -loglevel error -ss "$START_TS" -to "$END_TS" -i "$SRC" \
  -vn -c:a libopus -b:a 128k "$WORKDIR/audio.ogg"
RAW_COUNT=$(ls "$WORKDIR/01_raw" | wc -l)
echo "  extracted $RAW_COUNT frames"

# ---- Step 2+3: Flat-field + Deflicker (v6) ----
echo -e "\n--- Step 2+3: Flat-field + Deflicker ---"
mkdir -p "$WORKDIR/02_deflickered"
python3 scripts/restore_v6.py "$WORKDIR/01_raw" "$WORKDIR/02_deflickered" 21 0.8

# ---- Step 4: Denoise (nlmeans) ----
# NOTE: dust/scratch removal übersprungen — Temporal-Median zerstört Linien-Strokes
echo -e "\n--- Step 4: Denoising ---"
mkdir -p "$WORKDIR/03_denoised"
ffmpeg -y -loglevel error -framerate 24 -i "$WORKDIR/02_deflickered/frame_%05d.png" \
  -vf "nlmeans=s=4:p=3:r=9" \
  "$WORKDIR/03_denoised/frame_%05d.png"

# ---- Step 5: Mildes Sharpen (ohne Upscale) ----
echo -e "\n--- Step 5: Sharpen (mild, native res) ---"
mkdir -p "$WORKDIR/04_sharpened"
ffmpeg -y -loglevel error -framerate 24 -i "$WORKDIR/03_denoised/frame_%05d.png" \
  -vf "unsharp=3:3:0.4:3:3:0.0" \
  "$WORKDIR/04_sharpened/frame_%05d.png"

# ---- Step 6: Assembly ----
echo -e "\n--- Step 6: Final assembly ---"
ffmpeg -y -loglevel error -framerate 24 -i "$WORKDIR/04_sharpened/frame_%05d.png" \
  -i "$WORKDIR/audio.ogg" \
  -c:v libx265 -crf 16 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  willie_test_restored_1min.mp4

# ---- Step 7: Side-by-side comparison ----
echo -e "\n--- Step 7: Comparison (original | restored) ---"
ffmpeg -y -loglevel error \
  -ss "$START_TS" -to "$END_TS" -i "$SRC" \
  -i willie_test_restored_1min.mp4 \
  -filter_complex "[0:v]scale=1296:1080,setpts=PTS-STARTPTS[o];[1:v]setpts=PTS-STARTPTS[r];[o][r]hstack=inputs=2[v]" \
  -map "[v]" -map 1:a \
  -c:v libx265 -crf 18 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 160k \
  willie_test_comparison_1min.mp4

echo -e "\n=== Pipeline test complete ==="
echo "Output:     willie_test_restored_1min.mp4"
echo "Comparison: willie_test_comparison_1min.mp4"
