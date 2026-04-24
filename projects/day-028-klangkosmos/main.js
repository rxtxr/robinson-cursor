import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------- Data loading + classification ----------

const DATA_URLS = [
  './data/top_artists.json',
  './data/loyalty.json',
  './data/top_tracks.json',
  './covers.json'
];

async function loadData() {
  const [topArtists, loyalty, topTracks, coversRaw] = await Promise.all(
    DATA_URLS.map(u => fetch(u).then(r => r.ok ? r.json() : {}).catch(() => ({})))
  );
  const covers = coversRaw || {};

  const loyaltyByName = new Map();
  for (const a of loyalty) loyaltyByName.set(a.n, a);

  const tracksByArtist = new Map();
  for (const t of topTracks) {
    if (!tracksByArtist.has(t.ar)) tracksByArtist.set(t.ar, []);
    tracksByArtist.get(t.ar).push(t);
  }

  // Merge: every top artist gets loyalty metadata (span, active years)
  const merged = topArtists.map(a => {
    const loy = loyaltyByName.get(a.n);
    const years = loy ? loy.y : [];
    const span = loy ? loy.span : 1;
    const active = loy ? loy.active : 1;
    const loyaltyRatio = span > 0 ? active / span : 1;
    const cover = covers[a.n] || null;
    return {
      name: a.n,
      plays: a.p,
      ms: a.ms,
      firstPlay: a.f,
      lastPlay: a.l,
      years,
      span,
      active,
      loyaltyRatio,
      tracks: tracksByArtist.get(a.n) || [],
      coverPath: cover && cover.path ? cover.path : null,
      albumTitle: cover && cover.album ? cover.album : null,
      albumYear: cover && cover.year ? cover.year : null
    };
  });

  // Classify. Planets: top by plays with steady pattern. Asteroids: bursty listens.
  const planets = [];
  const asteroids = [];

  // Planets: top by plays, continuously listened (loyalty >= 0.80) AND span >= 2.
  const planetPool = merged
    .filter(a => a.loyaltyRatio >= 0.80 && a.span >= 2)
    .slice(0, 24);
  const planetNames = new Set(planetPool.map(a => a.name));
  planets.push(...planetPool);

  // Asteroids: significant plays but bursty — real gaps between first and last play,
  // or very concentrated (short active window). Excludes artists already chosen as planets.
  for (const a of merged.slice(0, 120)) {
    if (planetNames.has(a.name)) continue;
    if (a.plays < 180) continue;
    const hasGaps = a.span >= 5 && a.loyaltyRatio < 0.80;
    const concentrated = a.active > 0 && a.active <= 5;
    const unknownButSignificant = a.span === 0 && a.plays >= 240;
    if (hasGaps || concentrated || unknownButSignificant) {
      asteroids.push(a);
    }
    if (asteroids.length >= 16) break;
  }

  return { planets, asteroids, all: merged };
}

// ---------- Visuals: per-artist color + badge ----------

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function artistColor(name) {
  // Deterministic HSL from name hash — wide hue spread, medium sat, varied lightness
  const h = Math.abs(hashCode(name));
  const hue = h % 360;
  const sat = 45 + (h >> 8) % 30;   // 45–75
  const light = 45 + (h >> 16) % 20; // 45–65
  return { hue, sat, light };
}

function initials(name) {
  const parts = name.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function makeBadgeTexture(name) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const { hue, sat, light } = artistColor(name);

  // Circular background with radial gradient for depth
  const grad = ctx.createRadialGradient(96, 96, 8, 128, 128, 128);
  grad.addColorStop(0, `hsl(${hue}, ${sat}%, ${light + 18}%)`);
  grad.addColorStop(1, `hsl(${hue}, ${sat}%, ${Math.max(20, light - 15)}%)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring for logo-like feel
  ctx.strokeStyle = `hsla(${hue}, 60%, 85%, 0.6)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  // Initials
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px -apple-system, "Helvetica Neue", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillText(initials(name), 128, 134);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function makeLabelTexture(name, opts = {}) {
  const fontPx = opts.fontPx ?? 28;
  const padX = opts.padX ?? 20;
  const height = Math.round(fontPx * 1.7);
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `bold ${fontPx}px -apple-system, "Helvetica Neue", Arial`;
  const tw = Math.ceil(ctx.measureText(name).width);
  c.width = Math.max(48, tw + padX * 2);
  c.height = height;
  ctx.font = `bold ${fontPx}px -apple-system, "Helvetica Neue", Arial`;
  ctx.fillStyle = opts.bg ?? 'rgba(0, 0, 0, 0.55)';
  roundRect(ctx, 0, 0, c.width, c.height, Math.round(height / 4.5));
  ctx.fill();
  ctx.fillStyle = opts.fg ?? '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, c.width / 2, c.height / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function makeLabelSprite(name, opts = {}) {
  const tex = makeLabelTexture(name, opts);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    depthTest: false,
    transparent: true,
    fog: false
  });
  const sprite = new THREE.Sprite(mat);
  const scalePx = opts.scalePx ?? 40; // pixels per world unit (smaller = bigger label)
  sprite.scale.set(tex.image.width / scalePx, tex.image.height / scalePx, 1);
  sprite.renderOrder = 5;
  sprite.userData.isLabel = true;
  sprite.userData.labelOpts = opts;
  sprite.raycast = () => null; // labels must not intercept pointer picks
  return sprite;
}

function setSpriteLabel(sprite, text) {
  const opts = sprite.userData.labelOpts || {};
  const scalePx = opts.scalePx ?? 40;
  const old = sprite.material.map;
  const tex = makeLabelTexture(text, opts);
  sprite.material.map = tex;
  sprite.material.needsUpdate = true;
  sprite.scale.set(tex.image.width / scalePx, tex.image.height / scalePx, 1);
  if (old) old.dispose();
}

// Registry of sprites whose label text is language-dependent.
const localizedLabels = [];
function registerLocalizedLabel(sprite, de, en) {
  localizedLabels.push({ sprite, de, en });
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Scene build ----------

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05060a, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.003);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 60, 110);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 400;
controls.enablePan = true;
controls.panSpeed = 0.7;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.9;

// --- Starfield backdrop ---
// Three layers of stars (dim background, medium, bright) plus a soft nebula sphere.
// All star/nebula materials disable scene fog — otherwise FogExp2 swallows them.

function makeStarLayer(count, rMin, rMax, size, brightness) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  // Stellar-class color palette: blue-white, white, yellow, orange, red
  const tints = [
    [0.72, 0.82, 1.0],   // blue-white (hot)
    [0.92, 0.96, 1.0],   // white
    [1.0, 0.98, 0.88],   // yellow-white (Sun-like)
    [1.0, 0.82, 0.55],   // orange
    [1.0, 0.62, 0.48],   // red dwarf
  ];
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin);
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos[i*3+0] = r * Math.sin(p) * Math.cos(t);
    pos[i*3+1] = r * Math.cos(p);
    pos[i*3+2] = r * Math.sin(p) * Math.sin(t);

    // Weighted sample — mostly white/yellow, few hot or cool
    const roll = Math.random();
    let tint;
    if (roll < 0.12) tint = tints[0];
    else if (roll < 0.50) tint = tints[1];
    else if (roll < 0.80) tint = tints[2];
    else if (roll < 0.94) tint = tints[3];
    else tint = tints[4];
    const j = 0.7 + Math.random() * 0.3; // per-star dim jitter
    col[i*3+0] = tint[0] * brightness * j;
    col[i*3+1] = tint[1] * brightness * j;
    col[i*3+2] = tint[2] * brightness * j;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    fog: false,
    depthWrite: false
  });
  return new THREE.Points(geo, mat);
}

// Bright foreground stars — big, colorful, headline pinpoints
const brightStars = makeStarLayer(500, 300, 700, 2.4, 1.0);
scene.add(brightStars);

// Medium stars — the body of the sky
const mediumStars = makeStarLayer(3500, 350, 800, 1.4, 0.85);
scene.add(mediumStars);

// Dim background stars — dust of countless distant suns
const dimStars = makeStarLayer(9000, 500, 950, 0.8, 0.55);
scene.add(dimStars);

// Nebula backdrop — a very large sphere with a procedural galactic-band texture
// on its inside, rendered behind everything.
{
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Base: dark violet/navy gradient so the sky has depth even away from the band
  const baseGrad = ctx.createLinearGradient(0, 0, 0, c.height);
  baseGrad.addColorStop(0, '#06070d');
  baseGrad.addColorStop(0.5, '#0b0a18');
  baseGrad.addColorStop(1, '#06070d');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, c.width, c.height);

  // Soft milky band across the middle
  const bandGrad = ctx.createLinearGradient(0, c.height * 0.35, 0, c.height * 0.65);
  bandGrad.addColorStop(0, 'rgba(60, 45, 90, 0)');
  bandGrad.addColorStop(0.5, 'rgba(120, 95, 165, 0.28)');
  bandGrad.addColorStop(1, 'rgba(60, 45, 90, 0)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, 0, c.width, c.height);

  // Scatter nebula blobs along the band to break uniformity
  const blobs = [
    { x: 0.18, y: 0.52, r: 220, color: 'rgba(180, 90, 130, 0.22)' },
    { x: 0.38, y: 0.48, r: 280, color: 'rgba(110, 140, 210, 0.20)' },
    { x: 0.55, y: 0.55, r: 180, color: 'rgba(90, 60, 150, 0.22)' },
    { x: 0.72, y: 0.50, r: 320, color: 'rgba(220, 160, 110, 0.14)' },
    { x: 0.90, y: 0.53, r: 200, color: 'rgba(80, 130, 180, 0.18)' },
    { x: 0.08, y: 0.20, r: 160, color: 'rgba(140, 80, 160, 0.12)' },
    { x: 0.82, y: 0.80, r: 180, color: 'rgba(80, 130, 180, 0.12)' },
  ];
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x * c.width, b.y * c.height, 0, b.x * c.width, b.y * c.height, b.r);
    g.addColorStop(0, b.color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.9
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), mat);
  // Tilt the band a little so it doesn't cut the scene horizontally
  sky.rotation.z = 0.35;
  sky.rotation.y = 0.8;
  scene.add(sky);
}

// --- Sun ---
const sunGroup = new THREE.Group();
scene.add(sunGroup);

const sunGeo = new THREE.SphereGeometry(4, 48, 48);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc55 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sunGroup.add(sun);

// Sun glow — sprite
{
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d').createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 220, 120, 1)');
  g.addColorStop(0.25, 'rgba(255, 160, 60, 0.6)');
  g.addColorStop(1, 'rgba(255, 160, 60, 0)');
  const ctx = c.getContext('2d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(22, 22, 1);
  sunGroup.add(sprite);
}

const sunLight = new THREE.PointLight(0xffddaa, 2.2, 0, 1.4);
sunGroup.add(sunLight);
scene.add(new THREE.AmbientLight(0x2a3045, 0.6));

// Sun label — does not spin with the sun (sits on scene root so text stays upright)
const sunLabel = makeLabelSprite('the Music', {
  fontPx: 30,
  scalePx: 36,
  bg: 'rgba(80, 40, 10, 0.65)',
  fg: '#ffe6b0'
});
sunLabel.position.set(0, 6.5, 0);
sunLabel.userData.isSunLabel = true;
scene.add(sunLabel);
registerLocalizedLabel(sunLabel, 'die Musik', 'the Music');

// --- Orbit ring helper ---
function makeOrbitRing(radius, color = 0x2a3145, opacity = 0.35) {
  const segments = 128;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, fog: false });
  const line = new THREE.LineLoop(geo, mat);
  // Static: never moves — skip per-frame matrix recalculation.
  line.matrixAutoUpdate = false;
  line.updateMatrix();
  return line;
}

function makeEllipseOrbit(a, e, phi, tiltX, color = 0x3a2f5c, opacity = 0.25) {
  const b = a * Math.sqrt(1 - e * e);
  const segments = 192;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = Math.cos(t) * a - a * e;
    const z = Math.sin(t) * b;
    pts.push(new THREE.Vector3(x, 0, z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, fog: false });
  const line = new THREE.LineLoop(geo, mat);
  line.rotation.y = phi;
  line.rotation.x = tiltX;
  line.matrixAutoUpdate = false;
  line.updateMatrix();
  return line;
}

// --- Body factory ---

const textureLoader = new THREE.TextureLoader();

function loadCoverTexture(path) {
  return new Promise(resolve => {
    textureLoader.load(
      path,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        // Album covers are square; wrap them over the sphere cleanly.
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
}

function makePlanet(body, radius, orbitR) {
  const group = new THREE.Group();

  const badgeTex = makeBadgeTexture(body.name);
  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const { hue, sat, light } = artistColor(body.name);
  const mat = new THREE.MeshStandardMaterial({
    map: badgeTex,
    roughness: 0.7,
    metalness: 0.1,
    emissive: new THREE.Color(`hsl(${hue}, ${sat}%, ${Math.max(10, light - 35)}%)`),
    emissiveIntensity: 0.25
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.body = body;
  mesh.userData.kind = 'planet';
  group.add(mesh);

  // Progressive upgrade: if an album cover is available, swap the badge for it.
  if (body.coverPath) {
    loadCoverTexture(body.coverPath).then(tex => {
      if (!tex) return;
      mat.map = tex;
      mat.emissiveIntensity = 0.1; // less tint when a real image is shown
      mat.needsUpdate = true;
      if (badgeTex) badgeTex.dispose();
    });
  }

  const label = makeLabelSprite(body.name, { fontPx: 28, scalePx: 40 });
  label.position.y = radius + 1.2;
  group.add(label);

  group.userData.orbitR = orbitR;
  group.userData.body = body;
  group.userData.planetMesh = mesh;
  group.userData.label = label;
  return group;
}

function makeMoon(radius, parentRadius, orbitR, color = 0xcccccc, labelText = null) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 14, 10),
    new THREE.MeshLambertMaterial({ color })
  );
  g.add(mesh);
  if (labelText) {
    const label = makeLabelSprite(truncate(labelText, 22), {
      fontPx: 20,
      scalePx: 60,
      bg: 'rgba(0, 0, 0, 0.5)',
      fg: '#eaeaea'
    });
    label.position.y = radius + 0.6;
    g.add(label);
  }
  g.userData.orbitR = orbitR;
  g.userData.mesh = mesh;
  return g;
}

function makeAsteroid(body) {
  // Tumbling rocky shape — icosahedron with slight distortion via scale.
  // Wrap in a Group so the label can stay upright while the mesh tumbles.
  const group = new THREE.Group();
  const radius = 0.45 + Math.random() * 0.35;
  const geo = new THREE.IcosahedronGeometry(radius, 0);
  const { hue } = artistColor(body.name);
  const mat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(`hsl(${hue}, 20%, 45%)`),
    flatShading: true
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.set(1, 0.6 + Math.random() * 0.6, 0.7 + Math.random() * 0.4);
  mesh.userData.body = body;
  mesh.userData.kind = 'asteroid';
  mesh.userData.rotSpeed = new THREE.Vector3(
    (Math.random() - 0.5) * 0.04,
    (Math.random() - 0.5) * 0.04,
    (Math.random() - 0.5) * 0.04
  );
  group.add(mesh);

  const label = makeLabelSprite(truncate(body.name, 26), {
    fontPx: 22,
    scalePx: 55,
    bg: 'rgba(30, 20, 50, 0.7)',
    fg: '#d8ccf0'
  });
  label.position.y = radius + 0.9;
  group.add(label);

  group.userData.body = body;
  group.userData.mesh = mesh;
  return group;
}

// --- Layout ---

const planetOrbits = [];
const moons = [];
const asteroidOrbits = [];
let earthGroup = null;
const EARTH_ORBIT = 34;

async function buildWorld() {
  const { planets, asteroids } = await loadData();

  document.getElementById('body-count').textContent = (planets.length + asteroids.length + 1);

  // --- Earth (listener) ---
  const earth = new THREE.Group();
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 24, 20),
    new THREE.MeshStandardMaterial({ color: 0x3a78d8, roughness: 0.6, metalness: 0.1, emissive: 0x1a3a6d, emissiveIntensity: 0.3 })
  );
  earthMesh.userData.body = { name: 'du, der Hörer', plays: 222416, years: [], span: 22, active: 22, loyaltyRatio: 1, isEarth: true };
  earthMesh.userData.kind = 'earth';
  earth.add(earthMesh);

  const earthLabel = makeLabelSprite('me', {
    fontPx: 26,
    scalePx: 42,
    bg: 'rgba(10, 30, 70, 0.7)',
    fg: '#cde3ff'
  });
  earthLabel.position.y = 2.3;
  earth.add(earthLabel);
  registerLocalizedLabel(earthLabel, 'ich', 'me');

  // Moon of earth
  const earthMoon = new THREE.Group();
  const earthMoonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    new THREE.MeshLambertMaterial({ color: 0xcfcfcf })
  );
  earthMoon.add(earthMoonMesh);
  const earthMoonLabel = makeLabelSprite('Moon', {
    fontPx: 18,
    scalePx: 70,
    bg: 'rgba(0, 0, 0, 0.5)',
    fg: '#d8d8d8'
  });
  earthMoonLabel.position.y = 0.7;
  earthMoon.add(earthMoonLabel);
  registerLocalizedLabel(earthMoonLabel, 'Mond', 'Moon');
  earthMoon.userData.orbitR = 2.2;
  earth.add(earthMoon);
  earth.userData.earthMoon = earthMoon;

  earth.userData.orbitR = EARTH_ORBIT;
  earth.userData.body = earthMesh.userData.body;
  earth.userData.planetMesh = earthMesh;
  // Earth uses the same Kepler law as the planets — reference body at r=34.
  earth.userData.speed = 3.0 / Math.pow(EARTH_ORBIT, 1.2);
  earth.userData.phase = 0;
  scene.add(earth);
  scene.add(makeOrbitRing(EARTH_ORBIT, 0x4a90e2, 0.45));
  earthGroup = earth;

  // --- Planets ---
  const maxPlays = Math.max(...planets.map(p => p.plays));
  const minPlays = Math.min(...planets.map(p => p.plays));
  const logMax = Math.log(maxPlays);
  const logMin = Math.log(minPlays);

  // Sort by plays desc so top artists get inner orbits
  const sorted = [...planets].sort((a, b) => b.plays - a.plays);

  // Orbit distances: most plays closest to sun (strongest gravity)
  // range: innermost 10, outermost 80
  const INNER = 10, OUTER = 80;

  sorted.forEach((body, i) => {
    const frac = i / Math.max(1, sorted.length - 1);
    // Curve slightly so inner orbits are a bit packed, outer spread out
    const orbitR = INNER + (OUTER - INNER) * Math.pow(frac, 0.85);

    // Planet size: log-scaled between 0.55 and 2.6
    const plays = body.plays;
    const sizeFrac = (Math.log(plays) - logMin) / (logMax - logMin);
    const radius = 0.55 + sizeFrac * 2.05;

    const group = makePlanet(body, radius, orbitR);
    group.userData.phase = Math.random() * Math.PI * 2;

    // Orbital speed. Three independent variables shape each planet's motion:
    //   1. Kepler ∝ 1/r^1.2 — outer orbits slower (~10× spread across the planet belt).
    //   2. Plays-bond: heavily-played artists orbit faster (factor 0.7…1.5).
    //   3. Recency: still being played → +0…+20% bonus, long-dormant → no bonus.
    const keplerSpeed = 3.0 / Math.pow(orbitR, 1.2);
    const playsMod = 0.7 + sizeFrac * 0.8;
    const nowSec = Date.now() / 1000;
    const yearsSinceLast = (nowSec - body.lastPlay) / (365.25 * 24 * 3600);
    const recencyMod = 1 + Math.max(0, 0.2 - yearsSinceLast * 0.05);
    group.userData.speed = keplerSpeed * playsMod * recencyMod;

    // Slight inclination per planet so not all coplanar — but keep subtle
    group.userData.inclination = (Math.random() - 0.5) * 0.06;

    scene.add(group);
    scene.add(makeOrbitRing(orbitR, 0x2a3145, 0.3));
    planetOrbits.push(group);

    // Moons for the top 4 artists — named after their top tracks
    if (i < 4) {
      const tracks = body.tracks.slice(0, i === 0 ? 2 : 1);
      tracks.forEach((t, j) => {
        const m = makeMoon(0.22 + radius * 0.08, radius, radius * 1.8 + j * 0.6, 0xcccccc, t.tr);
        m.userData.phase = Math.random() * Math.PI * 2;
        m.userData.speed = 1.2 + j * 0.4;
        m.userData.body = { name: `${t.tr}`, artist: body.name, plays: t.p, isMoon: true };
        m.userData.mesh.userData.body = m.userData.body;
        m.userData.mesh.userData.kind = 'moon';
        group.add(m);
        moons.push({ group: m, parent: group });
      });
    }
  });

  // --- Asteroids ---
  asteroids.forEach((body, i) => {
    const group = makeAsteroid(body);

    // Elliptical orbit that crosses Earth's orbit
    const a = EARTH_ORBIT + (Math.random() - 0.2) * 18;
    const e = 0.35 + Math.random() * 0.45;
    const peri = a * (1 - e);
    const apo = a * (1 + e);
    let finalA = a, finalE = e;
    if (peri > EARTH_ORBIT - 2 || apo < EARTH_ORBIT + 3) {
      finalA = EARTH_ORBIT + 4;
      finalE = 0.55;
    }

    const phi = Math.random() * Math.PI * 2;
    const tiltX = (Math.random() - 0.5) * 0.45;
    const orbit = {
      group,
      rock: group.userData.mesh,
      a: finalA,
      e: finalE,
      phi,
      tiltX,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4
    };

    scene.add(group);
    scene.add(makeEllipseOrbit(finalA, finalE, phi, tiltX, 0x4a3a6f, 0.2));
    asteroidOrbits.push(orbit);
  });
}

// ---------- Interaction: raycast + info panel ----------

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const info = document.getElementById('info');
const infoName = document.getElementById('info-name');
const infoKind = document.getElementById('info-kind');
const infoDl = document.getElementById('info-dl');
const infoBar = document.getElementById('info-bar');
const infoYears = document.getElementById('info-years');
document.getElementById('info-close').addEventListener('click', () => info.classList.remove('visible'));

let hovered = null;

function pickBody(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Candidates: all planet meshes + earth + moons + asteroids
  const meshes = [];
  for (const g of planetOrbits) meshes.push(g.userData.planetMesh);
  for (const m of moons) meshes.push(m.group.userData.mesh);
  for (const ao of asteroidOrbits) meshes.push(ao.rock);
  if (earthGroup) meshes.push(earthGroup.userData.planetMesh);

  const hits = raycaster.intersectObjects(meshes, false);
  return hits.length > 0 ? hits[0].object : null;
}

function fmtNumber(n) {
  return n.toLocaleString('de-DE');
}
function fmtDate(ts) {
  try {
    const d = new Date(ts * 1000);
    return d.toISOString().slice(0, 10);
  } catch (e) { return '—'; }
}
function fmtMs(ms) {
  const hrs = ms / 1000 / 60 / 60;
  if (hrs > 48) return `${Math.round(hrs / 24)} ${L('Tage','days')}`;
  return `${Math.round(hrs)} ${L('Std','hrs')}`;
}

function showInfo(mesh) {
  const b = mesh.userData.body;
  const kind = mesh.userData.kind;
  info.classList.add('visible');
  infoName.textContent = b.name;

  if (kind === 'earth') {
    infoKind.textContent = L('Erde', 'Earth');
    infoDl.innerHTML = `
      <dt>${L('gesamt-plays','total plays')}</dt><dd>${fmtNumber(b.plays)}</dd>
      <dt>${L('zeitraum','time span')}</dt><dd>2005–2026</dd>
      <dt>${L('perspektive','perspective')}</dt><dd>${L('du bist hier', 'you are here')}</dd>
    `;
    infoBar.style.width = '100%';
    infoYears.innerHTML = '';
    return;
  }

  if (kind === 'moon') {
    infoKind.textContent = L('Mond', 'Moon');
    infoDl.innerHTML = `
      <dt>${L('track','track')}</dt><dd>${b.name}</dd>
      <dt>${L('artist','artist')}</dt><dd>${b.artist}</dd>
      <dt>${L('plays','plays')}</dt><dd>${fmtNumber(b.plays)}</dd>
    `;
    infoBar.style.width = '100%';
    infoYears.innerHTML = '';
    return;
  }

  if (kind === 'asteroid') {
    infoKind.textContent = L('Asteroid — Phasen-Hörer', 'Asteroid — phase-listen');
  } else {
    infoKind.textContent = L('Planet — stetiger Begleiter', 'Planet — steady companion');
  }

  const parts = [
    `<dt>${L('plays','plays')}</dt><dd>${fmtNumber(b.plays)}</dd>`,
    `<dt>${L('hörzeit','listening time')}</dt><dd>${fmtMs(b.ms)}</dd>`,
    `<dt>${L('erste','first')}</dt><dd>${fmtDate(b.firstPlay)}</dd>`,
    `<dt>${L('letzte','last')}</dt><dd>${fmtDate(b.lastPlay)}</dd>`,
    `<dt>${L('aktive jahre','active years')}</dt><dd>${b.active} / ${b.span}</dd>`,
    `<dt>${L('treue','loyalty')}</dt><dd>${Math.round((b.loyaltyRatio || 0) * 100)}%</dd>`
  ];
  if (b.albumTitle) {
    const yearSuffix = b.albumYear ? ` (${b.albumYear})` : '';
    parts.push(`<dt>${L('cover','cover')}</dt><dd>${b.albumTitle}${yearSuffix}</dd>`);
  }
  infoDl.innerHTML = parts.join('');

  // Bar reflects plays relative to top artist (Aphex Twin ~4256)
  infoBar.style.width = `${Math.min(100, (b.plays / 4256) * 100)}%`;

  // Year strip — 22 bars, 2005–2026
  let html = '';
  const yearSet = new Set(b.years || []);
  for (let y = 2005; y <= 2026; y++) {
    html += `<i class="${yearSet.has(y) ? 'on' : ''}" title="${y}"></i>`;
  }
  infoYears.innerHTML = html;
}

// Throttle raycasts to at most once per animation frame — pointermove can fire
// dozens of times per frame on trackpads, and each raycast walks ~50 meshes.
let pendingPointerMove = null;
function onPointerMove(e) {
  const x = e.clientX ?? (e.touches && e.touches[0]?.clientX);
  const y = e.clientY ?? (e.touches && e.touches[0]?.clientY);
  if (x == null) return;
  if (pendingPointerMove != null) {
    pendingPointerMove.x = x;
    pendingPointerMove.y = y;
    return;
  }
  pendingPointerMove = { x, y };
  requestAnimationFrame(() => {
    const pm = pendingPointerMove;
    pendingPointerMove = null;
    if (!pm) return;
    const picked = pickBody(pm.x, pm.y);
    if (picked) {
      tooltip.classList.add('visible');
      tooltip.style.left = pm.x + 'px';
      tooltip.style.top = pm.y + 'px';
      tooltip.textContent = picked.userData.body.name;
      hovered = picked;
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.classList.remove('visible');
      hovered = null;
      canvas.style.cursor = '';
    }
  });
}

function onPointerClick(e) {
  const x = e.clientX ?? (e.changedTouches && e.changedTouches[0]?.clientX);
  const y = e.clientY ?? (e.changedTouches && e.changedTouches[0]?.clientY);
  if (x == null) return;
  const picked = pickBody(x, y);
  if (picked) {
    showInfo(picked);
  }
}

canvas.addEventListener('pointermove', onPointerMove, { passive: true });
canvas.addEventListener('click', onPointerClick);

// ---------- Animation ----------

let paused = false;
let followEarth = false;
const clock = new THREE.Clock();

function positionOnCircle(group, phase, r, inclination = 0) {
  const x = Math.cos(phase) * r;
  const z = Math.sin(phase) * r;
  const y = Math.sin(phase * 2) * inclination * r; // slight wobble for inclination
  group.position.set(x, y, z);
}

function positionOnEllipse(obj, phase, a, e, phi, tiltX) {
  const b = a * Math.sqrt(1 - e * e);
  // parametric position with focus at origin
  const x0 = Math.cos(phase) * a - a * e;
  const z0 = Math.sin(phase) * b;
  // Rotate in xz plane by phi
  const x1 = x0 * Math.cos(phi) - z0 * Math.sin(phi);
  const z1 = x0 * Math.sin(phi) + z0 * Math.cos(phi);
  // Tilt around x axis
  const y1 = -z1 * Math.sin(tiltX);
  const z2 = z1 * Math.cos(tiltX);
  obj.position.set(x1, y1, z2);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (!paused) {
    // Sun spin
    sunGroup.rotation.y += dt * 0.15;

    // Earth
    if (earthGroup) {
      earthGroup.userData.phase += dt * earthGroup.userData.speed;
      positionOnCircle(earthGroup, earthGroup.userData.phase, earthGroup.userData.orbitR);
      earthGroup.userData.planetMesh.rotation.y += dt * 0.8;
      // Earth's moon
      const em = earthGroup.userData.earthMoon;
      em.userData.phase = (em.userData.phase || 0) + dt * 1.6;
      positionOnCircle(em, em.userData.phase, em.userData.orbitR);
    }

    // Planets
    for (const g of planetOrbits) {
      g.userData.phase += dt * g.userData.speed;
      positionOnCircle(g, g.userData.phase, g.userData.orbitR, g.userData.inclination);
      g.userData.planetMesh.rotation.y += dt * 0.35;
    }

    // Moons follow their parent planet
    for (const m of moons) {
      m.group.userData.phase += dt * m.group.userData.speed;
      const r = m.group.userData.orbitR;
      const p = m.group.userData.phase;
      m.group.position.set(Math.cos(p) * r, Math.sin(p * 1.3) * 0.2, Math.sin(p) * r);
    }

    // Asteroids
    for (const ao of asteroidOrbits) {
      ao.phase += dt * ao.speed * 0.3;
      positionOnEllipse(ao.group, ao.phase, ao.a, ao.e, ao.phi, ao.tiltX);
      const rs = ao.rock.userData.rotSpeed;
      ao.rock.rotation.x += rs.x;
      ao.rock.rotation.y += rs.y;
      ao.rock.rotation.z += rs.z;
    }
  }

  // Camera follow earth
  if (followEarth && earthGroup) {
    const target = earthGroup.position;
    controls.target.lerp(target, 0.1);
  }

  controls.update();
  renderer.render(scene, camera);
}

// ---------- Resize ----------

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Buttons + Language ----------

let lang = 'en';
function L(de, en) { return lang === 'de' ? de : en; }

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-de]').forEach(el => {
    const text = lang === 'de' ? el.dataset.de : el.dataset.en;
    if (el.dataset.html === '1') el.innerHTML = text;
    else el.textContent = text;
  });
  document.querySelectorAll('[data-de-label]').forEach(el => {
    const de = el.dataset.deLabel, en = el.dataset.enLabel;
    if (el.id === 'btn-pause') el.textContent = paused ? L('weiter', 'resume') : L('pause', 'pause');
    else if (el.id === 'btn-follow') el.textContent = followEarth ? L('frei', 'free') : L('folge erde', 'follow earth');
    else el.textContent = lang === 'de' ? de : en;
  });
  document.getElementById('btn-lang').textContent = lang === 'de' ? 'EN' : 'DE';
  // 3D-scene labels whose text depends on language (sun, earth, earth moon).
  for (const { sprite, de, en } of localizedLabels) {
    setSpriteLabel(sprite, lang === 'de' ? de : en);
  }
}

document.getElementById('btn-pause').addEventListener('click', (e) => {
  paused = !paused;
  e.currentTarget.classList.toggle('on', paused);
  applyLang();
});
document.getElementById('btn-follow').addEventListener('click', (e) => {
  followEarth = !followEarth;
  e.currentTarget.classList.toggle('on', followEarth);
  applyLang();
});
document.getElementById('btn-lang').addEventListener('click', () => {
  lang = lang === 'de' ? 'en' : 'de';
  applyLang();
});

// ---------- Boot ----------

buildWorld()
  .then(() => {
    applyLang();
    document.getElementById('loader').classList.add('hidden');
    animate();
  })
  .catch(err => {
    console.error(err);
    document.getElementById('loader').textContent = 'error loading data — see console';
  });
