/**
 * Seeded Linear Congruential Generator (LCG).
 * Deterministisch: gleicher seed → gleiche Sequenz.
 * @param {number} seed  Integer-Startwert
 * @returns {() => number}  Gibt Werte in [0, 1) zurück
 */
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * 2D Value Noise mit bilinearer Interpolation.
 * Gibt eine Funktion zurück, die für beliebige (x, y) einen Wert in [0, 1] liefert.
 *
 * @param {number} seed       Seed für den RNG
 * @param {number} gridX      Anzahl Gitterpunkte horizontal (Frequenz)
 * @param {number} gridY      Anzahl Gitterpunkte vertikal
 * @returns {(x: number, y: number) => number}
 *
 * Verwendung:
 *   const n = noise2d(42, 12, 8);
 *   const val = n(pixelX / canvasWidth * 12, pixelY / canvasHeight * 8);
 */
export function noise2d(seed, gridX = 12, gridY = 9) {
  const rng = seededRandom(seed);

  // Gitter mit zufälligen Werten befüllen
  const grid = Array.from({ length: gridY + 1 }, () =>
    Array.from({ length: gridX + 1 }, () => rng())
  );

  // Smoothstep-Interpolation (kubisch)
  const smoothStep = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * smoothStep(t);

  return (x, y) => {
    const xi = ((Math.floor(x) % gridX) + gridX) % gridX;
    const yi = ((Math.floor(y) % gridY) + gridY) % gridY;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const xi1 = (xi + 1) % gridX;
    const yi1 = (yi + 1) % gridY;

    return lerp(
      lerp(grid[yi][xi], grid[yi][xi1], xf),
      lerp(grid[yi1][xi], grid[yi1][xi1], xf),
      yf
    );
  };
}

/**
 * Fraktale Noise (mehrere Oktaven überlagert).
 * Mehr Oktaven = mehr Detail, aber langsamer.
 *
 * @param {number} seed
 * @param {number} octaves   Anzahl Oktaven (2–4 empfohlen)
 * @param {number} baseGridX Basisgitter X
 * @param {number} baseGridY Basisgitter Y
 */
export function fractalNoise(seed, octaves = 3, baseGridX = 6, baseGridY = 5) {
  const layers = Array.from({ length: octaves }, (_, i) =>
    noise2d(seed + i * 17, baseGridX * (i + 1), baseGridY * (i + 1))
  );

  const amplitudes = Array.from({ length: octaves }, (_, i) => 1 / (i + 1));
  const totalAmp = amplitudes.reduce((a, b) => a + b, 0);

  return (x, y) => {
    let value = 0;
    for (let i = 0; i < octaves; i++) {
      value += layers[i](x * (i + 1), y * (i + 1)) * amplitudes[i];
    }
    return value / totalAmp;
  };
}

/**
 * Hilfsfunktion: Hex-Farbe → [r, g, b]
 * @param {string} hex  z.B. '#4B5C29'
 * @returns {[number, number, number]}
 */
export function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
