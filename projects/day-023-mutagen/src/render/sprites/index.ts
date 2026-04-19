// SVG fragments per mutation. Each fn returns an SVG string that can be
// inserted as the innerHTML of a <svg viewBox="0 0 200 200">.
// Level drives size/count/intensity. Colors stay consistent with the type
// palette (green=poison, red=fire, yellow=electric).

type SpriteFn = (level: number) => string;

function scale(level: number): number {
  // Level 1 → 1.0, Level 5 → 1.8. Simple linear mapping.
  return 1 + (level - 1) * 0.2;
}

// --- Body (base blob) ---
// Dominant color is picked at the call site. Here only the shape.
export function renderBody(color: string): string {
  return `
    <ellipse cx="100" cy="120" rx="60" ry="45" fill="${color}" stroke="#000" stroke-width="2"/>
    <ellipse cx="100" cy="85" rx="35" ry="30" fill="${color}" stroke="#000" stroke-width="2"/>
    <circle cx="88" cy="80" r="4" fill="#fff"/>
    <circle cx="112" cy="80" r="4" fill="#fff"/>
    <circle cx="88" cy="80" r="2" fill="#000"/>
    <circle cx="112" cy="80" r="2" fill="#000"/>
  `;
}

// --- Front: Claws, Venom Claws ---
export const renderClaws: SpriteFn = (level) => {
  const s = scale(level);
  const count = Math.min(4, 2 + Math.floor((level - 1) / 2));
  const claws: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = 40 + i * 8;
    const len = 12 * s;
    claws.push(
      `<path d="M${x} 140 L${x - 4} ${140 + len} L${x + 4} ${140 + len - 2} Z" fill="#e8e8ec" stroke="#000" stroke-width="1.5"/>`,
    );
  }
  return claws.join('');
};

export const renderVenomClaws: SpriteFn = (level) => {
  const s = scale(level);
  const count = Math.min(4, 2 + Math.floor((level - 1) / 2));
  const claws: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = 40 + i * 8;
    const len = 13 * s;
    claws.push(
      `<path d="M${x} 140 L${x - 4} ${140 + len} L${x + 4} ${140 + len - 2} Z" fill="#8de08d" stroke="#000" stroke-width="1.5"/>`,
      `<circle cx="${x}" cy="${140 + len - 3}" r="1.5" fill="#4a7a4a"/>`,
    );
  }
  return claws.join('');
};

// --- Head: Horns, Keen Senses ---
export const renderHorns: SpriteFn = (level) => {
  const s = scale(level);
  const h = 20 * s;
  return `
    <path d="M80 60 Q75 ${60 - h} 70 ${60 - h + 5}" stroke="#d8cfb6" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M120 60 Q125 ${60 - h} 130 ${60 - h + 5}" stroke="#d8cfb6" stroke-width="5" fill="none" stroke-linecap="round"/>
  `;
};

export const renderKeenSenses: SpriteFn = (level) => {
  const r = 2 + level * 0.5;
  return `
    <circle cx="88" cy="80" r="${r}" fill="#ffe066" opacity="0.7"/>
    <circle cx="112" cy="80" r="${r}" fill="#ffe066" opacity="0.7"/>
    <path d="M70 70 L78 74" stroke="#ffe066" stroke-width="1.5"/>
    <path d="M130 70 L122 74" stroke="#ffe066" stroke-width="1.5"/>
  `;
};

// --- Body: drawn as glands/organs on the torso (passive) ---
export const renderPoisonGland: SpriteFn = (level) => {
  const r = 5 + level;
  return `
    <circle cx="100" cy="120" r="${r}" fill="#7ee787" stroke="#2f6a2f" stroke-width="1.5" opacity="0.85"/>
    <circle cx="95" cy="115" r="${r * 0.3}" fill="#c5f0c5" opacity="0.8"/>
  `;
};

export const renderFireSac: SpriteFn = (level) => {
  const r = 5 + level;
  return `
    <circle cx="100" cy="125" r="${r}" fill="#ff8552" stroke="#7a2f0f" stroke-width="1.5" opacity="0.9"/>
    <circle cx="96" cy="120" r="${r * 0.3}" fill="#ffd6a5" opacity="0.8"/>
  `;
};

export const renderElectricOrgan: SpriteFn = (level) => {
  const s = scale(level);
  return `
    <path d="M100 110 L90 125 L100 128 L95 140" stroke="#ffe066" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>
    <path d="M108 115 L115 125 L108 130" stroke="#ffe066" stroke-width="${1.5 * s}" fill="none" stroke-linecap="round"/>
  `;
};

// --- Skin: Leather, Chitin, Stone ---
export const renderLeatherHide: SpriteFn = (level) => {
  const alpha = 0.2 + level * 0.08;
  return `
    <ellipse cx="100" cy="120" rx="60" ry="45" fill="#5a3a24" opacity="${alpha}"/>
    <path d="M60 105 Q80 100 100 105 M100 105 Q120 100 140 105" stroke="#3a2410" stroke-width="1" fill="none" opacity="0.6"/>
  `;
};

export const renderChitinPlate: SpriteFn = (level) => {
  const plates: string[] = [];
  const count = Math.min(6, 3 + level);
  for (let i = 0; i < count; i++) {
    const x = 60 + (i * 80) / count;
    plates.push(
      `<path d="M${x} 105 Q${x + 12} 100 ${x + 20} 110" stroke="#6b5b3c" stroke-width="2" fill="#8f7d56" opacity="0.9"/>`,
    );
  }
  return `
    ${plates.join('')}
    <path d="M60 140 L160 140" stroke="#6b5b3c" stroke-width="1" opacity="0.5"/>
  `;
};

export const renderStoneSkin: SpriteFn = (level) => {
  const rocks: string[] = [];
  const count = 4 + level;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = 100 + Math.cos(angle) * 55;
    const y = 115 + Math.sin(angle) * 40;
    const r = 4 + Math.random() * 2;
    rocks.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#8a8a8a" stroke="#4a4a4a" stroke-width="1"/>`,
    );
  }
  return rocks.join('');
};

// --- Back: Wings, Thunder Strike ---
export const renderWings: SpriteFn = (level) => {
  const s = scale(level);
  return `
    <path d="M60 90 Q30 60 ${25 - 5 * s} ${100 + 10 * s} Q50 100 60 110 Z" fill="#3a3f55" stroke="#1a1f35" stroke-width="1.5" opacity="0.9"/>
    <path d="M140 90 Q170 60 ${175 + 5 * s} ${100 + 10 * s} Q150 100 140 110 Z" fill="#3a3f55" stroke="#1a1f35" stroke-width="1.5" opacity="0.9"/>
  `;
};

export const renderThunderStrike: SpriteFn = (level) => {
  const s = scale(level);
  return `
    <path d="M55 85 Q25 55 ${20 - 5 * s} ${105 + 10 * s} Q45 95 58 108 Z" fill="#4a55ff" stroke="#0a1055" stroke-width="1.5" opacity="0.9"/>
    <path d="M145 85 Q175 55 ${180 + 5 * s} ${105 + 10 * s} Q155 95 142 108 Z" fill="#4a55ff" stroke="#0a1055" stroke-width="1.5" opacity="0.9"/>
    <path d="M100 60 L95 75 L105 75 L95 95" stroke="#ffe066" stroke-width="2.5" fill="none"/>
  `;
};

// --- Fusion: Magma Crust ---
export const renderMagmaCrust: SpriteFn = (level) => {
  const cracks: string[] = [];
  const count = 3 + level;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x1 = 100 + Math.cos(angle) * 40;
    const y1 = 115 + Math.sin(angle) * 30;
    const x2 = 100 + Math.cos(angle) * 58;
    const y2 = 115 + Math.sin(angle) * 43;
    cracks.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#ff5522" stroke-width="2" opacity="0.85"/>`,
    );
  }
  return cracks.join('');
};

export const SPRITE_FUNCTIONS: Record<string, SpriteFn> = {
  claws: renderClaws,
  horns: renderHorns,
  poison_gland: renderPoisonGland,
  fire_sac: renderFireSac,
  electric_organ: renderElectricOrgan,
  leather_hide: renderLeatherHide,
  chitin_plate: renderChitinPlate,
  wings: renderWings,
  stone_skin: renderStoneSkin,
  keen_senses: renderKeenSenses,
  magma_crust: renderMagmaCrust,
  venom_claws: renderVenomClaws,
  thunder_strike: renderThunderStrike,
};
