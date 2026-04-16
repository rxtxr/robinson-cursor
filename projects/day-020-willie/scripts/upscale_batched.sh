#!/bin/bash
# Standalone batched upscale script
# Usage: ./upscale_batched.sh <input_dir> <output_dir> [batch_size=50]
set -e

INPUT_DIR="$1"
OUTPUT_DIR="$2"
BATCH_SIZE="${3:-50}"
ESRGAN="/tmp/realesrgan-bin/realesrgan-ncnn-vulkan"

if [ ! -f "$ESRGAN" ]; then
    echo "Installing Real-ESRGAN..."
    cd /tmp
    curl -sL "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip" -o realesrgan.zip
    unzip -o realesrgan.zip -d realesrgan-bin
    chmod +x realesrgan-bin/realesrgan-ncnn-vulkan
    cd -
fi

mkdir -p "$OUTPUT_DIR"
BATCH_DIR=$(mktemp -d)
FRAMES=($(ls "$INPUT_DIR"/*.png | sort))
TOTAL=${#FRAMES[@]}

echo "Upscaling $TOTAL frames in batches of $BATCH_SIZE"
echo "Input:  $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "Temp:   $BATCH_DIR"

DONE=0
for ((i=0; i<TOTAL; i+=BATCH_SIZE)); do
    # Copy batch
    rm -f "$BATCH_DIR"/*.png
    END=$((i + BATCH_SIZE))
    if [ $END -gt $TOTAL ]; then END=$TOTAL; fi

    for ((j=i; j<END; j++)); do
        cp "${FRAMES[$j]}" "$BATCH_DIR/"
    done

    # Upscale
    $ESRGAN -i "$BATCH_DIR" -o "$OUTPUT_DIR" -n realesrgan-x4plus -s 4 -f png 2>&1 | tail -1

    DONE=$((DONE + END - i))
    echo "  Progress: $DONE/$TOTAL frames ($((DONE * 100 / TOTAL))%)"
done

rm -rf "$BATCH_DIR"
echo "Done. Output in $OUTPUT_DIR"
