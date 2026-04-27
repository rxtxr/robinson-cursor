import { Flock } from './boids.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('canvas');
const renderer = new Renderer(canvas);

const bounds = { x: 500, y: 500, z: 500 };
let flock = new Flock(1190, bounds);

// --- UI ---
const ids = ['count','separation','alignment','cohesion','visualRange','maxSpeed','wind','particleSize'];
const valIds = ['countVal','sepVal','aliVal','cohVal','visVal','spdVal','windVal','sizeVal'];
const els = ids.map(id => document.getElementById(id));
const vals = valIds.map(id => document.getElementById(id));

function syncParams() {
    const p = flock.params;
    const v = els.map(e => parseFloat(e.value));

    const newCount = Math.round(v[0]);
    vals[0].textContent = newCount;
    if (newCount !== flock.count) flock.setCount(newCount);

    p.separationWeight = v[1]; vals[1].textContent = v[1].toFixed(1);
    p.alignmentWeight  = v[2]; vals[2].textContent = v[2].toFixed(1);
    p.cohesionWeight   = v[3]; vals[3].textContent = v[3].toFixed(1);
    p.visualRange      = v[4]; vals[4].textContent = v[4].toFixed(0);
    p.separationRange  = v[4] * 0.35;
    p.maxSpeed         = v[5]; vals[5].textContent = v[5].toFixed(1);
    p.minSpeed         = v[5] * 0.4;

    // Rotating wind
    const windStr = v[6]; vals[6].textContent = windStr.toFixed(1);
    const t = performance.now() * 0.0002;
    p.windX = Math.cos(t) * windStr;
    p.windY = Math.sin(t * 0.7) * windStr * 0.3;
    p.windZ = Math.sin(t) * windStr;

    renderer.baseSize = v[7]; vals[7].textContent = v[7].toFixed(1);
}

els.forEach(e => e.addEventListener('input', syncParams));

// Toggle panel
document.getElementById('toggleControls').addEventListener('click', () => {
    document.getElementById('controls').classList.toggle('hidden');
});

// --- Orbit camera ---
let dragging = false;
let lastX, lastY;

canvas.addEventListener('mousedown', e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    renderer.autoRotate = false;
});
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    renderer.camTheta -= dx * 0.005;
    renderer.camPhi = Math.max(-1.2, Math.min(1.2, renderer.camPhi + dy * 0.005));
});

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    renderer.camDist = Math.max(50, Math.min(2500, renderer.camDist + e.deltaY * 0.5));
}, { passive: false });

// Double-click to re-enable auto-rotate
canvas.addEventListener('dblclick', () => { renderer.autoRotate = true; });

// --- Loop ---
const fpsEl = document.getElementById('fps');
let lastTime = performance.now();
let fc = 0, ft = 0;

function loop(now) {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;

    fc++;
    ft += dt;
    if (ft > 500) {
        fpsEl.textContent = `${Math.round(fc / ft * 1000)} fps · ${flock.count}`;
        fc = 0; ft = 0;
    }

    syncParams();
    flock.update(dt);
    renderer.render(flock, now);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
