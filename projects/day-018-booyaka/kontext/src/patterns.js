import { seededRandom, noise2d, fractalNoise, hexToRgb } from './noise.js';

/**
 * Alle Zeichenfunktionen: draw*(ctx, width, height, colors, scale, density, seed)
 *
 * v2 — Überarbeitet nach realen Tarnmuster-Spezifikationen:
 * - Woodland: DPM-Schichtung (hell→dunkel, dunkel=kleiner), elongierte Formen, Kantendetail
 * - Digital: MARPAT Multi-Scale-Clustering (Mikro/Makro), korrekte Coverage-%
 * - Splinter: Echte Splittertarn-Geometrie (spitze Winkel, Regen-Striche)
 * - Tiger: Branching, Dickenvariation, Inseln in schwarzen Streifen
 * - Flecktarn: Überlappende Dots, 5-Farb-Verteilung, Poisson-Disk-Ansatz
 * - Multicam: Gradient-Hintergrund + Blob-Overlay + Detail-Shapes
 */

// ---------------------------------------------------------------------------
// WOODLAND — DPM-style layered organic blobs
// Schichtung: Hintergrund → hellste Farbe (größte Fläche) → dunkelste (kleinste)
// Elongierte Formen mit Kantendetail (Spurs, Notches)
// ---------------------------------------------------------------------------
export function drawWoodland(ctx, w, h, colors, scale, density, seed) {
  const rng = seededRandom(seed);

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  // Layer ordering: index 1 = largest coverage, last = smallest (darkest)
  // Coverage ratios inspired by DPM: ~30%, 20%, 15%, 8%
  const coverageRatios = [0.30, 0.20, 0.15, 0.08];
  const fgColors = colors.slice(1);

  for (let layer = 0; layer < fgColors.length; layer++) {
    ctx.fillStyle = fgColors[layer];

    // More blobs for higher coverage, fewer for lower
    const ratio = coverageRatios[Math.min(layer, coverageRatios.length - 1)];
    const count = Math.floor(density * ratio * 6);

    // Darker layers (higher index) get smaller shapes
    const sizeMultiplier = 1.0 - layer * 0.15;

    for (let i = 0; i < count; i++) {
      const cx = (rng() * 1.4 - 0.2) * w;
      const cy = (rng() * 1.4 - 0.2) * h;

      // Elongated blobs: aspect ratio 1.5-3.0
      const baseSize = (35 + rng() * 90) * scale * sizeMultiplier;
      const elongation = 1.5 + rng() * 1.5;
      const angle = rng() * Math.PI; // random direction

      const points = 6 + Math.floor(rng() * 5);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.beginPath();
      for (let p = 0; p <= points; p++) {
        const t = (p % points) / points;
        const a = t * Math.PI * 2;
        const baseR = baseSize * (0.5 + rng() * 0.5);
        // Elongation along x-axis
        const rx = baseR * elongation;
        const ry = baseR;
        const x = Math.cos(a) * rx;
        const y = Math.sin(a) * ry;

        // Add edge sub-features: small spurs and notches
        const spur = (rng() - 0.5) * baseSize * 0.25;
        const nx = x + Math.cos(a) * spur;
        const ny = y + Math.sin(a) * spur;

        if (p === 0) {
          ctx.moveTo(nx, ny);
        } else {
          // Quadratic curve with offset control point for organic edges
          const prevA = ((p - 1) / points) * Math.PI * 2;
          const midA = (prevA + a) / 2;
          const cpR = baseR * (1.1 + rng() * 0.5);
          const cpx = Math.cos(midA) * cpR * (a > Math.PI ? elongation : 1);
          const cpy = Math.sin(midA) * cpR;
          ctx.quadraticCurveTo(cpx, cpy, nx, ny);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------------------
// DIGITAL — MARPAT multi-scale clustering
// Three-level hierarchy: macro zones → micro clusters → pixel grid
// Coverage: ~47% base, 30% green, 18% black, 5% highlight
// ---------------------------------------------------------------------------
export function drawDigital(ctx, w, h, colors, scale, density, seed) {
  const pixelSize = Math.max(2, Math.round(8 * scale));

  // Three noise layers at different scales for multi-scale clustering
  // Macro (large zones), Meso (medium clusters), Micro (pixel variation)
  const nMacro = fractalNoise(seed, 2, Math.round(4 / scale), Math.round(3 / scale));
  const nMeso = noise2d(seed + 100, Math.round(16 / scale), Math.round(12 / scale));
  const nMicro = noise2d(seed + 200, Math.round(40 / scale), Math.round(30 / scale));

  // Coverage thresholds per color (MARPAT-inspired)
  // colors[0]=base(47%), [1]=mid(30%), [2]=dark(18%), [3]=light(5%)
  const bands = colors.length;
  const thresholds = [0.47, 0.30, 0.18, 0.05];

  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  const rgbs = colors.map(hexToRgb);

  for (let y = 0; y < h; y += pixelSize) {
    for (let x = 0; x < w; x += pixelSize) {
      const nx = x / w;
      const ny = y / h;

      // Combine three scales with weights
      const macro = nMacro(nx * (4 / scale), ny * (3 / scale));
      const meso = nMeso(nx * (16 / scale), ny * (12 / scale));
      const micro = nMicro(nx * (40 / scale), ny * (30 / scale));

      const v = macro * 0.50 + meso * 0.35 + micro * 0.15;

      // Map to color based on cumulative thresholds
      const densityFactor = density / 70;
      let ci = 0;
      let cumulative = 0;
      for (let c = 0; c < bands; c++) {
        const t = (thresholds[c] || (1 / bands)) * densityFactor;
        cumulative += t;
        if (v < cumulative) { ci = c; break; }
        ci = c;
      }

      // Fill pixel block
      const [r, g, b] = rgbs[ci];
      for (let py = y; py < Math.min(y + pixelSize, h); py++) {
        for (let px = x; px < Math.min(x + pixelSize, w); px++) {
          const idx = (py * w + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// SPLINTER — Splittertarnmuster: angular shards + rain streaks
// Sharp angles (30-60° and 100-140°), elongated 2:1-4:1, straight edges
// Rain streaks: thin diagonal dashes at ~65° from horizontal
// ---------------------------------------------------------------------------
export function drawSplinter(ctx, w, h, colors, scale, density, seed) {
  const rng = seededRandom(seed);

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  const count = Math.floor(density * 1.5);

  // Phase 1: Angular shard polygons
  for (let i = 0; i < count; i++) {
    const colorIdx = 1 + Math.floor(rng() * (colors.length - 1));
    ctx.fillStyle = colors[colorIdx];

    const cx = rng() * w;
    const cy = rng() * h;
    const baseSize = (25 + rng() * 80) * scale;

    // Elongated shard: aspect ratio 2:1 to 4:1
    const elongation = 2 + rng() * 2;
    const shardAngle = rng() * Math.PI;
    const points = 3 + Math.floor(rng() * 2); // 3-4 vertices (triangles/trapezoids)

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(shardAngle);

    ctx.beginPath();
    for (let p = 0; p < points; p++) {
      // Distribute vertices to create sharp, elongated shapes
      const t = p / points;
      // Cluster angles to create acute shards (30-60°)
      const baseA = t * Math.PI * 2;
      const jitter = (rng() - 0.5) * 0.6;
      const a = baseA + jitter;

      const r = baseSize * (0.3 + rng() * 0.7);
      const x = Math.cos(a) * r * elongation;
      const y = Math.sin(a) * r;

      p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Phase 2: Rain streaks — thin diagonal dashes
  const streakCount = Math.floor(density * 3);
  const darkColor = colors[colors.length - 1] || colors[1];

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.globalAlpha = 0.5;

  for (let i = 0; i < streakCount; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const len = (8 + rng() * 20) * scale;
    // Steep angle: ~60-70° from horizontal (nearly vertical with slight lean)
    const angle = (60 + rng() * 10) * Math.PI / 180;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// TIGER — branching stripes with thickness variation and islands
// Not simple sine waves: brushstroke quality, forking, internal gaps
// ---------------------------------------------------------------------------
export function drawTiger(ctx, w, h, colors, scale, density, seed) {
  const rng = seededRandom(seed);

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  const stripeCount = Math.floor((density / 50) * 6 + 3);

  for (let i = 0; i < stripeCount; i++) {
    const colorIdx = 1 + Math.floor(rng() * (colors.length - 1));
    const isBlack = colorIdx === colors.length - 1;

    ctx.fillStyle = colors[colorIdx];

    const yBase = rng() * h;
    const baseThickness = (15 + rng() * 50) * scale;
    const angle = (rng() - 0.5) * 0.4; // slight diagonal lean

    // Noise for vertical displacement (organic waviness)
    const waveFreq = 0.005 + rng() * 0.01;
    const waveAmp = (10 + rng() * 25) * scale;
    const wavePhase = rng() * Math.PI * 2;

    // Noise for thickness variation (taper effect)
    const thickFreq = 0.008 + rng() * 0.005;
    const thickPhase = rng() * Math.PI * 2;

    ctx.save();
    ctx.translate(0, yBase);
    ctx.rotate(angle);

    // Build stripe as filled path with varying width
    const step = 2;
    const startX = -60;
    const endX = w + 60;

    ctx.beginPath();

    // Upper edge (left to right)
    for (let x = startX; x <= endX; x += step) {
      const wave = Math.sin(x * waveFreq * Math.PI * 2 + wavePhase) * waveAmp;
      // Thickness tapers at ends, thickens in middle (brushstroke quality)
      const tNorm = (x - startX) / (endX - startX);
      const taper = Math.sin(tNorm * Math.PI) * 0.6 + 0.4;
      const thickVar = (0.7 + Math.sin(x * thickFreq * Math.PI * 2 + thickPhase) * 0.3);
      const thick = baseThickness * taper * thickVar;

      const y = wave - thick / 2;
      x === startX ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    // Lower edge (right to left)
    for (let x = endX; x >= startX; x -= step) {
      const wave = Math.sin(x * waveFreq * Math.PI * 2 + wavePhase) * waveAmp;
      const tNorm = (x - startX) / (endX - startX);
      const taper = Math.sin(tNorm * Math.PI) * 0.6 + 0.4;
      const thickVar = (0.7 + Math.sin(x * thickFreq * Math.PI * 2 + thickPhase) * 0.3);
      const thick = baseThickness * taper * thickVar;

      const y = wave + thick / 2;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    // Black stripes get internal "islands" (holes where base shows through)
    if (isBlack && baseThickness > 20 * scale) {
      ctx.fillStyle = colors[0];
      const islandCount = 1 + Math.floor(rng() * 3);
      for (let j = 0; j < islandCount; j++) {
        const ix = startX + rng() * (endX - startX);
        const iWave = Math.sin(ix * waveFreq * Math.PI * 2 + wavePhase) * waveAmp;
        const ir = (4 + rng() * 8) * scale;
        ctx.beginPath();
        ctx.ellipse(ix, iWave, ir * 1.5, ir, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Occasional branch: spawn a child stripe that diverges
    if (rng() < 0.3) {
      const branchX = rng() * w;
      const branchLen = (80 + rng() * 150) * scale;
      const branchAngle = angle + (rng() - 0.5) * 0.25; // 5-15° divergence
      const branchThick = baseThickness * (0.3 + rng() * 0.3);
      const branchY = yBase + Math.sin(branchX * waveFreq * Math.PI * 2 + wavePhase) * waveAmp;

      ctx.fillStyle = colors[colorIdx];
      ctx.save();
      ctx.translate(branchX, branchY);
      ctx.rotate(branchAngle);

      ctx.beginPath();
      ctx.moveTo(0, -branchThick / 2);
      ctx.lineTo(branchLen, -branchThick * 0.15);
      ctx.lineTo(branchLen, branchThick * 0.15);
      ctx.lineTo(0, branchThick / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------------------
// FLECKTARN — overlapping dots with correct 5-color distribution
// Coverage: dark green 41%, grey-green 19%, brown 18%, black 13%, olive 9%
// Dots overlap ~20-30%, multiple size classes, Poisson-disk-like spacing
// ---------------------------------------------------------------------------
export function drawFlecktarn(ctx, w, h, colors, scale, density, seed) {
  const rng = seededRandom(seed);

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  // Target coverage per layer (Bundeswehr spec)
  // colors[0] is background (dominant), the rest get these ratios
  const coverages = [0.19, 0.18, 0.13, 0.09];
  const fgColors = colors.slice(1);

  // Total dot density scaled by density parameter
  const baseDotCount = density * 6;

  // Generate dots per color layer with controlled overlap
  for (let layer = 0; layer < fgColors.length; layer++) {
    ctx.fillStyle = fgColors[layer];

    const coverage = coverages[Math.min(layer, coverages.length - 1)];
    const dotCount = Math.floor(baseDotCount * coverage / 0.15);

    // Size classes: mix of small (3-5px) and medium (6-12px) dots
    for (let i = 0; i < dotCount; i++) {
      const cx = rng() * w;
      const cy = rng() * h;

      // Multiple size classes
      const sizeClass = rng();
      let rx, ry;
      if (sizeClass < 0.4) {
        // Small dot
        rx = (3 + rng() * 4) * scale;
        ry = (2 + rng() * 3) * scale;
      } else if (sizeClass < 0.8) {
        // Medium dot
        rx = (5 + rng() * 8) * scale;
        ry = (4 + rng() * 6) * scale;
      } else {
        // Large dot (rare)
        rx = (8 + rng() * 12) * scale;
        ry = (6 + rng() * 9) * scale;
      }

      const angle = rng() * Math.PI;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------------------
// MULTICAM — gradient background + blob overlay + detail shapes
// Macro: smooth gradient shifting between warm/cool zones
// Meso: mid-frequency opaque blobs
// Micro: small high-frequency detail shapes
// ---------------------------------------------------------------------------
export function drawMulticam(ctx, w, h, colors, scale, density, seed) {
  // Layer 1: Gradient background (very low frequency noise)
  // Smoothly shifts between first two colors
  const nGradient = fractalNoise(seed, 2, Math.round(2 / scale), Math.round(2 / scale));

  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  const bands = colors.length;
  const rgbs = colors.map(hexToRgb);

  // Base gradient: blend between colors[0] and colors[1]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gv = nGradient(
        (x / w) * (2 / scale),
        (y / h) * (2 / scale)
      );

      // Smooth gradient between first two colors
      const t = gv;
      const r = Math.round(rgbs[0][0] * (1 - t) + rgbs[Math.min(1, bands - 1)][0] * t);
      const g = Math.round(rgbs[0][1] * (1 - t) + rgbs[Math.min(1, bands - 1)][1] * t);
      const b = Math.round(rgbs[0][2] * (1 - t) + rgbs[Math.min(1, bands - 1)][2] * t);

      const idx = (y * w + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Layer 2: Mid-frequency blob shapes (mid-tone colors)
  const rng = seededRandom(seed + 50);
  const midColors = colors.slice(2, Math.max(3, bands - 1));
  const blobCount = Math.floor(density * 1.5);

  for (let i = 0; i < blobCount; i++) {
    ctx.fillStyle = midColors[Math.floor(rng() * midColors.length)] || colors[2] || colors[1];
    ctx.globalAlpha = 0.6 + rng() * 0.4;

    const cx = (rng() * 1.3 - 0.15) * w;
    const cy = (rng() * 1.3 - 0.15) * h;
    const size = (20 + rng() * 60) * scale;
    const points = 5 + Math.floor(rng() * 4);

    ctx.beginPath();
    for (let p = 0; p <= points; p++) {
      const a = (p % points) / points * Math.PI * 2;
      const r = size * (0.4 + rng() * 0.6);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;

      if (p === 0) {
        ctx.moveTo(x, y);
      } else {
        const pa = ((p - 1) / points) * Math.PI * 2;
        const ma = (pa + a) / 2;
        const cr = r * (1.0 + rng() * 0.4);
        ctx.quadraticCurveTo(cx + Math.cos(ma) * cr, cy + Math.sin(ma) * cr, x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // Layer 3: Small high-frequency detail shapes (darkest + lightest)
  const detailCount = Math.floor(density * 3);
  const detailColors = [colors[bands - 1] || colors[0], colors[Math.min(2, bands - 1)]];

  for (let i = 0; i < detailCount; i++) {
    ctx.fillStyle = detailColors[Math.floor(rng() * detailColors.length)];
    ctx.globalAlpha = 0.5 + rng() * 0.5;

    const cx = rng() * w;
    const cy = rng() * h;
    const rx = (3 + rng() * 10) * scale;
    const ry = (2 + rng() * 7) * scale;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Pattern-Registry
// ---------------------------------------------------------------------------
export const PATTERNS = [
  { id: 'woodland',  label: 'Woodland',  draw: drawWoodland },
  { id: 'digital',   label: 'Digital',   draw: drawDigital },
  { id: 'splinter',  label: 'Splinter',  draw: drawSplinter },
  { id: 'flecktarn', label: 'Flecktarn', draw: drawFlecktarn },
  { id: 'multicam',  label: 'Multicam',  draw: drawMulticam },
];
