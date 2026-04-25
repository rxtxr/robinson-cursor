/* ──────────────────────────────────────────────────────────────────────────
   1919-1.337 — day 029

   Audio is pre-rendered offline by scripts/render-preview.js, baked into
   audio/broadcast.mp3 and looped at runtime. The runtime keeps no FX graph;
   it just plays the file and drives the visual stack from AudioContext time.
   See README.md / STATEMENT.txt for why.
   ────────────────────────────────────────────────────────────────────────── */

// ── constants ─────────────────────────────────────────────────────────────

const PULSE_PERIOD     = 1.337;   // s — actual period of PSR B1919+21
const PULSE_LEAD_IN    = 0.20;    // s — matches the offset baked into broadcast.mp3
const MASTER_GAIN      = 0.65;
const FADE_IN          = 1.5;     // s — overall transmission fade-in on first start
const MUTE_RAMP        = 0.08;    // s

const MAX_LINES        = 80;      // visible stack height
const SAMPLES_PER_LINE = 280;     // resolution of each waveform
const SCROLL_TAU       = 0.08;    // s — exponential time-constant for row scroll
const NEW_LINE_FADE    = 0.45;    // s — visual fade-in for fresh lines
const KILL_ROW         = -2.5;    // remove lines that scroll above this

const AUDIO_CANDIDATES = [
  'audio/broadcast.mp3',
  'audio/broadcast.ogg',
  'audio/broadcast.wav',
];

// ── DOM ───────────────────────────────────────────────────────────────────

const canvas       = document.getElementById('stage');
const ctx2d        = canvas.getContext('2d', { alpha: false });
const overlay      = document.getElementById('start');
const startBtn     = document.getElementById('startBtn');
const startHint    = document.getElementById('startHint');
const muteBtn      = document.getElementById('muteBtn');
const errorEl      = document.getElementById('error');
const telPulse     = document.getElementById('telPulse');
const telTime      = document.getElementById('telTime');
const telStatus    = document.getElementById('telStatus');

// ── state ─────────────────────────────────────────────────────────────────

let audioCtx       = null;
let trackBuffer    = null;
let trackSource    = null;
let masterGain     = null;
let muted          = false;
let running        = false;

let broadcastT0    = 0;       // ctx.currentTime when the first pulse fires
let lastRevealed   = -1;      // most recently surfaced pulse index

let lines          = [];      // [{ pulseIdx, samples, bornAt, smoothRow }]
let newestPulseIdx = -1;

let dpr  = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
let cssW = 0, cssH = 0;
let lastFrameClock = 0;

// ── utilities ─────────────────────────────────────────────────────────────

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
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmtSig = secs => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs * 1000) % 1000);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
};

// ── pulse waveform generator ──────────────────────────────────────────────
//
// Each "line" is one rotation period of PSR B1919+21. Sharp main peak with
// 1–2 trailing sub-peaks, asymmetric shoulders, occasional null rotations —
// the way Saville's 1979 cover stylised Craft's stacked-pulse plot.

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

// ── canvas sizing ─────────────────────────────────────────────────────────

function resize() {
  dpr  = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  cssW = canvas.clientWidth;
  cssH = canvas.clientHeight;
  canvas.width  = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
}
window.addEventListener('resize', resize, { passive: true });

// ── render ────────────────────────────────────────────────────────────────

let vignetteCache = null;
function ensureVignette() {
  if (vignetteCache && vignetteCache.w === canvas.width && vignetteCache.h === canvas.height) return vignetteCache.grad;
  const r0 = Math.max(canvas.width, canvas.height) * 0.50;
  const r1 = Math.max(canvas.width, canvas.height) * 0.85;
  const g = ctx2d.createRadialGradient(
    canvas.width / 2, canvas.height * 0.5, r0,
    canvas.width / 2, canvas.height * 0.5, r1
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
  vignetteCache = { w: canvas.width, h: canvas.height, grad: g };
  return g;
}

function draw(now) {
  ctx2d.fillStyle = '#0c0a08';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
  ctx2d.fillStyle = ensureVignette();
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);

  const colW    = Math.min(cssW * 0.86, 720);
  const colX    = (cssW - colW) / 2;

  const topPad   = Math.max(64, cssH * 0.09);
  const botPad   = Math.max(140, cssH * 0.18);
  const stackH   = Math.max(220, cssH - topPad - botPad);
  const lineH    = stackH / MAX_LINES;
  const ampScale = lineH * 4.4;

  const dt = lastFrameClock ? Math.min(0.05, now - lastFrameClock) : 0.016;
  lastFrameClock = now;
  const k = 1 - Math.exp(-dt / SCROLL_TAU);

  if (lines.length) {
    lines = lines.filter(l => {
      const target = (MAX_LINES - 1) - (newestPulseIdx - l.pulseIdx);
      const sr = l.smoothRow ?? target;
      return target > KILL_ROW || sr > KILL_ROW;
    });
  }

  for (const line of lines) {
    const targetRow = (MAX_LINES - 1) - (newestPulseIdx - line.pulseIdx);
    if (line.smoothRow === undefined) line.smoothRow = targetRow;
    line.smoothRow += (targetRow - line.smoothRow) * k;

    const y = topPad + line.smoothRow * lineH;
    if (y < -ampScale || y > cssH + lineH) continue;

    const fadeIn  = clamp((now - line.bornAt) / NEW_LINE_FADE, 0, 1);
    const fadeOut = clamp((line.smoothRow + 0.5) / 1.5, 0, 1);
    const op      = fadeIn * fadeOut;
    if (op <= 0.001) continue;

    drawLine(line.samples, colX, y, colW, ampScale, op);
  }
}

function drawLine(samples, x0, baseY, width, ampScale, opacity) {
  const N = samples.length;

  ctx2d.beginPath();
  ctx2d.moveTo(x0 * dpr, (baseY + 2) * dpr);
  for (let i = 0; i < N; i++) {
    const x = x0 + (i / (N - 1)) * width;
    const y = baseY - samples[i] * ampScale;
    ctx2d.lineTo(x * dpr, y * dpr);
  }
  ctx2d.lineTo((x0 + width) * dpr, (baseY + 2) * dpr);
  ctx2d.closePath();
  ctx2d.fillStyle = opacity >= 0.999 ? '#0c0a08' : `rgba(12, 10, 8, ${opacity})`;
  ctx2d.fill();

  ctx2d.beginPath();
  for (let i = 0; i < N; i++) {
    const x = x0 + (i / (N - 1)) * width;
    const y = baseY - samples[i] * ampScale;
    if (i === 0) ctx2d.moveTo(x * dpr, y * dpr);
    else         ctx2d.lineTo(x * dpr, y * dpr);
  }
  ctx2d.strokeStyle = `rgba(235, 229, 214, ${opacity})`;
  ctx2d.lineWidth   = 1.0 * dpr;
  ctx2d.lineJoin    = 'round';
  ctx2d.lineCap     = 'round';
  ctx2d.stroke();
}

// ── main loop ─────────────────────────────────────────────────────────────

function frame() {
  if (!running) return;
  const now = audioCtx.currentTime;

  // visual reveal: any pulses whose audible time has now passed
  const expected = Math.floor((now - broadcastT0) / PULSE_PERIOD);
  while (lastRevealed < expected) {
    lastRevealed++;
    revealLine(lastRevealed, broadcastT0 + lastRevealed * PULSE_PERIOD);
  }

  draw(now);
  requestAnimationFrame(frame);
}

function revealLine(pulseIdx, atTime) {
  const samples = generatePulseLine(pulseIdx);
  lines.push({
    pulseIdx,
    samples,
    bornAt: atTime,
    smoothRow: undefined,
  });
  newestPulseIdx = pulseIdx;

  // telemetry — cumulative time since broadcast began
  const elapsed = pulseIdx * PULSE_PERIOD;
  telPulse.textContent = `#${String(pulseIdx).padStart(4, '0')}`;
  telTime.textContent  = fmtSig(elapsed);
  telStatus.textContent = 'RECEIVING';
}

// ── audio loading ─────────────────────────────────────────────────────────

async function loadAudioBuffer() {
  let lastErr = null;
  for (const url of AUDIO_CANDIDATES) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) { lastErr = new Error(`${url}: ${res.status}`); continue; }
      const arr = await res.arrayBuffer();
      const buf = await audioCtx.decodeAudioData(arr);
      return buf;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('No audio source found.');
}

// ── start ─────────────────────────────────────────────────────────────────

async function start() {
  startBtn.disabled = true;
  startBtn.querySelector('span').textContent = 'Receiving…';
  startHint.textContent = 'Decoding signal';

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx({ latencyHint: 'interactive' });
    await audioCtx.resume();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;     // ramp up after broadcast starts
    masterGain.connect(audioCtx.destination);

    trackBuffer = await loadAudioBuffer();
    console.info('[pulsar] loaded broadcast:', trackBuffer.duration.toFixed(2) + 's',
                 trackBuffer.numberOfChannels + 'ch', trackBuffer.sampleRate + 'Hz');

    trackSource = audioCtx.createBufferSource();
    trackSource.buffer = trackBuffer;
    trackSource.loop = true;
    trackSource.connect(masterGain);

    // start audio "now"; broadcast time matches the lead-in baked into the file
    const startAt = audioCtx.currentTime + 0.05;
    trackSource.start(startAt);
    broadcastT0 = startAt + PULSE_LEAD_IN;

    // fade in the whole transmission
    masterGain.gain.setValueAtTime(0, startAt);
    masterGain.gain.linearRampToValueAtTime(MASTER_GAIN, startAt + FADE_IN);

    lastRevealed   = -1;
    lines          = [];
    newestPulseIdx = -1;
    running        = true;

    overlay.classList.add('hide');
    setTimeout(() => overlay.remove(), 700);
    muteBtn.hidden = false;
    telStatus.textContent = 'LOCKED';

    if (cssW === 0 || cssH === 0) requestAnimationFrame(resize);
    requestAnimationFrame(frame);
  } catch (err) {
    console.error('[pulsar] start failed:', err);
    showError(err);
  }
}

function showError(err) {
  const msg = String(err && err.message || err);
  errorEl.innerHTML = `
    <div>
      <p style="color:var(--muted);letter-spacing:.2em;text-transform:uppercase;font-size:10px;margin-bottom:1.4em">Signal Lost</p>
      <p>No audio source found at <code>audio/broadcast.mp3</code>.</p>
      <p style="color:var(--muted);margin-top:1em;font-size:11px;line-height:1.6">
        Render it locally:&nbsp;<br>
        <code>node scripts/render-preview.js --pulses 89</code>
      </p>
      <p style="color:var(--muted);margin-top:1em;font-size:11px">${escapeHtml(msg)}</p>
    </div>`;
  errorEl.hidden = false;
  startBtn.disabled = false;
  startBtn.querySelector('span').textContent = 'Click to receive signal';
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// ── mute ──────────────────────────────────────────────────────────────────

muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.setAttribute('aria-pressed', String(muted));
  if (masterGain) {
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : MASTER_GAIN, t + MUTE_RAMP);
  }
});

// ── boot ──────────────────────────────────────────────────────────────────

resize();
startBtn.addEventListener('click', start);
