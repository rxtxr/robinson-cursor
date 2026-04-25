#!/usr/bin/env node
/* Render thumb.png by reproducing the runtime waveform algorithm into an SVG,
   then rasterising via ImageMagick. Output: 1200x630 (Open Graph). */

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const W = 1200, H = 630;
const MAX_LINES = 80;
const SAMPLES_PER_LINE = 280;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function smoothInplace(arr, passes) {
  for (let p = 0; p < passes; p++) {
    let prev = arr[0];
    for (let i = 1; i < arr.length - 1; i++) {
      const cur = arr[i];
      arr[i] = (prev + cur + arr[i + 1]) / 3;
      prev = cur;
    }
  }
}
function generatePulseLine(pulseIdx) {
  const N = SAMPLES_PER_LINE;
  const out = new Float32Array(N);
  const rand = mulberry32(pulseIdx * 1009 + 17);
  for (let i = 0; i < N; i++) out[i] = (rand() - 0.5) * 0.05;
  smoothInplace(out, 2);
  const centre  = 0.50 + (rand() - 0.5) * 0.04;
  const cIdx    = Math.floor(centre * N);
  const isNull  = rand() < 0.07;
  const mainAmp = (isNull ? 0.18 : 0.85 + rand() * 0.55);
  const widthL  = 6 + rand() * 4;
  const widthR  = 9 + rand() * 6;
  for (let i = 0; i < N; i++) {
    const d = i - cIdx;
    const w = d < 0 ? widthL : widthR;
    out[i] += mainAmp * Math.exp(-(d * d) / (2 * w * w));
  }
  const subCount = 1 + Math.floor(rand() * 2);
  for (let s = 0; s < subCount; s++) {
    const off    = (rand() * 0.7 + 0.05) * 28 * (rand() < 0.25 ? -1 : 1);
    const subAmp = (isNull ? 0.05 : 0.18 + rand() * 0.42);
    const subW   = 4 + rand() * 5;
    for (let i = 0; i < N; i++) {
      const d = i - cIdx - off;
      out[i] += subAmp * Math.exp(-(d * d) / (2 * subW * subW));
    }
  }
  for (let i = 0; i < N; i++) {
    const d = Math.abs(i - cIdx);
    if (d > 14 && d < 70) out[i] += (rand() - 0.5) * 0.07;
  }
  smoothInplace(out, 1);
  return out;
}

// composition for the social card
const colW    = 620;
const colX    = (W - colW) / 2;
const topPad  = 60;
const botPad  = 90;
const stackH  = H - topPad - botPad;
const lineH   = stackH / MAX_LINES;
const ampScale = lineH * 4.4;

let polys = '', strokes = '';
for (let i = 0; i < MAX_LINES; i++) {
  const samples = generatePulseLine(i);
  const baseY = topPad + i * lineH;
  let dPoly = `M ${colX} ${baseY + 2} `;
  let dPath = '';
  for (let n = 0; n < samples.length; n++) {
    const x = colX + (n / (samples.length - 1)) * colW;
    const y = baseY - samples[n] * ampScale;
    if (n === 0) dPath += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
    else         dPath += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    dPoly += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  dPoly += `L ${(colX + colW).toFixed(2)} ${(baseY + 2).toFixed(2)} Z`;
  polys   += `<path d="${dPoly}" fill="#0c0a08"/>`;
  strokes += `<path d="${dPath}" fill="none" stroke="#ebe5d6" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="vg" cx="50%" cy="50%" r="85%">
      <stop offset="55%"  stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.34"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0c0a08"/>
  <rect width="${W}" height="${H}" fill="url(#vg)"/>
  ${polys}
  ${strokes}
</svg>`;

const svgPath = resolve(root, 'thumb.svg');
const pngPath = resolve(root, 'thumb.png');
const webpPath = resolve(root, 'thumb.webp');
const webpSmPath = resolve(root, 'thumb-sm.webp');

writeFileSync(svgPath, svg);
console.log('Wrote', svgPath);

execSync(`magick -density 144 ${svgPath} -resize ${W}x${H} ${pngPath}`, { stdio: 'inherit' });
console.log('Wrote', pngPath);

execSync(`magick ${pngPath} -quality 88 ${webpPath}`, { stdio: 'inherit' });
console.log('Wrote', webpPath);

execSync(`magick ${pngPath} -resize 400x -quality 80 ${webpSmPath}`, { stdio: 'inherit' });
console.log('Wrote', webpSmPath);

console.log('Done.');
