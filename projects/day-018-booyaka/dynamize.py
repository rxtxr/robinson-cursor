"""
Dynamize BOOYAKA! — Generate multiple variants with different settings.
Voronoi letter separation, per-letter tracing, configurable transforms.
"""

import subprocess
import os
import re
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

os.makedirs("letter_parts", exist_ok=True)
os.makedirs("variants", exist_ok=True)

img = Image.open("original.png").convert("L")
W, H = img.size
arr = np.array(img)
is_black = arr < 128

print(f"Original: {W}x{H}, {np.sum(is_black)} black px")

struct = np.ones((3, 3), dtype=bool)

# Letter definitions: name, cx, cy, has_counters, weight (influence radius multiplier)
LETTERS = [
    ('B',   170, 280, True,  1.3),  # shifted right, wider influence to capture bumps
    ('o1',  330, 210, True,  0.9),
    ('o2',  450, 260, True,  1.0),
    ('y',   570, 300, False, 1.0),
    ('a1',  670, 410, True,  0.9),
    ('k',   830, 300, False, 1.0),
    ('a2',  960, 470, True,  0.9),
    ('exc', 1130, 260, False, 1.0),
    ('dot', 1080, 550, True,  0.8),
]

# ---- Weighted Voronoi ----
print("Computing weighted Voronoi...")
yy, xx = np.mgrid[0:H, 0:W]
assignment = np.full((H, W), -1, dtype=int)
min_dist = np.full((H, W), np.inf)

for i, (name, cx, cy, _, weight) in enumerate(LETTERS):
    dist = np.sqrt((xx - cx)**2 + (yy - cy)**2) / weight
    closer = dist < min_dist
    assignment[closer] = i
    min_dist[closer] = dist[closer]

# ---- Per-letter mask extraction ----
letter_masks = {}
for i, (name, cx, cy, has_counters, _) in enumerate(LETTERS):
    mask = is_black & (assignment == i)

    # Morphological cleanup
    mask = ndimage.binary_closing(mask, structure=struct, iterations=2)

    if not has_counters:
        mask = ndimage.binary_fill_holes(mask)
    # For letters WITH counters: don't fill holes!

    mask = ndimage.binary_opening(mask, structure=struct, iterations=1)

    # Remove tiny blobs
    labeled, num = ndimage.label(mask)
    if num > 0:
        sizes = ndimage.sum(mask, labeled, range(1, num + 1))
        for j, sz in enumerate(sizes):
            if sz < 50:
                mask[labeled == (j + 1)] = False

    letter_masks[name] = mask
    print(f"  {name:>4}: {np.sum(mask):>6} px, counters={'yes' if has_counters else 'no'}")


def trace_letter(name, mask, dilation=1, blur=2, potrace_t=5):
    """Trace a letter mask and return SVG path data + transform string."""
    m = mask.copy()
    if dilation > 0:
        m = ndimage.binary_dilation(m, structure=struct, iterations=dilation)

    mask_img = Image.fromarray((m * 255).astype(np.uint8))
    if blur > 0:
        mask_img = mask_img.filter(ImageFilter.GaussianBlur(blur))
        mask_img = mask_img.point(lambda x: 255 if x > 100 else 0)

    png_path = f"letter_parts/{name}_v.png"
    pbm_path = f"letter_parts/{name}_v.pbm"
    svg_path = f"letter_parts/{name}_v.svg"

    mask_img.save(png_path)
    subprocess.run(["magick", png_path, "-threshold", "50%", "-negate", pbm_path],
                   check=True, capture_output=True)
    subprocess.run(["potrace", "-s", f"-t{potrace_t}", "-O", "0.8", "--flat",
                    pbm_path, "-o", svg_path],
                   check=True, capture_output=True)

    with open(svg_path) as f:
        content = f.read()

    paths = re.findall(r'd="([^"]+)"', content)
    g_tf = re.search(r'<g transform="([^"]+)"', content)
    return paths, g_tf.group(1) if g_tf else ""


def build_variant(name, transforms, dilation=1, blur=2, potrace_t=5):
    """Build one SVG variant."""
    parts = []
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg"')
    parts.append(f'  viewBox="0 -30 {W} {H + 60}" width="{W}" height="{H + 60}"')
    parts.append(f'  fill="currentColor">')

    for i, (lname, cx, cy, _, _) in enumerate(LETTERS):
        paths, g_tf = trace_letter(lname, letter_masks[lname],
                                    dilation=dilation, blur=blur, potrace_t=potrace_t)
        if not paths:
            continue

        t = transforms[lname]
        rot = t.get('rot', 0)
        dy = t.get('dy', 0)
        sx = t.get('sx', 1.0)
        sy = t.get('sy', 1.0)

        parts.append(f'  <g transform="translate({cx},{cy}) rotate({rot}) scale({sx},{sy}) translate({-cx},{-cy + dy})">')
        parts.append(f'    <g transform="{g_tf}" stroke="none">')
        for pd in paths:
            parts.append(f'      <path d="{pd}"/>')
        parts.append(f'    </g>')
        parts.append(f'  </g>')

    parts.append('</svg>')

    outpath = f"variants/{name}.svg"
    with open(outpath, 'w') as f:
        f.write('\n'.join(parts))

    # Render preview
    subprocess.run(["magick", "-background", "none", "-density", "120",
                    outpath, f"variants/{name}.png"],
                   check=True, capture_output=True)
    print(f"  -> {outpath}")


# ============ VARIANTS ============

print("\n--- Variant 1: Subtle bounce ---")
build_variant("v1_subtle", {
    'B':   {'rot':  2, 'dy': -4},
    'o1':  {'rot': -1, 'dy':  5},
    'o2':  {'rot':  2, 'dy': -6},
    'y':   {'rot': -2, 'dy':  3},
    'a1':  {'rot':  2, 'dy': -3},
    'k':   {'rot': -1, 'dy':  4},
    'a2':  {'rot': -3, 'dy':  5},
    'exc': {'rot':  3, 'dy': -6},
    'dot': {'rot':  3, 'dy': -6},
}, dilation=1, blur=2, potrace_t=5)

print("\n--- Variant 2: Wild dance ---")
build_variant("v2_wild", {
    'B':   {'rot':  5, 'dy': -12},
    'o1':  {'rot': -3, 'dy':  15},
    'o2':  {'rot':  6, 'dy': -18},
    'y':   {'rot': -4, 'dy':  10},
    'a1':  {'rot':  5, 'dy': -8},
    'k':   {'rot': -3, 'dy': 12},
    'a2':  {'rot': -7, 'dy': 16},
    'exc': {'rot':  9, 'dy': -20},
    'dot': {'rot':  9, 'dy': -20},
}, dilation=1, blur=2, potrace_t=5)

print("\n--- Variant 3: Lean right (all tilt same direction) ---")
build_variant("v3_lean", {
    'B':   {'rot':  6, 'dy': -4},
    'o1':  {'rot':  5, 'dy': -2},
    'o2':  {'rot':  7, 'dy': -6},
    'y':   {'rot':  4, 'dy': -3},
    'a1':  {'rot':  6, 'dy': -5},
    'k':   {'rot':  5, 'dy': -2},
    'a2':  {'rot':  7, 'dy': -4},
    'exc': {'rot':  8, 'dy': -8},
    'dot': {'rot':  8, 'dy': -8},
}, dilation=1, blur=2, potrace_t=5)

print("\n--- Variant 4: Scale variation (fat/thin) ---")
build_variant("v4_scale", {
    'B':   {'rot':  2, 'dy': -5, 'sx': 1.06, 'sy': 1.06},
    'o1':  {'rot': -1, 'dy':  6, 'sx': 0.94, 'sy': 0.94},
    'o2':  {'rot':  3, 'dy': -8, 'sx': 1.05, 'sy': 1.05},
    'y':   {'rot': -2, 'dy':  4, 'sx': 0.96, 'sy': 0.96},
    'a1':  {'rot':  3, 'dy': -4, 'sx': 1.04, 'sy': 1.04},
    'k':   {'rot': -2, 'dy':  6, 'sx': 0.95, 'sy': 0.95},
    'a2':  {'rot': -4, 'dy':  8, 'sx': 1.06, 'sy': 1.06},
    'exc': {'rot':  5, 'dy':-10, 'sx': 0.93, 'sy': 0.93},
    'dot': {'rot':  5, 'dy':-10, 'sx': 0.93, 'sy': 0.93},
}, dilation=1, blur=2, potrace_t=5)

print("\n--- Variant 5: Bold + crisp ---")
build_variant("v5_bold", {
    'B':   {'rot':  3, 'dy': -6},
    'o1':  {'rot': -2, 'dy':  8},
    'o2':  {'rot':  4, 'dy': -10},
    'y':   {'rot': -3, 'dy':  5},
    'a1':  {'rot':  3, 'dy': -5},
    'k':   {'rot': -2, 'dy':  7},
    'a2':  {'rot': -5, 'dy':  9},
    'exc': {'rot':  6, 'dy': -12},
    'dot': {'rot':  6, 'dy': -12},
}, dilation=2, blur=1, potrace_t=3)

print("\n--- Variant 6: Falling apart (extreme spread) ---")
build_variant("v6_apart", {
    'B':   {'rot':  8, 'dy': -20, 'sx': 1.08, 'sy': 1.08},
    'o1':  {'rot': -6, 'dy':  22},
    'o2':  {'rot': 10, 'dy': -25},
    'y':   {'rot': -8, 'dy':  18, 'sx': 0.94, 'sy': 0.94},
    'a1':  {'rot':  7, 'dy': -12},
    'k':   {'rot': -5, 'dy': 20, 'sx': 1.06, 'sy': 1.06},
    'a2':  {'rot':-10, 'dy': 25},
    'exc': {'rot': 12, 'dy': -28, 'sx': 0.92, 'sy': 0.92},
    'dot': {'rot': 12, 'dy': -28, 'sx': 0.92, 'sy': 0.92},
}, dilation=1, blur=2, potrace_t=5)

print("\n--- Variant 7: Italic rush (all lean forward hard) ---")
build_variant("v7_italic", {
    'B':   {'rot': -8, 'dy':  2, 'sx': 0.92, 'sy': 1.05},
    'o1':  {'rot': -7, 'dy':  4, 'sx': 0.93, 'sy': 1.04},
    'o2':  {'rot': -9, 'dy':  0, 'sx': 0.91, 'sy': 1.06},
    'y':   {'rot': -7, 'dy':  3, 'sx': 0.93, 'sy': 1.04},
    'a1':  {'rot': -8, 'dy':  1, 'sx': 0.92, 'sy': 1.05},
    'k':   {'rot': -9, 'dy':  5, 'sx': 0.91, 'sy': 1.06},
    'a2':  {'rot': -7, 'dy':  2, 'sx': 0.93, 'sy': 1.04},
    'exc': {'rot':-10, 'dy':  0, 'sx': 0.90, 'sy': 1.07},
    'dot': {'rot':-10, 'dy':  0, 'sx': 0.90, 'sy': 1.07},
}, dilation=1, blur=1, potrace_t=4)

print("\n--- Variant 8: Stagger step (alternating big shifts) ---")
build_variant("v8_stagger", {
    'B':   {'rot':  4, 'dy': -18},
    'o1':  {'rot': -2, 'dy':  16},
    'o2':  {'rot':  5, 'dy': -20},
    'y':   {'rot': -3, 'dy':  14},
    'a1':  {'rot':  6, 'dy': -22},
    'k':   {'rot': -4, 'dy':  18},
    'a2':  {'rot':  7, 'dy': -24},
    'exc': {'rot': -5, 'dy':  20},
    'dot': {'rot': -5, 'dy':  20},
}, dilation=1, blur=2, potrace_t=5)

print("\n--- Variant 9: Compressed (squeezed together, tight) ---")
build_variant("v9_tight", {
    'B':   {'rot':  1, 'dy': -2, 'sx': 1.08, 'sy': 0.94},
    'o1':  {'rot': -1, 'dy':  2, 'sx': 1.06, 'sy': 0.95},
    'o2':  {'rot':  2, 'dy': -3, 'sx': 1.07, 'sy': 0.93},
    'y':   {'rot': -1, 'dy':  1, 'sx': 1.05, 'sy': 0.96},
    'a1':  {'rot':  1, 'dy': -1, 'sx': 1.06, 'sy': 0.95},
    'k':   {'rot': -2, 'dy':  2, 'sx': 1.08, 'sy': 0.93},
    'a2':  {'rot':  1, 'dy': -2, 'sx': 1.05, 'sy': 0.96},
    'exc': {'rot':  2, 'dy': -3, 'sx': 1.04, 'sy': 0.97},
    'dot': {'rot':  2, 'dy': -3, 'sx': 1.04, 'sy': 0.97},
}, dilation=2, blur=1, potrace_t=3)

print("\n--- Variant 10: Original (no transforms, clean trace) ---")
build_variant("v10_original", {
    'B':   {'rot': 0, 'dy': 0},
    'o1':  {'rot': 0, 'dy': 0},
    'o2':  {'rot': 0, 'dy': 0},
    'y':   {'rot': 0, 'dy': 0},
    'a1':  {'rot': 0, 'dy': 0},
    'k':   {'rot': 0, 'dy': 0},
    'a2':  {'rot': 0, 'dy': 0},
    'exc': {'rot': 0, 'dy': 0},
    'dot': {'rot': 0, 'dy': 0},
}, dilation=1, blur=2, potrace_t=5)

# Also save the current best as booyaka.svg
import shutil
shutil.copy("variants/v1_subtle.svg", "booyaka.svg")

print("\n5 Varianten in variants/ — fertig!")
