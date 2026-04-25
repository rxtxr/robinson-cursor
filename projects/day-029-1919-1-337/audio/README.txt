  broadcast.mp3   the offline-rendered output, played at runtime — committed
  disorder.mp3    the source recording — never committed, only present
                  locally if you intend to re-render

The runtime page only loads broadcast.mp3. If you want to retune the audio
character, drop a fresh disorder.mp3 here and re-run:

  node scripts/render-preview.js --pulses 89

89 pulses × 1.337 s = 119.0 s, which loops seamlessly. Once broadcast.mp3
is regenerated, disorder.mp3 can be deleted again. See ../README.md for
the architecture and ../STATEMENT.txt for attribution.
