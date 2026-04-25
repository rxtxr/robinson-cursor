# day 029 — 1919-1.337

A pulsar 2,300 light-years out is broadcasting. Every 1.337 seconds, when
its rotation aligns with us, a 180-millisecond keyhole opens. We catch
what survives the distance — a memory of a recording, not the recording
itself.

The visual is a recreation of Harold D. Craft Jr.'s 1970 stacked-pulse
plot of pulsar **PSR B1919+21**, the same plot Peter Saville redrew in
1979 for one of the most-photocopied record covers in popular music. The
cover redraws itself, one rotation at a time, in real time with the
broadcast.

For the artist statement (DE/EN) and the full attribution / legal note,
see [`STATEMENT.txt`](./STATEMENT.txt).

## Architecture

The page does not process audio at runtime. It plays one looped MP3
(`audio/broadcast.mp3`) and drives the visual stack from
`AudioContext.currentTime`. The whole sound design — bandpass, soft
saturation, dark convolver reverb on every pulse, drift-modulated pink
noise, crackles, static bursts — is baked into that file by
`scripts/render-preview.js` using Node's WebAudio implementation.

The render is exactly **89 × 1.337 s = 119.0 s** so the file loops
seamlessly on the pulse cadence.

This was originally built with the full FX graph live in the browser.
Moving it offline made the runtime ~half the code, deterministic across
loops, and indistinguishable to the listener — at the cost of
regenerating the audio file whenever a parameter changes.

## Files

```
index.html              markup + start overlay + telemetry
styles.css              palette + IBM Plex Mono + EB Garamond
main.js                 visual + single-source playback (no live FX)
STATEMENT.txt            artist statement (DE/EN) + legal note
audio/broadcast.mp3     rendered output — not committed, runtime-required
scripts/render-preview.js  Node renderer (offline WebAudio graph)
scripts/gen-thumb.js    regenerates thumb.png from the same line algorithm
```

## Build

```bash
# 1. drop a copy of the source recording into audio/disorder.mp3 (only
#    needed at render time; can be deleted afterward)
# 2. install the offline WebAudio runtime once (anywhere reachable by Node)
npm install --prefix /tmp/pulsar-render node-web-audio-api

# 3. render the broadcast — exactly 89 pulses for a seamless loop
node scripts/render-preview.js --pulses 89

# 4. delete the source if you want a minimal footprint
rm audio/disorder.mp3

# 5. serve and open
python3 -m http.server   # or any static server
# http://localhost:8000/projects/day-029-1919-1-337/
```

To re-tune the audio: edit the `SONG_*`, `NOISE_*`, `REVERB_*` constants
at the top of `scripts/render-preview.js`, re-run step 3.

## Visual

- Each line is procedurally generated: sharp main peak with one or two
  trailing sub-peaks, asymmetric shoulders, occasional null rotations,
  caricaturing the radio profile of a real pulsar.
- New lines appear at the bottom; older lines slide up; once 80 are
  stacked the topmost falls off (FIFO).
- Each line is drawn as a closed polygon filled in the background colour
  with a hairline stroke on top — that's the Saville trick: each line
  masks the peaks behind it.
- Visual reveal is driven by `AudioContext.currentTime` so the cover
  redraws exactly on the pulse beat, never drifting from the audio.

## Audio character

- Heavy lowpass (~850 Hz) — voice barely identifiable, just contour.
- Highpass (~320 Hz) — sub-bass gone.
- Soft tanh saturation, then a dark convolver reverb (~1.1 s decay,
  60% wet) that smears each pulse's tail into the noise floor.
- Pink-ish noise at low level, with two slow incommensurate LFOs
  modulating its lowpass cutoff — feels like a receiver tuning, not waves.
- Dense crackles + sporadic 40–120 ms static bursts.
- Hann-window envelope (`sin²`) on each pulse — the fragment swells in
  and out, never switches on.
