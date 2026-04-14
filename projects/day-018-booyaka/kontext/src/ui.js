import { PALETTES } from './palettes.js';
import { PATTERNS } from './patterns.js';

// ---------------------------------------------------------------------------
// Globaler State
// ---------------------------------------------------------------------------
export const state = {
  patternId: 'woodland',
  paletteId: 'forest',
  colors: [...PALETTES[0].colors],
  scale: 1.0,      // [0.2, 2.0]
  density: 50,     // [10, 100]
  seed: 42,        // [1, 999]
};

let customColors = ['#4B5C29', '#8B7355', '#3A4A1A', '#C2B78F'];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
export function render() {
  const canvas = document.getElementById('camo');
  const ctx = canvas.getContext('2d');
  const { patternId, colors, scale, density, seed } = state;

  const pattern = PATTERNS.find((p) => p.id === patternId);
  if (!pattern) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pattern.draw(ctx, canvas.width, canvas.height, colors, scale, density, seed);
}

// ---------------------------------------------------------------------------
// PNG-Export
// ---------------------------------------------------------------------------
export function downloadPng(filename = 'tarnmuster.png') {
  const canvas = document.getElementById('camo');
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ---------------------------------------------------------------------------
// UI aufbauen
// ---------------------------------------------------------------------------
export function buildUI() {
  buildPatternButtons();
  buildPaletteList();
  buildCustomInputs();
  initSliders();
}

function buildPatternButtons() {
  const grid = document.getElementById('pattern-grid');
  grid.innerHTML = '';
  PATTERNS.forEach((p) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn' + (state.patternId === p.id ? ' active' : '');
    btn.textContent = p.label;
    btn.addEventListener('click', () => {
      state.patternId = p.id;
      buildPatternButtons();
      render();
    });
    grid.appendChild(btn);
  });
}

function buildPaletteList() {
  const list = document.getElementById('palette-list');
  list.innerHTML = '';
  PALETTES.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'opt-btn swatch-row' + (state.paletteId === p.id ? ' active' : '');

    // Farbvorschau-Kästchen
    const swatches = document.createElement('div');
    swatches.style.cssText = 'display:flex;gap:3px;';
    p.colors.forEach((c) => {
      const s = document.createElement('div');
      s.className = 'swatch';
      s.style.background = c;
      swatches.appendChild(s);
    });

    const lbl = document.createElement('span');
    lbl.textContent = p.label;
    lbl.style.fontSize = '12px';

    row.appendChild(swatches);
    row.appendChild(lbl);

    row.addEventListener('click', () => {
      state.paletteId = p.id;
      if (p.id !== 'custom') {
        state.colors = [...p.colors];
        document.getElementById('custom-colors').style.display = 'none';
      } else {
        state.colors = [...customColors];
        document.getElementById('custom-colors').style.display = 'block';
      }
      buildPaletteList();
      buildCustomInputs();
      render();
    });

    list.appendChild(row);
  });
}

function buildCustomInputs() {
  const container = document.getElementById('color-inputs');
  container.innerHTML = '';
  const labels = ['Hintergrund', 'Farbe 2', 'Farbe 3', 'Farbe 4'];

  customColors.slice(0, 4).forEach((color, i) => {
    const row = document.createElement('div');
    row.className = 'color-row';

    const lbl = document.createElement('label');
    lbl.textContent = labels[i] || `Farbe ${i + 1}`;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = color;
    input.addEventListener('input', () => {
      customColors[i] = input.value;
      if (state.paletteId === 'custom') {
        state.colors = [...customColors];
        render();
      }
    });

    row.appendChild(lbl);
    row.appendChild(input);
    container.appendChild(row);
  });
}

function initSliders() {
  const slScale   = document.getElementById('sl-scale');
  const slDensity = document.getElementById('sl-density');
  const slSeed    = document.getElementById('sl-seed');

  slScale.addEventListener('input', () => {
    state.scale = slScale.value / 100;
    document.getElementById('scale-lbl').textContent =
      state.scale.toFixed(1) + '×';
    render();
  });

  slDensity.addEventListener('input', () => {
    state.density = Number(slDensity.value);
    document.getElementById('density-lbl').textContent = slDensity.value + '%';
    render();
  });

  slSeed.addEventListener('input', () => {
    state.seed = Number(slSeed.value);
    document.getElementById('seed-lbl').textContent = slSeed.value;
    render();
  });
}
