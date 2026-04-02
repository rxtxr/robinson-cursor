// ─── visualAIzer ────────────────────────────────────────────
// Milkdrop-inspired music visualizer with moiré GL shader
// and real 3D metallic text tunnel, both driven by audio analysis.

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const glCanvas = document.getElementById('glCanvas');

// ─── Audio engine ───────────────────────────────────────────
let audioCtx, analyser, sourceNode, gainNode;
let freqData, timeData;
const FFT_SIZE = 2048;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.82;
  gainNode = audioCtx.createGain();
  gainNode.connect(analyser);
  analyser.connect(audioCtx.destination);
  freqData = new Uint8Array(analyser.frequencyBinCount);
  timeData = new Uint8Array(analyser.fftSize);
}

// ─── Playlist / track management ────────────────────────────
let tracks = [];
let currentTrackIndex = -1;
const audio = new Audio();
audio.crossOrigin = 'anonymous';

async function loadBuiltinTracks() {
  try {
    const res = await fetch('tracks.json');
    tracks = await res.json();
  } catch (e) {
    tracks = [];
  }
}

function connectAudioElement() {
  initAudio();
  if (sourceNode) sourceNode.disconnect();
  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(gainNode);
}

let audioConnected = false;

function playTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentTrackIndex = index;
  const track = tracks[index];
  audio.src = track.objectUrl || track.file;

  if (!audioConnected) {
    connectAudioElement();
    audioConnected = true;
  }

  audio.play().then(() => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  updateTrackInfo(track);
  rebuildTextRing(track.title || track.file);
}

function updateTrackInfo(track) {
  document.getElementById('trackTitle').textContent = track.title || track.file;
  document.getElementById('trackArtist').textContent = track.artist || '';
  const lic = document.getElementById('license');
  if (track.license) {
    lic.innerHTML = track.licenseUrl
      ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
      : `${track.license} — ${track.artist}`;
  } else {
    lic.textContent = '';
  }
}

// ─── User file drop / browse ────────────────────────────────
function addUserFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('audio/')) continue;
    const url = URL.createObjectURL(f);
    const name = f.name.replace(/\.[^.]+$/, '');
    tracks.push({ file: f.name, objectUrl: url, title: name, artist: 'Local file', license: '' });
  }
  if (currentTrackIndex === -1 && tracks.length > 0) playTrack(0);
}

document.getElementById('fileInput').addEventListener('change', e => addUserFiles(e.target.files));

document.body.addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('dragover'); });
document.body.addEventListener('dragleave', () => document.body.classList.remove('dragover'));
document.body.addEventListener('drop', e => {
  e.preventDefault();
  document.body.classList.remove('dragover');
  addUserFiles(e.dataTransfer.files);
});

// ─── Transport controls ─────────────────────────────────────
const playBtn = document.getElementById('playBtn');
const seekBar = document.getElementById('seekBar');
const volumeBar = document.getElementById('volumeBar');
const timeCurrent = document.getElementById('timeCurrent');
const timeDuration = document.getElementById('timeDuration');

playBtn.addEventListener('click', () => {
  if (!audioCtx) initAudio();
  if (audio.paused) {
    if (currentTrackIndex === -1 && tracks.length > 0) playTrack(0);
    else { audio.play(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
  } else {
    audio.pause();
  }
});

document.getElementById('prevBtn').addEventListener('click', () => {
  if (tracks.length) playTrack((currentTrackIndex - 1 + tracks.length) % tracks.length);
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if (tracks.length) playTrack((currentTrackIndex + 1) % tracks.length);
});

audio.addEventListener('ended', () => { if (tracks.length > 1) playTrack((currentTrackIndex + 1) % tracks.length); });
audio.addEventListener('play', () => { playBtn.innerHTML = '&#9646;&#9646;'; });
audio.addEventListener('pause', () => { playBtn.innerHTML = '&#9654;'; });
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  timeCurrent.textContent = fmtTime(audio.currentTime);
  timeDuration.textContent = fmtTime(audio.duration);
});
seekBar.addEventListener('input', () => { if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration; });
volumeBar.addEventListener('input', () => { audio.volume = volumeBar.value; });

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// ─── Audio analysis helpers ─────────────────────────────────
function getBandEnergy(lo, hi) {
  if (!freqData) return 0;
  const nyquist = audioCtx ? audioCtx.sampleRate / 2 : 22050;
  const binCount = freqData.length;
  const loBin = Math.floor(lo / nyquist * binCount);
  const hiBin = Math.min(Math.floor(hi / nyquist * binCount), binCount - 1);
  let sum = 0;
  for (let i = loBin; i <= hiBin; i++) sum += freqData[i];
  return sum / (hiBin - loBin + 1) / 255;
}

function getWaveformEnergy() {
  if (!timeData) return 0;
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / timeData.length);
}

// ─── WebGL Moiré shader (background layer) ──────────────────
let gl, glProgram, glUniforms;

const VERT_SRC = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;
const FRAG_SRC = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time, u_f1, u_f2, u_theta1, u_theta2;
uniform float u_amplitude, u_zoom;
uniform float u_bass, u_mid, u_treble, u_energy;
uniform int u_colormode;

vec3 viridis(float t) {
  vec3 c0=vec3(.267,.004,.329); vec3 c1=vec3(.283,.141,.458);
  vec3 c2=vec3(.254,.265,.530); vec3 c3=vec3(.206,.372,.553);
  vec3 c4=vec3(.164,.471,.558); vec3 c5=vec3(.128,.567,.551);
  vec3 c6=vec3(.135,.659,.518); vec3 c7=vec3(.267,.749,.441);
  vec3 c8=vec3(.478,.821,.318); vec3 c9=vec3(.741,.873,.150);
  vec3 c10=vec3(.993,.906,.144);
  float s=t*10.; int i=int(s); float f=fract(s);
  if(i>=10) return c10;
  if(i==0) return mix(c0,c1,f); if(i==1) return mix(c1,c2,f);
  if(i==2) return mix(c2,c3,f); if(i==3) return mix(c3,c4,f);
  if(i==4) return mix(c4,c5,f); if(i==5) return mix(c5,c6,f);
  if(i==6) return mix(c6,c7,f); if(i==7) return mix(c7,c8,f);
  if(i==8) return mix(c8,c9,f); return mix(c9,c10,f);
}
vec3 inferno(float t) {
  vec3 c0=vec3(.001,.000,.014); vec3 c1=vec3(.106,.032,.245);
  vec3 c2=vec3(.280,.047,.398); vec3 c3=vec3(.453,.082,.398);
  vec3 c4=vec3(.610,.148,.338); vec3 c5=vec3(.748,.241,.253);
  vec3 c6=vec3(.854,.367,.159); vec3 c7=vec3(.929,.520,.055);
  vec3 c8=vec3(.961,.695,.039); vec3 c9=vec3(.950,.872,.227);
  vec3 c10=vec3(.988,.998,.645);
  float s=t*10.; int i=int(s); float f=fract(s);
  if(i>=10) return c10;
  if(i==0) return mix(c0,c1,f); if(i==1) return mix(c1,c2,f);
  if(i==2) return mix(c2,c3,f); if(i==3) return mix(c3,c4,f);
  if(i==4) return mix(c4,c5,f); if(i==5) return mix(c5,c6,f);
  if(i==6) return mix(c6,c7,f); if(i==7) return mix(c7,c8,f);
  if(i==8) return mix(c8,c9,f); return mix(c9,c10,f);
}
vec3 plasma(float t) {
  vec3 c0=vec3(.051,.032,.099); vec3 c1=vec3(.192,.040,.303);
  vec3 c2=vec3(.351,.065,.432); vec3 c3=vec3(.504,.137,.444);
  vec3 c4=vec3(.630,.230,.400); vec3 c5=vec3(.750,.340,.320);
  vec3 c6=vec3(.860,.470,.230); vec3 c7=vec3(.930,.620,.150);
  vec3 c8=vec3(.960,.770,.130); vec3 c9=vec3(.950,.900,.260);
  vec3 c10=vec3(.940,.975,.530);
  float s=t*10.; int i=int(s); float f=fract(s);
  if(i>=10) return c10;
  if(i==0) return mix(c0,c1,f); if(i==1) return mix(c1,c2,f);
  if(i==2) return mix(c2,c3,f); if(i==3) return mix(c3,c4,f);
  if(i==4) return mix(c4,c5,f); if(i==5) return mix(c5,c6,f);
  if(i==6) return mix(c6,c7,f); if(i==7) return mix(c7,c8,f);
  if(i==8) return mix(c8,c9,f); return mix(c9,c10,f);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / u_zoom;
  float bassWarp = u_bass * 40.0;
  float midWarp = u_mid * 20.0;
  float r1 = (u_theta1 + bassWarp) * 3.14159265 / 180.0;
  float r2 = (u_theta2 + midWarp) * 3.14159265 / 180.0;
  float freq1 = u_f1 * (1.0 + u_bass * 0.5);
  float freq2 = u_f2 * (1.0 + u_treble * 0.3);
  float v1 = sin(6.28318 * (uv.x*cos(r1)+uv.y*sin(r1)) / freq1);
  float v2 = sin(6.28318 * (uv.x*cos(r2)+uv.y*sin(r2)) / freq2);
  float r3 = u_time * 0.3 + u_energy * 6.28;
  float freq3 = 30.0 + u_mid * 40.0;
  float v3 = sin(6.28318 * (uv.x*cos(r3)+uv.y*sin(r3)) / freq3) * u_energy;
  float val = (v1 + v2 + v3) * 0.33 * u_amplitude;
  float t = val * 0.5 + 0.5;
  vec3 col;
  if(u_colormode == 0) col = viridis(t);
  else if(u_colormode == 1) col = inferno(t);
  else col = plasma(t);
  col *= 0.7 + u_energy * 0.6;
  gl_FragColor = vec4(col, 1.0);
}
`;

function initGL() {
  gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
  if (!gl) return false;

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERT_SRC);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAG_SRC);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('Fragment shader:', gl.getShaderInfoLog(fs));
    return false;
  }

  glProgram = gl.createProgram();
  gl.attachShader(glProgram, vs);
  gl.attachShader(glProgram, fs);
  gl.linkProgram(glProgram);
  gl.useProgram(glProgram);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(glProgram, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  glUniforms = {};
  ['u_resolution','u_time','u_f1','u_f2','u_theta1','u_theta2',
   'u_amplitude','u_zoom','u_bass','u_mid','u_treble','u_energy','u_colormode']
    .forEach(n => glUniforms[n] = gl.getUniformLocation(glProgram, n));
  return true;
}

// ─── Shader animation state ────────────────────────────────
let shaderTime = 0;
let baseTheta1 = 0, baseTheta2 = 45;
let baseF1 = 20, baseF2 = 25;
let colorMode = 0, colorModeTimer = 0;

function evolveParams(dt) {
  baseTheta1 += dt * 3.0;
  baseTheta2 -= dt * 2.2;
  baseF1 = 18 + Math.sin(shaderTime * 0.07) * 8;
  baseF2 = 22 + Math.cos(shaderTime * 0.05) * 10;
  colorModeTimer += dt;
  if (colorModeTimer > 20) { colorMode = (colorMode + 1) % 3; colorModeTimer = 0; }
}

// ─── Three.js — 3D metallic text tunnel ─────────────────────
let threeRenderer, threeScene, threeCamera;
let textRingGroup, tunnelRings = [];
let loadedFont = null;

// How many repeated rings for the tunnel
const TUNNEL_RINGS = 8;
const RING_SPACING = 6;

function initThree() {
  threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  threeRenderer.setSize(window.innerWidth, window.innerHeight);
  threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  threeRenderer.toneMappingExposure = 1.2;
  document.getElementById('threeContainer').appendChild(threeRenderer.domElement);

  threeScene = new THREE.Scene();

  // Strong perspective for tunnel effect
  threeCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 200);
  threeCamera.position.set(0, 0, 2);
  threeCamera.lookAt(0, 0, -50);

  // Lighting for metallic PBR
  const ambient = new THREE.AmbientLight(0x222233, 0.5);
  threeScene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(3, 5, 5);
  threeScene.add(key);

  const fill = new THREE.DirectionalLight(0x4466ff, 1.0);
  fill.position.set(-4, 2, 3);
  threeScene.add(fill);

  const rim = new THREE.DirectionalLight(0xff4400, 0.8);
  rim.position.set(0, -3, -5);
  threeScene.add(rim);

  // Point lights that move with audio
  const point1 = new THREE.PointLight(0x00ffaa, 2, 30);
  point1.position.set(0, 0, 0);
  threeScene.add(point1);
  const point2 = new THREE.PointLight(0xff00ff, 1.5, 30);
  point2.position.set(0, 0, -10);
  threeScene.add(point2);

  threeScene.userData.point1 = point1;
  threeScene.userData.point2 = point2;
  threeScene.userData.key = key;

  // Environment map for metallic reflections (simple procedural)
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x111122);
  // Add some colored lights to the env
  const envLight1 = new THREE.PointLight(0x4488ff, 50, 100);
  envLight1.position.set(10, 10, 10);
  envScene.add(envLight1);
  const envLight2 = new THREE.PointLight(0xff4400, 50, 100);
  envLight2.position.set(-10, -5, -10);
  envScene.add(envLight2);
  const envLight3 = new THREE.PointLight(0x00ff88, 30, 100);
  envLight3.position.set(0, 10, -15);
  envScene.add(envLight3);

  const pmrem = new THREE.PMREMGenerator(threeRenderer);
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  threeScene.environment = envMap;
  pmrem.dispose();

  // Container for all text rings
  textRingGroup = new THREE.Group();
  threeScene.add(textRingGroup);
}

// Material for the metallic letters
function createMetalMaterial(hue) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.15, 0.55),
    metalness: 0.95,
    roughness: 0.15,
    envMapIntensity: 1.5,
  });
}

function rebuildTextRing(title) {
  if (!loadedFont || !textRingGroup) return;

  // Clear old
  while (textRingGroup.children.length) {
    const child = textRingGroup.children[0];
    child.traverse(obj => { if (obj.geometry) obj.geometry.dispose(); if (obj.material) obj.material.dispose(); });
    textRingGroup.remove(child);
  }
  tunnelRings = [];

  if (!title) return;
  const text = title.toUpperCase();
  const letterCount = text.length;

  for (let r = 0; r < TUNNEL_RINGS; r++) {
    const ringGroup = new THREE.Group();
    const ringZ = -r * RING_SPACING;
    ringGroup.position.z = ringZ;

    // Radius gets slightly larger as rings go deeper (perspective tunnel)
    const ringRadius = 3.5 + r * 0.3;

    const ringLetters = [];
    for (let i = 0; i < letterCount; i++) {
      const char = text[i];
      if (char === ' ') continue;

      const angle = (i / letterCount) * Math.PI * 2;

      const geo = new TextGeometry(char, {
        font: loadedFont,
        size: 0.6 + r * 0.02,
        depth: 0.25,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 3,
      });
      geo.computeBoundingBox();
      geo.center();

      // Each ring gets slightly shifted hue
      const hue = ((i / letterCount) + r * 0.08) % 1.0;
      const mat = createMetalMaterial(hue);

      const mesh = new THREE.Mesh(geo, mat);

      // Position on the ring
      mesh.position.x = Math.cos(angle) * ringRadius;
      mesh.position.y = Math.sin(angle) * ringRadius;
      mesh.position.z = 0;

      // Face outward from center (readable from inside the tunnel)
      mesh.lookAt(0, 0, ringZ);
      // Then rotate to face the camera (toward +Z)
      mesh.rotateY(Math.PI);

      ringGroup.add(mesh);
      ringLetters.push({ mesh, baseAngle: angle, index: i });
    }

    textRingGroup.add(ringGroup);
    tunnelRings.push({ group: ringGroup, letters: ringLetters, baseZ: ringZ, radius: ringRadius });
  }
}

// ─── Scene system ───────────────────────────────────────────
// Scenes evolve over time, each with its own character.
// 0: straight tunnel        4: vortex — fast spiral, bass zoom
// 1: angled perspective     5: breathing — slow pulse, minimal
// 2: wireframe              6: chaos — random camera, all max
// 3: flythrough             7: monolith — static front, deep bass extrusion
const SCENE_IDLE_DURATION = 25; // seconds per scene when no music
const SCENE_COUNT = 8;
let currentScene = 0;
let sceneTimer = 0;
let sceneBlend = 0;
const SCENE_TRANSITION = 2.0;
let manualScene = false;

// Beat detection state
let prevBassRaw = 0;
let prevMtRaw = 0;
let beatCooldown = 0;       // time since last beat-triggered switch
let sIntensity = 0;         // smoothed overall intensity (0-1)
let lastScenes = [];         // avoid immediate repeats

// Smoothed scene-specific values for interpolation
let sAngle = 0;
let sOffsetX = 0;
let sOffsetY = 0;
let sDepthMult = 1;
let sWireframe = 0;
let sRingScaleX = 1, sRingScaleY = 1;

// Keyboard: 1-8 select scene, 0 = auto-cycle
document.addEventListener('keydown', (e) => {
  const n = parseInt(e.key);
  if (isNaN(n)) return;
  if (n === 0) {
    manualScene = false;
    sceneTimer = 0;
  } else if (n >= 1 && n <= SCENE_COUNT) {
    currentScene = n - 1;
    sceneTimer = 0;
    manualScene = true;
  }
});

function pickRandomScene() {
  let next;
  // Avoid repeating the last 2 scenes
  do { next = Math.floor(Math.random() * SCENE_COUNT); }
  while (lastScenes.includes(next) && SCENE_COUNT > 3);
  lastScenes.push(next);
  if (lastScenes.length > 2) lastScenes.shift();
  return next;
}

function detectBeatAndSwitch(dt, bass, mid, treble, energy) {
  if (manualScene) return;

  sceneTimer += dt;
  beatCooldown += dt;

  // Overall intensity: ramps up fast, decays slowly
  const rawIntensity = Math.min((bass + energy) * 1.2, 1);
  const intensitySmooth = rawIntensity > sIntensity ? (1 - Math.exp(-dt * 3)) : (1 - Math.exp(-dt * 0.3));
  sIntensity += (rawIntensity - sIntensity) * intensitySmooth;

  // Is music playing at all?
  const musicPlaying = bass > 0.05 || energy > 0.03;

  if (!musicPlaying) {
    // No music: simple timer-based cycling
    if (sceneTimer >= SCENE_IDLE_DURATION) {
      currentScene = (currentScene + 1) % SCENE_COUNT;
      sceneTimer = 0;
    }
    return;
  }

  // Beat detection: bass kick + offbeat (mid/treble transients)
  const bassRise = bass - prevBassRaw;
  prevBassRaw = bass;
  const isKick = bassRise > 0.1 && bass > 0.2;
  // Offbeat: detect snare/hihat transients in mid+treble range
  const midTreble = (mid + treble) * 0.5;
  const mtRise = midTreble - (prevMtRaw || 0);
  prevMtRaw = midTreble;
  const isOffbeat = mtRise > 0.08 && midTreble > 0.2;
  // At high energy, offbeats also trigger; at low energy, only kicks
  const isBeat = isKick || (isOffbeat && sIntensity > 0.5);

  // Min cooldown between switches scales with intensity:
  // full intensity → 0.4s (can switch on every kick in 4otf)
  // high           → 2-4s (every few kicks)
  // medium         → 6-10s
  // low            → 14-20s
  const minCooldown = 0.4 + (1 - sIntensity) * 19;

  // Probability of switching on a given beat:
  // full intensity → 80% per kick
  // medium         → 30%
  // low            → 5%
  const switchChance = 0.05 + sIntensity * 0.75;

  if (isBeat && beatCooldown >= minCooldown && Math.random() < switchChance) {
    currentScene = pickRandomScene();
    sceneTimer = 0;
    beatCooldown = 0;
  }

  // Fallback: if no beat triggered a switch for too long
  const maxWait = 8 + (1 - sIntensity) * 20;
  if (sceneTimer >= maxWait) {
    currentScene = pickRandomScene();
    sceneTimer = 0;
    beatCooldown = 0;
  }
}

function updateThree(dt, bass, mid, treble, energy, time) {
  if (!threeRenderer) return;

  // ── Beat-driven scene switching ──
  detectBeatAndSwitch(dt, bass, mid, treble, energy);

  const transIn = Math.min(sceneTimer / SCENE_TRANSITION, 1);
  sceneBlend = transIn;

  // ── Target values per scene ──
  let targetAngle = 0, targetOffX = 0, targetOffY = 0;
  let targetDepthMult = 1, targetWireframe = 0;
  let targetScaleX = 1, targetScaleY = 1;
  let fovBase = 80, fovEnergy = 25;
  let rotSpeedMult = 1, scrollSpeed = 1;
  let reactivity = 1;

  if (currentScene === 0) {
    // 1: Straight tunnel — gentle intro
    targetOffX = Math.sin(time * 0.2) * 0.3 * mid;
    targetOffY = Math.cos(time * 0.15) * 0.3 * treble;
    targetDepthMult = 0.5 + bass * 0.8 + energy * 0.5;
    fovBase = 80; fovEnergy = 25;

  } else if (currentScene === 1) {
    // 2: Angled perspective — orbit, depth punchy
    const orbitSpeed = 0.12 + mid * 0.08;
    targetAngle = time * orbitSpeed;
    const orbitRadius = 2.5 + bass * 1.5;
    targetOffX = Math.sin(targetAngle) * orbitRadius;
    targetOffY = Math.cos(targetAngle * 0.7) * orbitRadius * 0.6;
    targetDepthMult = 0.15 + bass * 3 + energy * 2.5;
    fovBase = 70; fovEnergy = 35;
    rotSpeedMult = 1.5; scrollSpeed = 0.7;

  } else if (currentScene === 2) {
    // 3: Wireframe — stripped, extreme depth
    targetWireframe = 1;
    targetAngle = time * 0.15;
    const wobble = energy * 2;
    targetOffX = Math.sin(time * 0.3) * (1.5 + wobble);
    targetOffY = Math.cos(time * 0.25) * (1.0 + wobble);
    targetDepthMult = 0.1 + bass * 4 + energy * 3.5;
    fovBase = 90; fovEnergy = 40;
    rotSpeedMult = 2.5; scrollSpeed = 1.5; reactivity = 2.5;

  } else if (currentScene === 3) {
    // 4: Flythrough — fast, depth surges on hits
    targetOffX = Math.sin(time * 0.4) * 0.8;
    targetOffY = Math.cos(time * 0.35) * 0.8;
    targetDepthMult = 0.15 + bass * 2.5 + energy * 2;
    fovBase = 100; fovEnergy = 30;
    scrollSpeed = 3 + energy * 4;
    rotSpeedMult = 0.5;

  } else if (currentScene === 4) {
    // 5: Vortex — fast spiral, bass zooms
    targetAngle = time * 0.6;
    targetOffX = Math.sin(targetAngle) * (0.5 + bass * 2);
    targetOffY = Math.cos(targetAngle) * (0.5 + bass * 2);
    targetDepthMult = 0.2 + energy * 3;
    fovBase = 60 + bass * 30; fovEnergy = 20;
    rotSpeedMult = 3 + mid * 3;
    scrollSpeed = 1 + bass * 2;
    reactivity = 2;

  } else if (currentScene === 5) {
    // 6: Breathing — slow meditative pulse
    const breath = Math.sin(time * 0.3) * 0.5 + 0.5;
    targetOffX = Math.sin(time * 0.08) * 0.5;
    targetOffY = Math.cos(time * 0.06) * 0.3;
    targetDepthMult = 0.1 + breath * 0.4 + bass * 1.5;
    targetScaleX = 1 + breath * 0.3 + mid * 0.2;
    targetScaleY = 1 + breath * 0.3 + mid * 0.2;
    fovBase = 65; fovEnergy = 15;
    rotSpeedMult = 0.3; scrollSpeed = 0.3;
    reactivity = 0.8;

  } else if (currentScene === 6) {
    // 7: Chaos — erratic camera, everything maxed
    targetWireframe = energy > 0.3 ? 1 : 0; // flicker wireframe on hits
    const chaos = Math.sin(time * 2.3) * Math.cos(time * 1.7);
    targetOffX = chaos * 4 * energy + Math.sin(time * 0.8) * 2;
    targetOffY = Math.cos(time * 3.1) * 3 * energy + Math.cos(time * 0.6) * 1.5;
    targetDepthMult = 0.1 + bass * 4 + energy * 4;
    targetScaleX = 1 + bass * 0.5; targetScaleY = 1 + treble * 0.5;
    fovBase = 70 + energy * 40; fovEnergy = 30;
    rotSpeedMult = 2 + energy * 4;
    scrollSpeed = 1 + energy * 3;
    reactivity = 3;

  } else if (currentScene === 7) {
    // 8: Monolith — static front view, deep bass extrusion
    targetOffX = 0;
    targetOffY = 0;
    targetDepthMult = 0.05 + bass * 5 + energy * 3;
    fovBase = 50; fovEnergy = 10;
    rotSpeedMult = 0.15;
    scrollSpeed = 0.1;
    reactivity = 1.5;
  }

  // ── Smooth interpolation ──
  const lerpSpeed = 1 - Math.exp(-dt * 2.5);
  sOffsetX += (targetOffX - sOffsetX) * lerpSpeed;
  sOffsetY += (targetOffY - sOffsetY) * lerpSpeed;
  sDepthMult += (targetDepthMult - sDepthMult) * lerpSpeed;
  sWireframe += (targetWireframe - sWireframe) * (1 - Math.exp(-dt * 4));
  sRingScaleX += (targetScaleX - sRingScaleX) * lerpSpeed;
  sRingScaleY += (targetScaleY - sRingScaleY) * lerpSpeed;

  // ── Camera ──
  const camZ = 2 + bass * 4;
  threeCamera.position.set(sOffsetX, sOffsetY, camZ);
  threeCamera.fov = fovBase + energy * fovEnergy;
  threeCamera.updateProjectionMatrix();
  threeCamera.lookAt(sOffsetX * 0.2, sOffsetY * 0.2, -30);

  // ── Lights ──
  const p1 = threeScene.userData.point1;
  const p2 = threeScene.userData.point2;
  p1.position.set(
    Math.sin(time * 0.7) * 3 + sOffsetX,
    Math.cos(time * 0.5) * 3 + sOffsetY,
    2 + bass * 5
  );
  p1.intensity = (1 + energy * 5) * reactivity;
  p1.color.setHSL((time * 0.05) % 1, 0.8, 0.5);
  p2.position.set(
    Math.cos(time * 0.4) * 4 + sOffsetX * 0.5,
    Math.sin(time * 0.6) * 2 + sOffsetY * 0.5,
    -8 + mid * 3
  );
  p2.intensity = (1 + bass * 4) * reactivity;
  p2.color.setHSL((time * 0.05 + 0.5) % 1, 0.8, 0.5);
  threeScene.userData.key.intensity = (1.5 + energy * 2) * reactivity;

  // ── Rings ──
  for (let r = 0; r < tunnelRings.length; r++) {
    const ring = tunnelRings[r];
    const g = ring.group;

    // Rotation — alternating direction, speed varies by scene
    const speed = (0.1 + r * 0.03) * (1 + mid * 2) * rotSpeedMult;
    const dir = r % 2 === 0 ? 1 : -1;
    g.rotation.z += dt * speed * dir;

    // Scroll toward camera
    g.position.z += dt * (1 + bass * 3) * scrollSpeed;
    if (g.position.z > threeCamera.position.z + 3) {
      g.position.z = ring.baseZ - TUNNEL_RINGS * RING_SPACING * 0.3;
    }

    // Pulse ring radius with per-axis squash/stretch
    const pulseBase = 1 + bass * 0.15 * reactivity;
    g.scale.set(pulseBase * sRingScaleX, pulseBase * sRingScaleY, 1);

    // Per-letter depth: scenes 0-3 = uniform per ring, scenes 4-7 = individual variance
    const letterCount = ring.letters.length;
    const perLetterVariance = currentScene >= 4; // only 5-8 get individual depth

    // Compute uniform ring depth (smoothed)
    if (ring.smoothRingZ === undefined) ring.smoothRingZ = 1;
    ring.smoothRingZ += (sDepthMult - ring.smoothRingZ) * (1 - Math.exp(-dt * 10));

    for (const l of ring.letters) {
      let letterFreqVal = 0;
      if (perLetterVariance && freqData && freqData.length > 0) {
        const binIndex = Math.floor(((l.index + r * 7) % letterCount) / letterCount * freqData.length * 0.6);
        letterFreqVal = freqData[Math.min(binIndex, freqData.length - 1)] / 255;
      }

      const s = 1 + treble * 0.3 * reactivity + energy * 0.2 * reactivity;

      let zScale;
      if (perLetterVariance) {
        // Scenes 5-8: individual letter depth from FFT
        if (l.mesh.userData.smoothZ === undefined) l.mesh.userData.smoothZ = 1;
        const targetZ = sDepthMult * (0.1 + letterFreqVal * 4 * reactivity + bass * 2 * reactivity);
        l.mesh.userData.smoothZ += (targetZ - l.mesh.userData.smoothZ) * (1 - Math.exp(-dt * 12));
        zScale = l.mesh.userData.smoothZ;
      } else {
        // Scenes 1-4: all letters in a ring move together
        zScale = ring.smoothRingZ;
      }
      l.mesh.scale.set(s, s, zScale);

      const hue = ((l.index / letterCount) + time * 0.02 + r * 0.08) % 1.0;
      const lightness = 0.4 + energy * 0.3 * reactivity;

      // Wireframe blend
      const isWire = sWireframe > 0.5;
      if (l.mesh.material.wireframe !== isWire) {
        l.mesh.material.wireframe = isWire;
      }

      if (isWire) {
        // Wireframe: brighter, more saturated, emissive
        const depthGlow = perLetterVariance ? Math.min(letterFreqVal * 1.5, 1) : energy;
        l.mesh.material.color.setHSL(hue, 0.6 + depthGlow * 0.4, 0.4 + depthGlow * 0.5);
        l.mesh.material.metalness = 0.3;
        l.mesh.material.roughness = 0.8;
        l.mesh.material.emissive.setHSL(hue, 0.9, 0.05 + depthGlow * 0.5 + energy * 0.3);
        l.mesh.material.envMapIntensity = 0.3;
      } else {
        // Solid metal
        l.mesh.material.color.setHSL(hue, 0.15 + energy * 0.4, lightness);
        l.mesh.material.metalness = 0.95;
        l.mesh.material.roughness = 0.15 + treble * 0.2;
        l.mesh.material.emissive.setHSL(hue, 0.8, energy * 0.15 + letterFreqVal * 0.1);
        l.mesh.material.envMapIntensity = 1.5;
      }
    }
  }

  threeRenderer.render(threeScene, threeCamera);
}

// ─── Resize ─────────────────────────────────────────────────
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  glCanvas.width = w * dpr;
  glCanvas.height = h * dpr;
  glCanvas.style.width = w + 'px';
  glCanvas.style.height = h + 'px';
  if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);

  if (threeRenderer) {
    threeRenderer.setSize(w, h);
    threeCamera.aspect = w / h;
    threeCamera.updateProjectionMatrix();
  }
}

window.addEventListener('resize', resize);

// ─── Main loop ──────────────────────────────────────────────
let lastTime = 0;
let sBass = 0, sMid = 0, sTreble = 0, sEnergy = 0;

function frame(now) {
  requestAnimationFrame(frame);

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  shaderTime += dt;

  // Read audio data
  let bass = 0, mid = 0, treble = 0, energy = 0;
  if (analyser && !audio.paused) {
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);
    bass = getBandEnergy(20, 200);
    mid = getBandEnergy(200, 2000);
    treble = getBandEnergy(2000, 16000);
    energy = getWaveformEnergy();
  }

  const sm = 1 - Math.exp(-dt * 8);
  sBass += (bass - sBass) * sm;
  sMid += (mid - sMid) * sm;
  sTreble += (treble - sTreble) * sm;
  sEnergy += (energy - sEnergy) * sm;

  if (energy > 0.6 && colorModeTimer > 5) {
    colorMode = (colorMode + 1) % 3;
    colorModeTimer = 0;
  }

  evolveParams(dt);

  // Render moiré background
  if (gl) {
    gl.uniform2f(glUniforms.u_resolution, glCanvas.width, glCanvas.height);
    gl.uniform1f(glUniforms.u_time, shaderTime);
    gl.uniform1f(glUniforms.u_f1, baseF1);
    gl.uniform1f(glUniforms.u_f2, baseF2);
    gl.uniform1f(glUniforms.u_theta1, baseTheta1);
    gl.uniform1f(glUniforms.u_theta2, baseTheta2);
    gl.uniform1f(glUniforms.u_amplitude, 0.8 + sEnergy * 0.5);
    gl.uniform1f(glUniforms.u_zoom, 1.0 + sBass * 0.4);
    gl.uniform1f(glUniforms.u_bass, sBass);
    gl.uniform1f(glUniforms.u_mid, sMid);
    gl.uniform1f(glUniforms.u_treble, sTreble);
    gl.uniform1f(glUniforms.u_energy, sEnergy);
    gl.uniform1i(glUniforms.u_colormode, colorMode);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Render 3D text tunnel
  updateThree(dt, sBass, sMid, sTreble, sEnergy, shaderTime);
  updateSceneIndicator();
}

// ─── Init ───────────────────────────────────────────────────
const SCENE_NAMES = [
  'Tunnel', 'Angled', 'Wireframe', 'Flythrough',
  'Vortex', 'Breathing', 'Chaos', 'Monolith'
];
const sceneIndicatorEl = document.getElementById('sceneIndicator');
let lastIndicatorScene = -1;

function updateSceneIndicator() {
  if (currentScene === lastIndicatorScene) return;
  lastIndicatorScene = currentScene;
  sceneIndicatorEl.innerHTML = SCENE_NAMES.map((name, i) =>
    `<span class="${i === currentScene ? 'active' : ''}">${i + 1} ${name}</span>`
  ).join('');
}

async function init() {
  resize();
  initGL();
  initThree();

  // Load font
  const fontLoader = new FontLoader();
  fontLoader.load(
    'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json',
    (font) => {
      loadedFont = font;
      // If a track is already selected, build the ring
      if (currentTrackIndex >= 0) {
        rebuildTextRing(tracks[currentTrackIndex].title);
      }
    }
  );

  await loadBuiltinTracks();
  if (tracks.length > 0) {
    updateTrackInfo(tracks[0]);
  }
  requestAnimationFrame(frame);
}

init();
