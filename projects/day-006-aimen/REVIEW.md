# AImen — Code Review

**Quelle:** `amen-break-chopper(1).html` (1706 Zeilen, ~130KB, single-file app)
**Datum:** 2026-04-02

---

## Gesamteindruck

Feature-reicher Amen Break Chopper mit beeindruckendem Funktionsumfang: Slice Bank mit Drum-Klassifizierung, Step Sequencer, FX Rack (Filter, Flanger, Delay, Reverb, Drive, Bitcrusher, Vinyl), Bass Synth mit 4 Typen. Alles in einer einzigen HTML-Datei, rein Web Audio API — kein Framework, keine externen JS-Deps.

**Stärken:**
- Audio-Engine solide: FX-Kette korrekt geroutet (input → drive → filter → flanger → delay/reverb → compressor)
- Bass-Synthese gut umgesetzt (808 Sub, Reese, Hoover, 303 Saw)
- BPM-Detection + Transient Snap als Slicing-Optionen
- UI-Design konsequent durchgestylt (Ishkur/Hardware-Ästhetik)
- Drag & Drop zwischen Bank und Sequencer

**Schwächen:**
- Null/undefined-Checks fehlen fast komplett
- Kein Error Handling bei Audio-Decode, AudioContext, DOM-Queries
- Performance: Full DOM Rebuild bei jeder kleinen Änderung
- Variablennamen extrem kurz (SB, RC, PB, PC, NS, NT, RS, RE, DET, TM, HUM...)
- CSS-Klassen kryptisch (.sf, .sf2, .sf3, .tpt, .bg, .bv, .bo...)
- Kein Undo/Redo

---

## Bugs

| # | Severity | Beschreibung | Stelle |
|---|----------|--------------|--------|
| B1 | CRITICAL | `startCrackle()`: Wahrscheinlichkeitslogik invertiert — höherer Crackle-Wert = weniger Clicks | ~Zeile 714-728 |
| B2 | CRITICAL | `reprocessBuf()`: Bitcrusher-Bypass prüft `bits>=16 && rate<=1` — sollte `\|\|` sein statt `&&` | ~Zeile 841-865 |
| B3 | HIGH | `loadF()`: Kein Error Handler auf `decodeAudioData()` — bei fehlerhaftem WAV crasht alles stumm | ~Zeile 741-757 |
| B4 | HIGH | `bindSTE()`: `parseFloat()` kann NaN zurückgeben, wird direkt in SEQ geschrieben — NaN propagiert durch gesamte Audio-Engine | ~Zeile 1075-1083 |
| B5 | HIGH | `triggerBassNote()`: `exponentialRampToValueAtTime()` crasht bei freq ≤ 0, kein Guard | ~Zeile 1504 |
| B6 | MEDIUM | Bass-Sequencer Note-Wraparound: `% 36` vs `Math.min(35, ...)` — inkonsistente Boundary-Logik | ~Zeile 1573-1584 |
| B7 | MEDIUM | Overview-Drag: Keine Validierung dass RS < RE nach Drag — invertierte Region möglich | ~Zeile 1227-1242 |

---

## Performance

| # | Problem | Impact |
|---|---------|--------|
| P1 | `buildSeq()` wird bei jeder Step-Parameteränderung komplett neu gebaut (DOM destroy + create) | Jank bei 32 Steps |
| P2 | `buildBassSeq()` gleiches Problem — 16 Cells komplett neu bei Note-Change | Unnötige DOM-Arbeit |
| P3 | `sched()` macht `querySelectorAll('.ss')` in jedem 20ms-Tick | Repeated DOM queries im Hot Path |
| P4 | `col()` (Drum-Klassifizierung) wird bei jedem `buildBank()`/`buildSeq()` neu berechnet statt gecacht | CPU-Verschwendung |
| P5 | Jeder Step/Bank-Eintrag hat 3-5 eigene Event Listener statt Event Delegation am Parent | Memory + Setup |
| P6 | Canvas-Resize (`cv.width = clientWidth * dpr`) bei jedem Draw erzwingt Layout-Recalc | Layout Thrashing |
| P7 | Bass-Step Visual Feedback via `setTimeout` + `querySelectorAll` statt requestAnimationFrame | Timing-Jitter |

---

## Code Quality

| # | Problem | Empfehlung |
|---|---------|------------|
| Q1 | Globale Variablen: ~30+ lose Globals (AC, MB, SB, RC, PB, PC, NS, NT, SEQ, RS, RE...) | State-Objekt oder Klasse |
| Q2 | Variablennamen unleserlich: `SD()`, `defE()`, `pF()`, `hdl()`, `col()` | Aussagekräftig benennen |
| Q3 | CSS-Klassen kryptisch: `.sf`, `.tpt`, `.bg`, `.bv`, `.bo`, `.sh`, `.sl` | Lesbare BEM-Namen oder zumindest längere Abkürzungen |
| Q4 | Magic Numbers überall: `0.0005`, `0.003`, `0.92`, `0.38`, `0.32`, `40` | Benannte Konstanten |
| Q5 | Keine Separation of Concerns: Audio-Engine, UI, State, Event Handling alles vermischt | Module/Funktionsbereiche trennen |
| Q6 | Kein einziger try/catch im gesamten Code | Mindestens an Boundaries (File Load, AudioContext, DOM) |
| Q7 | `innerHTML = ''` statt `replaceChildren()` | Minor, aber sauberer |

---

## UX

| # | Problem |
|---|---------|
| U1 | Kein Undo/Redo — destruktive Edits (Clear, Delete Step) sind permanent |
| U2 | Kein Feedback bei fehlerhaftem File-Upload (stummer Fehler) |
| U3 | Overview-Drag-Handles (9px Hit Zone) zu klein für Touch |
| U4 | Step Editor bleibt sichtbar nach Escape — inkonsistentes Verhalten |
| U5 | Kein Export (WAV-Bounce, Pattern Save/Load) |
| U6 | Keine Keyboard-Shortcuts dokumentiert (nur Space für Play/Stop) |
| U7 | Sound-Dateien werden per Upload geladen — keine eingebauten Presets/Demos |

---

## Iterations-Tasks

### Iteration 0: Setup ✅
- [x] `amen-break-chopper(1).html` → `index.html` als Arbeitsbasis kopieren
- [x] Meta.json + README aktualisieren
- [x] Soundfiles: Dateinamen normalisiert, Lizenz in meta.json

### Iteration 1: Bugs fixen ✅
- [x] **B1**: Crackle — bei Prüfung korrekt (höherer Wert = mehr Clicks), kein Fix nötig
- [x] **B2**: Bitcrusher-Bypass — bei Prüfung korrekt (`&&` ist richtig: bypass nur wenn BEIDE auf neutral), kein Fix nötig
- [x] **B3**: Error Handler für `decodeAudioData()` + User-Feedback bei Fehler
- [x] **B4**: `parseFloat()` NaN-Guard in `bindSTE()`
- [x] **B5**: Frequenz-Guard in `triggerBassNote()` (clamp > MIN_FREQ)

### Iteration 2: Error Handling + Robustness ✅
- [x] AudioContext — bereits mit webkitAudioContext-Fallback + resume, OK
- [x] `RS < RE` — bereits mit min 0.5%-Abstand gesichert, OK
- [x] Bass Note Boundary — `% 36` (wrap) vs `min(35)` (clamp) ist absichtliches Design, OK
- [x] Buffer-Länge — `applySlice()` hat guards (`rlen < n*4`, `safeLen=max(4,len)`, bounds-check)

### Iteration 3: Performance ✅
- [x] Drum-Farben (`col()`) Cache mit Map, invalidiert bei neuen Slices
- [x] DOM-Selektoren in `sched()` gecacht (`needleEl`, `seq.children` statt `querySelectorAll`)
- [ ] `buildSeq()` / `buildBassSeq()`: Targeted DOM Updates — deferred (zu invasiv für diesen Pass)
- [ ] Event Delegation — deferred
- [ ] Canvas-Resize — deferred

### Iteration 4: Preset-Samples ✅
- [x] 5 Preset-Buttons (Amen Brother, Apache, Amen 138, D&B 172, Think)
- [x] Dateinamen normalisiert
- [x] Lizenz-Attribution in meta.json

### Iteration 5: UX Polish ✅
- [x] Undo/Redo (40-Step History, Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y)
- [x] Keyboard Shortcuts: 1-9 Slice Preview, F Fill, C Clear, R Random, M Mirror
- [x] Touch-Targets: Overview Handles 22px auf Touch-Geräten (statt 9px)
- [x] Step Editor schließt bei Escape (war schon implementiert)
- [x] pushUndo() bei allen destruktiven Ops (fill, clear, mirror, invert, random, drag, delete)

### Iteration 6: Export ✅
- [x] WAV-Bounce via OfflineAudioContext → downloadable WAV
- [x] Pattern Save als JSON-Download
- [x] Pattern Load aus JSON-Datei

### Iteration 7: Code Quality ✅
- [x] Benannte Konstanten (SCHED_LOOKAHEAD, SCHED_INTERVAL, FADE_IN/OUT, BPM_DETECT_*, MIN_FREQ, COMP_*)
- [x] Magic Numbers in Audio-Engine durch Konstanten ersetzt
- [ ] State-Objekt statt 30+ Globals — deferred (zu invasiv)
- [ ] Variablen/CSS-Klassen umbenennen — deferred (zu invasiv)
- [ ] Audio/UI Trennung — deferred (zu invasiv)
