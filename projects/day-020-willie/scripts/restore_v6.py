"""
v6: Static flat-field + GENTLE per-band gain deflicker.
Instead of full CDF matching (too aggressive -> clouds),
compute smooth gain curve from percentile ratios.

Usage: python restore_v6.py <input_dir> <output_dir> [window=21] [strength=0.8]
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import uniform_filter1d
import os, sys, glob

input_dir = sys.argv[1]
output_dir = sys.argv[2]
window = int(sys.argv[3]) if len(sys.argv) > 3 else 21
strength = float(sys.argv[4]) if len(sys.argv) > 4 else 0.8  # 0-1 blend

os.makedirs(output_dir, exist_ok=True)

frames_paths = sorted(glob.glob(os.path.join(input_dir, 'frame_*.png')))
n = len(frames_paths)
first = np.array(Image.open(frames_paths[0]).convert('L'))
h, w = first.shape
print(f"Frames: {n}, Window: {window}, Strength: {strength}")

# ============================================================
# STEP 1: Static flat-field from temporal MEDIAN
# ============================================================
print("\n--- Step 1: Static flat-field ---")
sample_indices = list(range(0, n, 4))
stack = np.zeros((len(sample_indices), h, w), dtype=np.float32)
for idx, fi in enumerate(sample_indices):
    stack[idx] = np.array(Image.open(frames_paths[fi]).convert('L'), dtype=np.float32)
    if (idx+1) % 50 == 0:
        print(f"  loaded {idx+1}/{len(sample_indices)}")
median_frame = np.median(stack, axis=0)
del stack

# Extreme blur: 3x Gaussian r=100 to remove ALL content
median_pil = Image.fromarray(median_frame.astype(np.uint8))
for _ in range(3):
    median_pil = median_pil.filter(ImageFilter.GaussianBlur(radius=100))
flatfield = np.array(median_pil, dtype=np.float64)

ff_target = flatfield.mean()
ff_correction = np.clip(np.where(flatfield > 10, ff_target / flatfield, 1.0), 0.7, 1.6)
print(f"Flat-field: target={ff_target:.1f}, range={ff_correction.min():.3f}-{ff_correction.max():.3f}")

# Save flat-field map for inspection (parent dir of output, to not pollute frame glob)
_debug_dir = os.path.dirname(os.path.abspath(output_dir))
Image.fromarray(flatfield.astype(np.uint8)).save(
    os.path.join(_debug_dir, '_flatfield_map.png'))

# ============================================================
# STEP 2: Compute percentile curves per frame (after flat-field)
# ============================================================
print("\n--- Step 2: Per-frame percentile curves ---")
num_pts = 64
pct_points = np.linspace(2, 98, num_pts)

percentiles = np.zeros((n, num_pts), dtype=np.float64)

for i, fp in enumerate(frames_paths):
    gray = np.array(Image.open(fp).convert('L'), dtype=np.float64)
    gray_ff = np.clip(gray * ff_correction, 0, 255)
    percentiles[i] = np.percentile(gray_ff, pct_points)
    if (i+1) % 200 == 0:
        print(f"  {i+1}/{n}")

# Temporal smoothing of percentiles
print("\n--- Step 3: Temporal smoothing ---")
half_w = window // 2
pct_smooth = np.zeros_like(percentiles)
for i in range(n):
    start = max(0, i - half_w)
    end = min(n, i + half_w + 1)
    pct_smooth[i] = percentiles[start:end].mean(axis=0)

# ============================================================
# STEP 4: Apply flat-field + gain deflicker
# ============================================================
print("\n--- Step 4: Applying ---")

for i, fp in enumerate(frames_paths):
    img = np.array(Image.open(fp), dtype=np.float64)

    # Flat-field
    for c in range(3):
        img[:,:,c] *= ff_correction
    img = np.clip(img, 0, 255)

    # Build smooth gain LUT from percentile ratios
    orig_pcts = percentiles[i]
    target_pcts = pct_smooth[i]

    # Gain at each percentile point
    gains = np.where(orig_pcts > 3, target_pcts / orig_pcts, 1.0)

    # Interpolate gains into full 256-entry LUT
    lut_gains = np.interp(np.arange(256), orig_pcts, gains)

    # Smooth the gain curve heavily to prevent any banding
    lut_gains = uniform_filter1d(lut_gains, size=25)

    # Clamp
    lut_gains = np.clip(lut_gains, 0.8, 1.25)

    # Blend with identity (1.0) for gentleness
    lut_gains = 1.0 + strength * (lut_gains - 1.0)

    # Build final LUT: input -> input * gain
    lut = np.clip(np.arange(256) * lut_gains, 0, 255).astype(np.float64)

    # Apply via luminance ratio
    gray = np.clip(img.mean(axis=2), 0, 255).astype(np.uint8)
    new_vals = lut[gray]
    old_vals = gray.astype(np.float64)

    ratio = np.where(old_vals > 2, new_vals / old_vals, 1.0)
    ratio = np.clip(ratio, 0.8, 1.25)

    for c in range(3):
        img[:,:,c] *= ratio

    img = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(img).save(os.path.join(output_dir, os.path.basename(fp)))

    if (i+1) % 100 == 0:
        print(f"  {i+1}/{n}")

print("Done.")
