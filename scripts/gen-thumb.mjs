import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const W = 960, H = 540;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// White base for moiré visibility
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, W, H);

function grating(cx, cy, period, duty, angle, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const lineW = period * duty;
  const diag = Math.sqrt(W * W + H * H);
  const n = Math.ceil(diag / period) + 1;
  ctx.fillStyle = color;
  for (let i = -n; i <= n; i++) {
    ctx.fillRect(i * period - lineW / 2, -diag / 2, lineW, diag);
  }
  ctx.restore();
}

// Two overlapping gratings — rotation moiré at ~3°
const period = 12;
const duty = 0.4;
const theta = 3 * Math.PI / 180;

grating(W / 2, H / 2, period, duty, 0, '#000000');
ctx.globalCompositeOperation = 'multiply';
grating(W / 2, H / 2, period, duty, theta, '#000000');
ctx.globalCompositeOperation = 'source-over';

// Color tint — overlay accent color
ctx.globalCompositeOperation = 'multiply';
ctx.fillStyle = '#00d4aa';
ctx.fillRect(0, 0, W, H);
ctx.globalCompositeOperation = 'source-over';

// Dark vignette fading to site background
const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.55);
grad.addColorStop(0, 'rgba(10, 10, 15, 0)');
grad.addColorStop(0.7, 'rgba(10, 10, 15, 0.4)');
grad.addColorStop(1, 'rgba(10, 10, 15, 0.95)');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

writeFileSync('projects/day-001-moire-explorer/thumb.png', canvas.toBuffer('image/png'));
console.log('thumb.png written');
