# Day 027 — Bremen Trees

74,939 street trees from the public tree cadastre of Umweltbetrieb Bremen, drawn as a point cloud on paper. No streets, no labels, no basemap — only trees. The city reads itself through its planting: the Weser river, the old wall line, downtown, the outer neighbourhoods, the Bremen-Nord corridors. English by default, German selectable.

## Data source

The data comes from the public ArcGIS MapServer operated by Umweltbetrieb Bremen:

```
https://gris2.umweltbetrieb-bremen.de/arcgis/rest/services/
  Baumkataster/WMS_Baumkataster_UBB_offen/MapServer/0
```

Layer 0 holds every street tree with a recorded crown radius. Fetched 2026-04-23 in 75 paged requests of 1000 features each.

Per tree we keep: genus, species, cultivar, German common name, planting year (`PFLJ`), height, and crown radius.

## Pipeline

Two Python scripts produce the shipped `trees.json`:

1. `data/fetch.py` — paged download of the layer (6 parallel workers), output as `data/trees_raw.geojson` (33 MB).
2. `data/compact.py` — columnar JSON with a shared species index, coordinates rounded to five decimals (~1 m), height as integer, crown radius in decimetres. Result: **2.3 MB JSON (0.55 MB gzipped)** for 75 000 points.

The raw GeoJSON is git-ignored (see `.gitignore`); `trees.json` is committed.

## Render

- One `<canvas>`, simple equirectangular projection (at Bremen latitude the distortion is ~0.01% — negligible for this scale).
- Two passes per frame:
  1. non-matching / all trees,
  2. filtered genus on top, slightly larger, in the genus colour.
- `fillRect` per tree instead of `arc()` — ~5× faster at 75k points, and at 0.8–2.5 px radii the square-vs-circle difference is invisible on paper-coloured background. Above 2.6 px the renderer switches to batched arcs for clean round dots.
- `Float32Array` for longitude/latitude, `Int8Array` for the per-tree genus-style index. Typed arrays cut tight-loop indexing cost by ~4× versus plain JS arrays.
- HiDPI via `devicePixelRatio` (capped at 2.5× for battery/perf).
- No tile layer, no basemap — the density *is* the map.

Measured on a laptop in Chromium: the all-trees pass costs ~10 ms on a 390×844 viewport and ~13 ms on 1440×900 — well under the 16.67 ms frame budget.

## Interaction

- **Pan** — one-finger drag (or mouse drag on desktop).
- **Zoom** — pinch, mouse wheel, or double-tap.
- **Filter** — tap a chip in the bottom rail. The selected genus is highlighted in its colour, the rest dim to paper-grey.
- **Tree info** — tap a tree. The info card shows the scientific binomial, the German common name, planting year, height, and crown diameter.
- **Reset** — the corner-brackets button top-right (appears after interaction): fit all, clear filter, clear selection.
- **Language** — EN / DE toggle top-right; choice is persisted in `localStorage`.

## Hit testing

For 74,939 points a linear scan per tap would cost ~1 ms — fine, but wasteful. A grid hash of cell size 0.002° (~140 m) keeps lookups local; the 22 css-px pick radius is converted into degree offsets, and only the matching grid cells are searched (the cell range adapts to the current zoom). If nothing is under the finger during a filter, the search falls through to the unfiltered set so a tap is never a dead end.

## Stack

- Vanilla HTML, CSS, JS — one file, ~1000 lines
- Canvas 2D API, Pointer Events
- Python 3 (build-time only — `urllib`, `concurrent.futures`)
- No runtime dependencies, no build step

## Licence of the data

The MapServer carries the suffix `_offen` ("open") and has been part of the Bremen open-data offering since June 2024. An explicit licence identifier (`dl-de-zero`, `CC-BY`, …) is not stated on the metadata page; the data is used here as a non-commercial visualisation experiment with clear attribution. Removable on request.

## Running locally

```sh
# from repo root
npm run dev
# → http://localhost:4321/embed/day-027-bremer-baeume/
```

Or standalone from the project directory:

```sh
python3 -m http.server 8765
```
