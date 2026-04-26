# day 030 — Out of Africa

315,000 years of how *Homo sapiens* spread across the planet, as a self-playing scrubbable globe. 81 milestones from the earliest fossils to the last Polynesian voyages — fossils, tools, cave art, climate events, admixture events, settlement firsts — each pinned in space and time, each citing its primary source.

This is a **multi-day project**. The work that took the time wasn't the rendering, it was the science: every date encoded as a range, every contested claim flagged, every reference verified to a real DOI / Wikipedia URL / educational video. A glossy map with made-up dates would be the opposite of the point.

## Use it

- **Spacebar** or **▶︎** plays the clock from ~315 ka to ~1280 CE in ~90 s.
- **Drag** the globe to rotate, **scroll** to zoom — the projection morphs from orthographic globe (zoom 1.0–1.4) into Natural Earth flat (zoom 2.4+).
- **Click a dot or a label** to open the panel (plain-language excerpt → details → references).
- **Click a tick** on the playbar to jump to that moment.
- **Show ancestors** (bottom-right) toggles the pre-Homo / Neanderthal / Denisovan backdrop.
- **About** (bottom bar) opens the project video.
- **Feedback** (bottom bar, or per-event in the panel) submits to the owner via `/api/feedback` (Worker → KV + email notification).

Keyboard: `Space` play/pause, `←`/`→` scrub (`Shift` for ±5%), `Home`/`End` jump, `Enter` on a focused scrubber opens the nearest event, `Esc` closes panel/lightbox.

## The data

`assets/events.json` is the source of truth — 81 entries with a strict schema:

```jsonc
{
  "id":             "jebel-irhoud",
  "title":          "Jebel Irhoud, Morocco",
  "category":       "fossil",      // climate | branch | admixture | fossil | tool | art | settlement
  "date_range_kya": [350, 280],    // [older, younger] in thousands of years ago
  "date_label":    "~315 ± 34 ka", // human-readable; UI also derives a calendar form
  "scope":         "site",         // site | regional | global
  "location":      { "lat": 31.85, "lon": -8.87, "region": "africa-north" },
  "summary":       "Adult cranium, juvenile face, mandible…",   // technical summary
  "summary_lay":   "Currently the oldest fossils of our species…", // plain-language excerpt
  "confidence":    "well-established",  // | debated | contested
  "confidence_note": "…",          // shown in panel when contested
  "references": {
    "papers":   [{ "citation": "Hublin et al. (2017), Nature 546", "doi": "10.1038/nature22336", "url": "…" }],
    "critique": [{ "citation": "…", "doi": "…", "url": "…" }],   // when contested
    "wikipedia": "https://…",
    "video":    { "title": "…", "channel": "PBS Eons", "url": "…" }
  },
  "image":     { "url": "assets/images/jebel-irhoud.jpg",
                 "license": "CC BY-SA 4.0", "attribution": "…",
                 "file_page": "https://commons.wikimedia.org/wiki/File:…",
                 "aspect": "landscape" },        // landscape | portrait | square
  "appearance": { "morphology": "…", "adna_pigmentation": null, "reconstruction": null },
  "origin_id":   "omo-kibish-1",   // optional — chains arcs of physical migration
  "route_kind":  "land",           // land | coastal | sea
  "waypoints":   [[34, 30]],       // optional — corridors the great-circle should pass through
  "notes":       ""
}
```

**Origin chains**: when an event has `origin_id`, an animated arc draws from the parent to the event. `waypoints` push the great-circle through realistic corridors (Sinai, Anatolia, Wallacea, Beringia, etc.). `route_kind` styles the arc — solid ochre for overland, dashed teal for sea voyages, dotted ochre for coastal.

**Honesty layer**: `confidence ∈ {debated, contested}` renders the marker with a `?` badge and the arc dashed, and surfaces `confidence_note` as a callout in the panel. Date ranges always render as a bar on the panel's mini-axis, never as a single number.

**Source rigour**: every event has at least one paper with a real DOI/URL or an explicit `todo: true` flag. The panel shows TODO badges for unresolved references — no silent gaps. References were verified against PubMed / Crossref / journal sites (one big surprise: the Florisbad citation in the original draft was the wrong journal entirely).

`assets/clusters.json` defines cultural-cluster hulls (Aurignacian sphere, IUP sphere) — drawn as growing convex hulls instead of arrows so they don't read as "everything came from this one point".

`assets/regions.json` is reference geography (continent / sub-region centroids), not used at runtime — kept for future indexing.

## Architecture

Pure vanilla JS + D3-geo + Canvas 2D. **15 kB gzipped** for `main.js`; D3 + topojson load lazily from jsdelivr CDN.

**Projection** — single morph between `d3.geoOrthographicRaw` (zoom 1.0) and `d3.geoNaturalEarth1Raw` (zoom 2.4+) via a `d3.geoProjectionMutator`. Pre-clip switches from `geoClipCircle(π/2)` to `geoClipAntimeridian` at `α = 0.5`. One render stack for both modes — no Three.js, no second canvas.

**Render order**, every frame `state.needsRender` is true:
1. Sphere (sea) + graticule
2. Land fill
3. Glacial-low-stand land overlays (Sundaland, Sahul connectors, Beringia, Doggerland) — only inside their `era_kya` window
4. Ice sheets (Laurentide, Cordilleran, Fennoscandian, Greenland LGM) with linear fade-in/fade-out at era edges
5. Always-on dashed coastline overlay (alpha boosts during ice so coastlines stay visible *through* the white)
6. Cultural-cluster hulls (Aurignacian, IUP) — convex hull of *currently visible* members, subdivided per edge so the polygon bends with the projection
7. Origin arcs (per-event waypoint-aware great-circle polylines)
8. Markers (front-of-globe), labels (collision-avoided), tick selection
9. Back-of-globe items composited from a separate offscreen canvas with a single `blur + alpha` pass — one GPU blur per frame instead of N

**Marker fade-in / arc draw timing** — both span the event's own `date_range_kya`, so a 25-ka window (e.g. main Out-of-Africa) takes 25 ka of clock-time to draw, while a 50-year voyage (e.g. Aotearoa landfall) is over in 50. Removes the "rocket-launch" feeling of a fixed-window animation.

**Non-linear clock** — piecewise linear breakpoints in `CLOCK_BREAKPOINTS`: deep time compressed (18%), main OOA expanded (32%), late prehistory (25%), Holocene also expanded (25%) so the dense Polynesian story isn't a sprint.

**Label layout** — two-pass. Pass 1 collects (x, y, ev) requests during marker render; pass 2 runs a greedy collision-avoidance with 6 candidate positions per label (E / NE / SE / W / NW / SW). Labels that don't fit are dropped — silence beats pixel-soup. Labels are clickable too (rect hit-test in addition to dot hit-test).

**Back-of-globe rendering** — `BACK_OF_GLOBE_ALPHA = 0` by default; the orthographic-back-projection puts antipodal ghost positions on the disc which read as "wrongly placed events" more than as "behind the globe". The full pipeline (offscreen canvas + blur composite) is in place — flip the constant > 0 to re-enable.

**Marker palette**: dot uses the saturated `CATEGORY_COLORS`; label uses the brightened `LABEL_COLORS` so text reads against land regardless of category color (the rust `#b03f1c` for `art` was unreadable on the brown land).

## Files

```
index.html                  markup + lightbox shell
main.js                     ~1500 lines: projection, render pipeline, panel, lightbox, feedback
styles.css                  sediment palette, EB Garamond + IBM Plex Mono, mobile bottom-sheet
fonts/                      self-hosted woff2 (OFL) — no Google Fonts request at runtime
assets/events.json          81 events (~170 KB raw, ~30 KB gzipped via Cloudflare)
assets/paths.json           macro-corridor paths (currently empty; reserved)
assets/clusters.json        Aurignacian + IUP cluster definitions
assets/regions.json         continent / sub-region centroids
assets/images/*             74 lazy-loaded hero images (Wikimedia Commons, ~11 MB)
thumb.{png,webp}, thumb-sm.webp   index-card thumbnails
DESIGN.md                   concept + UX + scope guardrails
PLAN.md                     phased plan; all phases ✅
RESEARCH.md                 raw research notes that fed events.json
SOURCES.md                  curated reference list (paper/wiki/video per milestone)
IMAGES.md                   per-event Wikimedia image research + license inventory
SESSION-LOG.md              chronological session-by-session decisions
```

## Feedback pipeline

Per-event and global feedback buttons open a lightbox with a small form (type / email / message). On submit, the form POSTs to `/api/feedback`, served by a Cloudflare Worker (`functions/api/feedback.js` at the repo root):

1. Validates payload (whitelist of `type`, length caps).
2. Adds server-side adornments (CF country, IP, ISO timestamp).
3. Writes to KV (`env.FEEDBACK_KV`) under key `feedback:<ts>:<rand>`.
4. `ctx.waitUntil`s a Resend API call → email notification to the project owner with `Reply-To` set to the submitter (when given).

Submissions are also held in `localStorage["ooa_feedback_buffer"]` if the POST fails, so they're not silently lost on bad networks.

## Honest gaps

- **3 paper TODOs** without findable DOIs (Lucy 1978 *Kirtlandia* pre-DOI, Straus & Cave 1957 *QRB* pre-DOI, Sungir 2014 book chapter). Render with a visible TODO badge.
- **4 critique TODOs** (Apidima ×2, Fuyan, Hawaiʻi/Athens) — flagged in `SOURCES.md` "Still open before lock" list. Same TODO badge.
- **42 video TODOs** for art/tool entries the SOURCES.md video pass hasn't covered yet. TODO badge.
- **7 events without a hero image** (Fuyan, Tianyuan, Kostenki-14, La Braña, Madjedbebe, Chiquihuite, Howiesons-Poort) — Wikimedia Commons doesn't carry a credible free file for them. Panel shows no image; lay summary leads.
- **Glacial overlays + ice sheets are cartoon polygons**, not survey-grade reconstructions. The goal is "the user can see when these were walkable / icy", not paleogeographic accuracy.
- **Back-of-globe markers are hidden** by default (`BACK_OF_GLOBE_ALPHA = 0`). Several attempts at a useful ghost rendering (alpha + blur, with and without offscreen-canvas optimisation) didn't pay off visually for the perf cost.

## Credits & licenses

- **Data**: events curated from the literature (peer-reviewed papers + Wikipedia + popular-science video). Per-event citations in `assets/events.json` and `SOURCES.md`. Code license tracks the repo root.
- **Images**: 74 hand-picked Wikimedia Commons files served from `assets/images/`. License mix: CC BY 2.0–4.0, CC BY-SA 2.0–4.0, CC0, Public Domain. Each panel links to the Commons file page (one click → license + author).
- **Land polygons**: Natural Earth (Public Domain), via `world-atlas/land-110m` on jsdelivr CDN.
- **Videos**: thumbnail + click-out → original YouTube uploads (PBS Eons, NOVA, Stefan Milo, SciShow, TED-Ed). Channels listed per event.
- **Fonts**: EB Garamond, IBM Plex Mono — both SIL Open Font License 1.1, self-hosted as woff2 in `fonts/`.
- **Code deps**: D3 v7, TopoJSON-client v3 (both BSD-3) loaded from `cdn.jsdelivr.net`.

## Adding events

1. Author a new entry in `assets/events.json` matching the schema above.
2. Find a free image: see `IMAGES.md` for the search method (Wikipedia REST + Commons API). Download to `assets/images/<id>.<ext>` (cap at 800 px width).
3. Verify references against PubMed/Crossref before locking. Real DOIs only — TODO is allowed; fabrication is not.
4. If the event chains physically from another, set `origin_id` and `route_kind`, plus `waypoints` if the great-circle would cut over the wrong terrain.
5. Test locally (`python3 -m http.server` from this directory).
