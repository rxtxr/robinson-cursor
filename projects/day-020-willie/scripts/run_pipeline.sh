#!/bin/bash
# Steamboat Willie Restoration Pipeline
# Run from the willie/ directory
set -e

WORKDIR="$(pwd)/pipeline"
SRC="$(pwd)/Steamboat_Willie_(1928)_by_Walt_Disney.webm.1080p.vp9.webm"
ESRGAN="/tmp/realesrgan-bin/realesrgan-ncnn-vulkan"

echo "=== Steamboat Willie Restoration Pipeline ==="
echo "Working directory: $WORKDIR"

# Step 1: Extract frames
echo -e "\n--- Step 1: Extracting frames (18s-60s) ---"
mkdir -p "$WORKDIR/01_raw"
ffmpeg -y -ss 00:00:18 -to 00:01:00 -i "$SRC" "$WORKDIR/01_raw/frame_%05d.png"
# Extract audio
ffmpeg -y -ss 00:00:18 -to 00:01:00 -i "$SRC" -vn -c:a libopus -b:a 128k "$WORKDIR/audio.ogg"

# Step 2+3: Flat-field + Deflicker (v6)
echo -e "\n--- Step 2+3: Flat-field + Deflicker ---"
mkdir -p "$WORKDIR/02_deflickered"
python3 scripts/restore_v6.py "$WORKDIR/01_raw" "$WORKDIR/02_deflickered" 21 0.8

# Step 4: Denoise
# NOTE: dust/scratch removal übersprungen — Temporal-Median zerstört Linien-Strokes
echo -e "\n--- Step 4: Denoising ---"
mkdir -p "$WORKDIR/03_denoised"
ffmpeg -y -framerate 24 -i "$WORKDIR/02_deflickered/frame_%05d.png" \
  -vf "nlmeans=s=4:p=3:r=9" \
  "$WORKDIR/03_denoised/frame_%05d.png"

# Step 5: 4K Upscale (Real-ESRGAN) — in batches of 100
echo -e "\n--- Step 5: 4K Upscale (Real-ESRGAN) ---"
mkdir -p "$WORKDIR/04_upscaled"

if [ ! -f "$ESRGAN" ]; then
    echo "Real-ESRGAN not found at $ESRGAN"
    echo "Download: curl -sL https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip -o /tmp/realesrgan.zip && unzip -o /tmp/realesrgan.zip -d /tmp/realesrgan-bin"
    exit 1
fi

# Process in batches to avoid memory issues
BATCH_SIZE=100
TOTAL=$(ls "$WORKDIR/03_denoised/" | wc -l)
echo "Processing $TOTAL frames in batches of $BATCH_SIZE..."

for START in $(seq 1 $BATCH_SIZE $TOTAL); do
    END=$((START + BATCH_SIZE - 1))
    if [ $END -gt $TOTAL ]; then END=$TOTAL; fi

    BATCH_DIR="$WORKDIR/batch_tmp"
    mkdir -p "$BATCH_DIR"

    # Copy batch
    for i in $(seq $START $END); do
        FNAME=$(printf "frame_%05d.png" $i)
        cp "$WORKDIR/03_denoised/$FNAME" "$BATCH_DIR/"
    done

    # Upscale batch
    $ESRGAN -i "$BATCH_DIR" -o "$WORKDIR/04_upscaled" -n realesrgan-x4plus -s 4 -f png

    # Cleanup batch
    rm -rf "$BATCH_DIR"

    echo "  Batch done: frames $START-$END of $TOTAL"
done

# Step 6: Sharpen
echo -e "\n--- Step 6: Sharpening ---"
mkdir -p "$WORKDIR/05_sharpened"
ffmpeg -y -framerate 24 -i "$WORKDIR/04_upscaled/frame_%05d.png" \
  -vf "unsharp=5:5:0.5:5:5:0.0" \
  "$WORKDIR/05_sharpened/frame_%05d.png"

# Step 7: Final assembly
echo -e "\n--- Step 7: Final assembly ---"
ffmpeg -y -framerate 24 -i "$WORKDIR/05_sharpened/frame_%05d.png" \
  -i "$WORKDIR/audio.ogg" \
  -c:v libx265 -crf 14 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  willie_restored_4k.mp4

echo -e "\n=== Pipeline complete ==="
echo "Output: willie_restored_4k.mp4"
echo ""
echo "Cleanup (optional — frees ~60GB):"
echo "  rm -rf $WORKDIR"
