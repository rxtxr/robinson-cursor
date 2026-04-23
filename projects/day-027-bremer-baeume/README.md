# Day 027 — Bremer Bäume

74.939 Straßenbäume aus dem Baumkataster des Umweltbetrieb Bremen, gezeichnet als Punktwolke auf Papier. Keine Straßen, keine Beschriftung, keine Basiskarte — nur Bäume. Die Stadt wird durch ihre Bepflanzung lesbar: Weser-Verlauf, Wallanlage, Innenstadt, Außenwohnviertel, die Bremen-Nord-Korridore.

## Datenquelle

Die Daten stammen aus dem öffentlichen ArcGIS-MapServer des Umweltbetrieb Bremen:

```
https://gris2.umweltbetrieb-bremen.de/arcgis/rest/services/
  Baumkataster/WMS_Baumkataster_UBB_offen/MapServer/0
```

Layer 0 enthält alle Straßenbäume mit vermessenem Kronenradius. Abgerufen am 2026-04-23 in 75 paginierten Anfragen à 1000 Features.

Pro Baum übernommen: Gattung, Art, Sorte, deutscher Name, Pflanzjahr (PFLJ), Höhe und Kronenradius.

## Pipeline

Zwei Python-Skripte erzeugen die ausgelieferte `trees.json`:

1. `data/fetch.py` — paged Download des Layers (Parallel, 6 Worker), Ausgabe als `data/trees_raw.geojson` (33 MB).
2. `data/compact.py` — columnar JSON mit geteiltem Species-Index, Koordinaten auf fünf Nachkommastellen gerundet (≈ 1 m), Höhe als Integer, Kronenradius in Dezimetern. Ergebnis: **2,3 MB JSON (0,55 MB gzip)** für 75 000 Punkte.

Das rohe GeoJSON wird nicht committed (s. `.gitignore`); die `trees.json` schon.

## Render

- Einzelnes `<canvas>`, equirectangulare Projektion (bei Bremer Breitengrad um 0,01 % Verzerrung — vernachlässigbar).
- Zwei Passes pro Frame:
  1. alle nicht-gefilterten Bäume in einer einzigen `Path2D`-Sammlung,
  2. gefilterte Gattung darüber, kräftiger Farbton, leicht größerer Radius.
- HiDPI über `devicePixelRatio` (gekappt bei 2,5× für Akku/Speed).
- Kein Tile-Layer, kein Kartenmaterial — die Dichte ist die Landkarte.

## Interaktion

- **Pan** — Finger ziehen (Maus-Drag am Desktop).
- **Zoom** — Pinch-to-Zoom, Mausrad, oder Doppeltipp.
- **Filter** — Chip am unteren Rand tippen. Gattung wird hervorgehoben, der Rest dimmt auf Papier-Grau.
- **Info** — Baum antippen, Info-Karte zeigt deutschen Namen, wissenschaftlichen Binomial, Pflanzjahr, Höhe und Kronendurchmesser.
- **Reset** — Kreis-Symbol oben rechts (erscheint nach Interaktion): fit-all, Filter weg, Auswahl weg.

## Trefferprüfung

Für 74 939 Punkte reicht kein linearer Scan pro Tap. Einfacher Raster-Hash: Zellen 0,002° Kantenlänge (≈ 140 m), pro Zelle Liste der Baumindizes. Tippradius 22 css-px wird in Gradsekunden umgerechnet; das Raster wird in der passenden Anzahl Zellen durchsucht (dynamisch nach aktuellem Zoom).

## Stack

- Vanilla HTML, CSS, JS — eine Datei, ca. 900 Zeilen
- Canvas 2D API, Pointer Events
- Python 3 (nur lokaler Build — `urllib`, `concurrent.futures`)
- Keine Laufzeit-Abhängigkeiten, kein Build-Step

## Lizenz der Daten

Der MapServer ist mit dem Suffix `_offen` versehen und seit Juni 2024 Teil des öffentlichen Bremer Datenangebots. Eine explizit benannte Lizenz (dl-de-zero, CC-BY o.ä.) ist auf der Metadatenseite nicht ausgewiesen; die Daten werden hier als nicht-kommerzielles Visualisierungsexperiment mit klarer Quellen-Attribution verwendet. Bei entgegenstehenden Lizenzhinweisen entfernbar.

## Lokal starten

```sh
# vom Repo-Root
npm run dev
# → http://localhost:4321/embed/day-027-bremer-baeume/
```

Oder standalone per statischem Server aus dem Projektordner:

```sh
python3 -m http.server 8765
```
