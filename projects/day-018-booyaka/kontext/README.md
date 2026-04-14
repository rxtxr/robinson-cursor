# Tarnmuster-Konfigurator

Browserbasierter Camouflage-Pattern-Generator. Kein Build-System, kein Framework –
reines Vanilla HTML/CSS/JS mit Canvas-Rendering.

## Starten

```bash
npm start
# → http://localhost:8080
```

Oder direkt im Browser öffnen (ES-Module benötigen `http://`-Kontext):

```bash
npx http-server . -p 8080 -o
```

## Features

- **6 Mustertypen**: Woodland, Digital, Splinter, Tiger, Flecktarn, Multicam
- **7 Farbpaletten** + freie Farbwahl
- **Skalierung, Dichte, Seed** per Slider konfigurierbar
- **PNG-Export** direkt aus dem Browser

## Projektstruktur

```
camo-configurator/
├── CLAUDE.md       ← Kontext & nächste Schritte für Claude Code
├── README.md
├── index.html      ← Einstiegspunkt (UI + Styles)
├── src/
│   ├── palettes.js ← Farbpaletten
│   ├── noise.js    ← Seeded RNG, 2D Value Noise, Fractal Noise
│   ├── patterns.js ← Zeichenalgorithmen (Woodland, Digital, …)
│   └── ui.js       ← State-Management & UI-Events
└── package.json
```

## Weiterentwicklung

Siehe `CLAUDE.md` für detaillierte Ideen und nächste Schritte.
