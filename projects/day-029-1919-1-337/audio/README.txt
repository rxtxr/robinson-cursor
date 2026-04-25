Two files belong here, neither committed:

  disorder.mp3   the source recording (only needed at render time)
  broadcast.mp3  the offline-rendered output played at runtime

The runtime page only loads broadcast.mp3. To regenerate it from a fresh
disorder.mp3:

  node scripts/render-preview.js --pulses 89

89 pulses × 1.337 s = 119.0 s, which loops seamlessly. Once broadcast.mp3
is generated, disorder.mp3 can be deleted. See ../README.md for the
architecture and ../STATEMENT.md for the legal rationale.
