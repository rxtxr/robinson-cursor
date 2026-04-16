"""
Dust & scratch removal via temporal median filtering.
For each pixel, compare to temporal neighbors -- if it's an outlier
(bright spot = dust, dark line = scratch), replace with median.

Usage: python dust_scratch.py <input_dir> <output_dir> [radius=2] [threshold=80]
"""
import numpy as np
from PIL import Image
import os, sys, glob

input_dir = sys.argv[1]
output_dir = sys.argv[2]
radius = int(sys.argv[3]) if len(sys.argv) > 3 else 2  # temporal radius
threshold = float(sys.argv[4]) if len(sys.argv) > 4 else 80  # deviation threshold

os.makedirs(output_dir, exist_ok=True)

frames_paths = sorted(glob.glob(os.path.join(input_dir, 'frame_*.png')))
n = len(frames_paths)
first = np.array(Image.open(frames_paths[0]))
h, w, ch = first.shape
print(f"Frames: {n}, Temporal radius: {radius}, Threshold: {threshold}")

# Load all frames into memory
print("Loading frames...")
frames = np.zeros((n, h, w, ch), dtype=np.uint8)
for i, fp in enumerate(frames_paths):
    frames[i] = np.array(Image.open(fp))
    if (i+1) % 200 == 0:
        print(f"  {i+1}/{n}")

print("Processing...")
total_fixed = 0

for i in range(n):
    # Get temporal neighborhood
    start = max(0, i - radius)
    end = min(n, i + radius + 1)
    neighborhood = frames[start:end].astype(np.float32)

    current = frames[i].astype(np.float32)
    median = np.median(neighborhood, axis=0)

    # Find pixels that deviate significantly from temporal median
    diff = np.abs(current - median).max(axis=2)  # max across channels
    mask = diff > threshold

    # Replace outlier pixels with median
    result = current.copy()
    result[mask] = median[mask]

    fixed_pixels = mask.sum()
    total_fixed += fixed_pixels

    Image.fromarray(result.astype(np.uint8)).save(
        os.path.join(output_dir, os.path.basename(frames_paths[i])))

    if (i+1) % 100 == 0:
        pct = fixed_pixels / (h*w) * 100
        print(f"  {i+1}/{n} -- {fixed_pixels} pixels fixed ({pct:.2f}%)")

avg_fixed = total_fixed / n
print(f"\nDone. Average {avg_fixed:.0f} pixels/frame fixed ({avg_fixed/(h*w)*100:.2f}%)")
