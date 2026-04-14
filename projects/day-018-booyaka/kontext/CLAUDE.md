# Tarnmuster-Konfigurator – Claude Code Kontext

## Projektübersicht

Ein browserbasierter **Tarnmuster-Konfigurator** (Camouflage Pattern Generator) –
kein Build-System, kein Framework, reines Vanilla HTML/CSS/JS mit Canvas-Rendering.

Die App läuft direkt im Browser (`open index.html`) oder per `npm start` (lokaler Dev-Server).

## Aktueller Stand

Die Grundversion ist vollständig implementiert:

- **6 Mustertypen**: Woodland, Digital, Splinter, Tiger, Flecktarn, Multicam
- **7 Farbpaletten**: Wald, Wüste, Arktis, Urban, Dschungel, Nacht, Eigene
- **Parameter**: Skalierung, Dichte, Seed (Zufallsvariation)
- **Export**: PNG-Download

## Dateistruktur

```
camo-configurator/
├── CLAUDE.md          ← Du bist hier
├── README.md
├── index.html         ← Einstiegspunkt, UI-Markup & Styles
├── src/
│   ├── palettes.js    ← Farbpaletten-Definitionen
│   ├── noise.js       ← 2D Value Noise & RNG-Utilities
│   ├── patterns.js    ← Zeichenalgorithmen für alle Muster
│   └── ui.js          ← State-Management & UI-Logik
└── package.json       ← "npm start" → lokaler Dev-Server (http-server)
```

## Nächste Schritte / Feature-Ideen

### Kurzfristig (einfach)
- [ ] **Rotationswinkel**: Slider, der das gesamte Muster dreht (Canvas transform)
- [ ] **Unschärfe / Weichheit**: `ctx.filter = 'blur(Npx)'` vor dem Zeichnen
- [ ] **Kontrast-Regler**: Farben dynamisch aufhellen/abdunkeln (HSL-Manipulation)
- [ ] **Seitenverhältnis wählen**: A4 Hochformat, 1:1 Quadrat, 16:9, Custom
- [ ] **SVG-Export** zusätzlich zu PNG

### Mittelfristig
- [ ] **Mehr Muster**: MARPAT (Marine), Tigerstripe Vietnam, Desert Storm, Kryptek
- [ ] **Muster-Vorschau-Grid**: 6 Thumbnails mit verschiedenen Seeds für schnelles Browsen
- [ ] **Farbanzahl**: 2–6 Farben konfigurierbar (aktuell fest auf 4–5)
- [ ] **URL-State**: Parameter in URL-Hash speichern → teilbar/bookmarkbar
- [ ] **Undo/Redo**: letzten 10 Zustände speichern

### Mittelfristig – Rendering
- [ ] **Echte Perlin/Simplex Noise** (statt Value Noise) für organischere Woodland-Muster
- [ ] **Displacement Map**: Muster leicht verzerren für realistischeren Look
- [ ] **Overlay-Modus**: Zwei Muster übereinanderlegen mit Opacity-Kontrolle

### Langfristig
- [ ] **3D-Vorschau**: Muster auf einfaches 3D-Mesh legen (Three.js)
- [ ] **Textilsimulation**: Gewebetextur über das Muster legen
- [ ] **Batch-Export**: Mehrere Variationen als ZIP herunterladen
- [ ] **Preset speichern**: LocalStorage für eigene Lieblings-Konfigurationen

## Tech-Hinweise

- **Canvas API**: Alle Pattern-Algorithmen schreiben direkt auf `<canvas>` (640×420px).
  Für hochauflösende Exporte: `canvas.width/height` vor dem Export erhöhen, dann zurücksetzen.
- **RNG**: `seededRandom(seed)` aus `noise.js` – LCG-basiert, deterministisch.
  Gleicher Seed + gleiche Parameter = immer identisches Muster.
- **Noise**: `noise2d(seed, gridX, gridY)` gibt eine Funktion zurück, die für
  beliebige (x,y) einen Wert in [0,1] liefert (bilinear interpoliert).
- **Farben**: Paletten sind Arrays von Hex-Strings. `colors[0]` ist immer der Hintergrund.
- **State**: Globales `st`-Objekt in `ui.js`. Nach Änderung `render()` aufrufen.

## Muster-Algorithmen (patterns.js)

| Funktion | Technik |
|---|---|
| `drawWoodland` | Bezier-Blobs, zufällig gestapelt |
| `drawDigital` | Pixelgitter + 2-Oktaven Value Noise |
| `drawSplinter` | Zufällige konvexe Polygone |
| `drawTiger` | Sinus-wellenförmige Streifen |
| `drawFlecktarn` | Gedrehte Ellipsen |
| `drawMulticam` | 3-Oktaven Noise → Pixel-Level ImageData |

## Starten

```bash
npm install   # installiert http-server
npm start     # öffnet http://localhost:8080
```

Oder direkt: `open index.html` (kein Server nötig, alle Assets inline).
