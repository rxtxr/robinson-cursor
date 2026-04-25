#!/usr/bin/env node
/* Renders an offline preview of the audio engine using node-web-audio-api,
   then encodes to MP3 via ffmpeg. Mirrors the live graph in main.js — when
   you change a constant in main.js, mirror it here and re-run.

   Usage:  node scripts/render-preview.js [secondsToRender]

   Prereq: node-web-audio-api installed somewhere reachable. The script is
   tolerant of either a project-local install or /tmp/pulsar-render. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// locate node-web-audio-api wherever it lives
function loadWebAudio() {
  const candidates = [root, here, '/tmp/pulsar-render'];
  for (const dir of candidates) {
    try {
      const req = createRequire(join(dir, 'package.json'));
      return req('node-web-audio-api');
    } catch {}
  }
  throw new Error('node-web-audio-api not found. Run `npm install node-web-audio-api` in /tmp/pulsar-render or in this folder.');
}

const { OfflineAudioContext } = loadWebAudio();

// ── parameters (mirror main.js) ───────────────────────────────────────────

const PULSE_PERIOD     = 1.337;
const PULSE_DURATION   = 0.180;
const MASTER_GAIN      = 0.65;
const COMPRESSOR_OPTS  = { threshold: -16, knee: 6, ratio: 2.5, attack: 0.003, release: 0.10 };

const SONG_HIGHPASS    = 320;
const SONG_LOWPASS     = 850;
const SONG_DRIVE       = 1.3;
const SONG_BUS_GAIN    = 0.40;

const NOISE_DURATION   = 10.0;
const NOISE_GAIN       = 0.11;
const NOISE_LOWPASS    = 1700;

const REVERB_DURATION  = 1.10;
const REVERB_DECAY     = 2.4;
const REVERB_PREDELAY  = 0.014;
const REVERB_WET       = 0.60;

// pass --pulses N to render exactly N×PULSE_PERIOD seconds (seamless loop), or
// just a number of seconds and we'll round up to the next full-pulse boundary.
const argv = process.argv.slice(2);
let RENDER_PULSES;
const pIdx = argv.indexOf('--pulses');
if (pIdx >= 0) {
  RENDER_PULSES = parseInt(argv[pIdx + 1], 10);
} else {
  const secs = parseFloat(argv[0]) || 119;
  RENDER_PULSES = Math.max(1, Math.ceil(secs / PULSE_PERIOD));
}
const RENDER_SECONDS = RENDER_PULSES * PULSE_PERIOD;
console.log(`render plan: ${RENDER_PULSES} pulses → ${RENDER_SECONDS.toFixed(3)}s (seamless loop)`);

const SAMPLE_RATE    = 48000;
const OUT_WAV        = resolve(root, 'audio/broadcast.wav');
const OUT_MP3        = resolve(root, 'audio/broadcast.mp3');
const TRACK_PATH     = resolve(root, 'audio/disorder.mp3');

// ── builders ──────────────────────────────────────────────────────────────

function makeNoiseBuffer(ctx, secs) {
  const sr  = ctx.sampleRate;
  const len = Math.floor(sr * secs);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + 0.029591 * w;
    b1 = 0.985 * b1 + 0.032534 * w;
    b2 = 0.950 * b2 + 0.048056 * w;
    data[i] = (b0 + b1 + b2) * 0.22;
  }

  const clickCount = Math.floor(secs * 9);
  for (let c = 0; c < clickCount; c++) {
    const pos = Math.floor(Math.random() * (len - 200));
    const n   = 2 + Math.floor(Math.random() * 16);
    const loud = Math.random() < 0.12;
    const amp = (0.35 + Math.random() * 0.6) * (loud ? 2.6 : 1.0);
    for (let i = 0; i < n; i++) {
      data[pos + i] += (Math.random() - 0.5) * amp * Math.exp(-i / 3.5);
    }
  }

  const snapCount = Math.floor(secs * 4);
  for (let s = 0; s < snapCount; s++) {
    const pos = Math.floor(Math.random() * len);
    data[pos] += (Math.random() < 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.4);
  }

  const burstCount = Math.max(1, Math.floor(secs / 3.3));
  for (let b = 0; b < burstCount; b++) {
    const pos = Math.floor(Math.random() * (len - sr * 0.2));
    const n   = Math.floor(sr * (0.04 + Math.random() * 0.08));
    for (let i = 0; i < n; i++) {
      const k = i / n;
      const env = Math.sin(k * Math.PI);
      data[pos + i] += (Math.random() - 0.5) * 0.50 * env;
    }
  }
  return buf;
}

function makeSaturationCurve(drive) {
  const n = 2048;
  const curve = new Float32Array(n);
  const norm = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * drive) / norm;
  }
  return curve;
}

function makeReverbIR(ctx, durSec, decay) {
  const sr  = ctx.sampleRate;
  const len = Math.floor(sr * durSec);
  const ir  = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const w = (Math.random() * 2 - 1);
      prev = prev * 0.62 + w * 0.38;
      data[i] = prev * Math.pow(1 - i / len, decay);
    }
  }
  return ir;
}

const ENV_CURVE = (() => {
  const N = 96;
  const c = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    c[i] = Math.sin(Math.PI * k) ** 2;
  }
  return c;
})();

// ── render ────────────────────────────────────────────────────────────────

if (!existsSync(TRACK_PATH)) {
  console.error('Missing', TRACK_PATH);
  process.exit(1);
}

const trackBytes = readFileSync(TRACK_PATH);

console.log(`rendering ${RENDER_SECONDS}s at ${SAMPLE_RATE} Hz…`);
const ctx = new OfflineAudioContext({
  numberOfChannels: 2,
  length: Math.floor(RENDER_SECONDS * SAMPLE_RATE),
  sampleRate: SAMPLE_RATE,
});

// decode the track
const trackBuffer = await ctx.decodeAudioData(trackBytes.buffer.slice(
  trackBytes.byteOffset,
  trackBytes.byteOffset + trackBytes.byteLength,
));
console.log(`  track: ${trackBuffer.duration.toFixed(2)}s ${trackBuffer.numberOfChannels}ch`);

// master + compressor
const masterGain = ctx.createGain();
masterGain.gain.value = MASTER_GAIN;

const compressor = ctx.createDynamicsCompressor();
Object.entries(COMPRESSOR_OPTS).forEach(([k, v]) => {
  if (compressor[k] && compressor[k].setValueAtTime) compressor[k].setValueAtTime(v, 0);
});

compressor.connect(masterGain);
masterGain.connect(ctx.destination);

// song bus
const songBus = ctx.createGain();
songBus.gain.value = SONG_BUS_GAIN;

const songHP = ctx.createBiquadFilter();
songHP.type = 'highpass';
songHP.frequency.value = SONG_HIGHPASS;
songHP.Q.value = 0.7;

const songLP = ctx.createBiquadFilter();
songLP.type = 'lowpass';
songLP.frequency.value = SONG_LOWPASS;
songLP.Q.value = 0.7;

const songShaper = ctx.createWaveShaper();
songShaper.curve = makeSaturationCurve(SONG_DRIVE);
songShaper.oversample = '2x';

const reverbNode = ctx.createConvolver();
reverbNode.buffer = makeReverbIR(ctx, REVERB_DURATION, REVERB_DECAY);

const reverbDelay = ctx.createDelay(0.05);
reverbDelay.delayTime.value = REVERB_PREDELAY;

const reverbWet = ctx.createGain();
reverbWet.gain.value = REVERB_WET;

songBus.connect(songHP);
songHP.connect(songShaper);
songShaper.connect(songLP);
songLP.connect(compressor);
songLP.connect(reverbDelay);
reverbDelay.connect(reverbNode);
reverbNode.connect(reverbWet);
reverbWet.connect(compressor);

// noise + filter LFOs.
// Generate noise for the FULL render length so it doesn't loop within the
// render — we want only the file-level loop boundary to be a discontinuity.
const noiseSource = ctx.createBufferSource();
noiseSource.buffer = makeNoiseBuffer(ctx, RENDER_SECONDS + 0.5);
noiseSource.loop = false;

const noiseLP = ctx.createBiquadFilter();
noiseLP.type = 'lowpass';
noiseLP.frequency.value = NOISE_LOWPASS;
noiseLP.Q.value = 0.7;

const lfoA = ctx.createOscillator();
lfoA.frequency.value = 0.137;
const lfoAGain = ctx.createGain();
lfoAGain.gain.value = 380;

const lfoB = ctx.createOscillator();
lfoB.frequency.value = 0.071;
const lfoBGain = ctx.createGain();
lfoBGain.gain.value = 220;

lfoA.connect(lfoAGain);
lfoAGain.connect(noiseLP.frequency);
lfoB.connect(lfoBGain);
lfoBGain.connect(noiseLP.frequency);

const noiseGainNode = ctx.createGain();
noiseGainNode.gain.value = 0;

noiseSource.connect(noiseLP);
noiseLP.connect(noiseGainNode);
noiseGainNode.connect(compressor);

// noise + LFOs run for the full render — no fade-in here, the live page does
// its own fade via masterGain when the user hits play
noiseSource.start(0);
lfoA.start(0);
lfoB.start(0);
noiseGainNode.gain.setValueAtTime(NOISE_GAIN, 0);

// schedule pulses — exactly RENDER_PULSES of them, with the lead-in absorbed
// into the inter-pulse silence so the buffer loops seamlessly
console.log(`  scheduling ${RENDER_PULSES} pulses…`);

for (let i = 0; i < RENDER_PULSES; i++) {
  const when   = i * PULSE_PERIOD + 0.20;        // lead-in inside the first slot
  const offset = (i * PULSE_PERIOD) % trackBuffer.duration;

  const src = ctx.createBufferSource();
  src.buffer = trackBuffer;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.setValueCurveAtTime(ENV_CURVE, when, PULSE_DURATION);

  src.connect(env);
  env.connect(songBus);
  src.start(when, offset, PULSE_DURATION);
  src.stop(when + PULSE_DURATION + 0.02);
}

console.log('  rendering…');
const t0 = Date.now();
const rendered = await ctx.startRendering();
console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${rendered.length} samples / ${rendered.numberOfChannels} ch`);

// write WAV
function floatToWav(buf) {
  const n  = buf.length;
  const ch = buf.numberOfChannels;
  const sr = buf.sampleRate;
  const bytesPerSample = 2;
  const dataLen = n * ch * bytesPerSample;
  const out = Buffer.alloc(44 + dataLen);
  let p = 0;
  out.write('RIFF', p); p += 4;
  out.writeUInt32LE(36 + dataLen, p); p += 4;
  out.write('WAVE', p); p += 4;
  out.write('fmt ', p); p += 4;
  out.writeUInt32LE(16, p); p += 4;
  out.writeUInt16LE(1, p); p += 2;             // PCM
  out.writeUInt16LE(ch, p); p += 2;
  out.writeUInt32LE(sr, p); p += 4;
  out.writeUInt32LE(sr * ch * bytesPerSample, p); p += 4;
  out.writeUInt16LE(ch * bytesPerSample, p); p += 2;
  out.writeUInt16LE(8 * bytesPerSample, p); p += 2;
  out.write('data', p); p += 4;
  out.writeUInt32LE(dataLen, p); p += 4;

  const chans = [];
  for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      out.writeInt16LE((s * 32767) | 0, p);
      p += 2;
    }
  }
  return out;
}

writeFileSync(OUT_WAV, floatToWav(rendered));
console.log('  wrote', OUT_WAV);

execSync(`ffmpeg -y -i "${OUT_WAV}" -codec:a libmp3lame -b:a 192k "${OUT_MP3}"`,
  { stdio: 'inherit' });
console.log('  wrote', OUT_MP3);
