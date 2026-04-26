# Out of Africa — Project Plan

Multi-day project. The plan is phased; each phase ends in something inspectable.

## Phase 0 — Setup ✅

- [x] Folder created: `projects/day-030-out-of-africa/`
- [x] `meta.json` (status: in-progress)
- [x] `README.md` orienting future-me
- [x] `DESIGN.md` with the concept and open questions
- [x] `PLAN.md` (this file)
- [x] `RESEARCH.md` and `SOURCES.md` seeded by web research

## Phase 1 — Research lock ✅

Goal: a single source of truth for the milestone list, dates, locations, citations.

- [x] Read through `RESEARCH.md`; promote everything verified into a clean **`data/events.json`** (schema below). — 77 events written across all 7 categories.
- [x] For every milestone, fill the three reference slots (paper / Wikipedia / video) or mark `"todo": true`. No fabricated DOIs. — every entry has ≥1 paper and a Wikipedia URL; 8 paper slots and most video slots are explicitly `todo: true` (no invented DOIs).
- [x] Cross-check dates against at least two sources where the literature disagrees (Apidima, Chiquihuite, White Sands, etc.). — done in RESEARCH.md and carried into events.json as a `references.critique` array: Apidima (Harvati 2019 + de Lumley 2020 + Röding/Stringer 2022), White Sands (Bennett 2021 + Pigati 2023), Monte Verde (Dillehay 2015 + Surovell 2025), Madjedbebe (Clarkson 2017 + O'Connell 2018), Fuyan (Liu 2015 + Sun 2021), Iberia Neanderthal cave art (Hoffmann 2018 + White et al. 2020).
- [x] Add `data/regions.json` (continents/sub-regions used to lay out the map). — 25 regions with approximate centroids, 24 of them referenced by at least one event.
- [x] Decide on the milestone count target (current guideline: 40–80). — settled in DESIGN.md §"Layer C structural decision (2026-04-25)": target = upper end of 40–80, with explicit rule for which Layer C specimens become top-level milestones vs. `appearance` annotations on an existing entry. Final count in events.json: 77.
- [x] Exit criteria: `data/events.json` validates against the schema and every entry either has a real reference or is explicitly marked `todo`. — JSON parses; every event has the required schema keys; every reference slot is either a real citation+URL/DOI or explicitly `{ "todo": true, "note": "..." }`.

### `data/events.json` schema (draft)

```json
{
  "id": "jebel-irhoud",
  "title": "Jebel Irhoud, Morocco",
  "category": "fossil",
  "date_range_kya": [350, 280],
  "date_label": "~315,000 years ago",
  "location": { "lat": 31.85, "lon": -8.87, "region": "north-africa" },
  "summary": "Earliest known H. sapiens fossils...",
  "references": {
    "paper": { "citation": "Hublin et al. 2017, Nature 546", "doi": "10.1038/nature22336", "url": "https://doi.org/..." },
    "wikipedia": "https://en.wikipedia.org/wiki/Jebel_Irhoud",
    "video": { "title": "...", "channel": "PBS Eons", "url": "https://www.youtube.com/watch?v=..." }
  },
  "debated": false,
  "notes": ""
}
```

## Phase 2 — Stack pick + walking skeleton ✅

- [x] **Stack decision (locked):** vanilla JS + D3-geo + Canvas 2D + a tiny state machine for play/pause/scrub. **Dual projection: `d3.geoOrthographic` at world zoom, `d3.geoNaturalEarth1` (or `geoEqualEarth`) at regional zoom, eased morph in between** — single render stack, no Three.js, no tile service. Land polygons from Natural Earth (`world-atlas/land-110m.json`).
- [x] Walking skeleton: globe renders, one hardcoded `jebel-irhoud` marker, click opens a static panel populated from `data/events.json`.
- [x] Drag-to-rotate on the globe; wheel/trackpad-zoom; eased morph from globe to Natural Earth between zoom 1.4 and 2.4 (smoothstep), preclip switches from circle to antimeridian past α=0.5. HUD shows projection / zoom / α live.
- [x] Timeline component shell visible (clock readout, disabled play/pause, scrubber track + thumb), no data binding yet.
- [x] Exit criteria met: marker clickable on the globe; zooming morphs the projection cleanly into the flat map; panel opens with title, date range, location, summary, and references (papers / wikipedia / video) drawn straight from the events.json record.

## Phase 3 — Data binding + auto-play (mechanics ✅, narrative still rough)

- [x] Load `data/events.json`. All 77 milestones rendered, hidden until their start date. Color-coded by category (provisional palette).
- [x] Non-linear clock: piecewise-linear breakpoints in `main.js` (`CLOCK_BREAKPOINTS`). Deep time 315→100 ka in first 20%, main dispersal 100→30 ka in next 35%, late prehistory 30→5 ka in next 30%, recent 5→0.67 ka in last 15%. Total play ~90 s.
- [x] Markers fade in across their `date_range_kya` via smoothstep on `yearsAgo`.
- [x] Migration paths animate. Path data is now derived from a strict `origin_id` field on events (23 chains, see `scripts/add-origins.mjs`). `data/paths.json` is empty by default — reserved for Phase 4/5 macro-corridor authoring.
- [x] Pause/resume preserves state. Scrubber drag and keyboard nudges jump cleanly. Spacebar toggles play.
- [x] Exit criteria: full auto-play from ~315 kya to ~1280 CE works end-to-end on desktop (verified by user).

### Phase 3 follow-ups (status as of 2026-04-26)

Diagnosed at end of session 2026-04-25, then carried into Phase 4. Status summary:

- [x] **World pre-populated by deep-time rings** — `branch` events removed from the map; pre-Homo / Neanderthal / Denisovan rings gated behind the *show ancestors* toggle (off by default). Tracked in Phase 4 carry-over below.
- [x] **Madjedbebe ← southern-coastal-route arc draws while origin is invisible** — lighter style (`PATH_COLOR_FAINT`, 0.7× width) when origin opacity at arc-start < 50%. Tracked in Phase 4 carry-over below.
- [x] **No visual distinction between confidence levels in arcs** — dashed stroke for `confidence ∈ {debated, contested}`. Tracked in Phase 4 main list above.
- [~] **Aurignacian hub-and-spoke** — the artefact itself is gone (origin_id rule tightened to physical migration only). Cultural-cluster visual channel still owed → tracked in Phase 4 carry-over below.
- [~] **Polynesia segment feels empty/rushed** — clock-tuning halved the play-rate of the recent segment, fixing the "rushed" half. Inhaltliche Lücke zwischen Lapita (3.3 ka) und Aotearoa (0.7 ka) bleibt — neuer TODO unten.

## Phase 4 — Detail panels, references, narrative tightening ✅

- [x] Panel layout per `DESIGN.md`. — task B4: hierarchy now matches DESIGN spec (title → date → location → confidence → origin → image hero → lay excerpt → details → appearance → video → references). New `apLine` helper for the appearance block.
- [x] Show *uncertainty ranges* for dates (range bar, not a single number). — task B5: a 14 px wide mini-axis under `panel__date`, sharing `yearsAgoToProgress` so uncertainty is comparable across events. Point dates collapse to a 2 px tick.
- [x] "Debated" marker for contested milestones links to a short note. Arcs of contested events render dashed. — arcs dashed for `confidence ∈ {debated, contested}` (4 arcs); panel-side `confidence_note` callout authored for the 7 affected events with the *why* (ESR site-history, bioturbation, geofact-vs-artifact etc.).
- [x] **Visualise active spots and date-ranges directly on the playbar.** — task B3: each non-hidden event gets a 2 px coloured tick at its younger bound + an optional faint range bar between older and younger. Click jumps to that moment + opens the panel. 14×28 px invisible click halo for hit-targets in dense areas.
- [~] All `todo: true` references resolved or explicitly left as "verification needed" with a visible note. — task A2: 5 paper DOIs verified (Florisbad citation **corrected** — was wrong journal); 32 video URLs propagated from `SOURCES.md`'s 2026-04-26 video pass; visible TODO badge in panel for the remaining 3 paper / 4 critique / 42 video todos. **No silent gaps remain** — Phase 4 exit criterion met.

Carried over from Phase 3 (narrative tightening):

- [x] Hide `branch` events from the map. — `HIDDEN_FROM_MAP` set in `main.js` filters them out at marker-list build time.
- [x] Gate deep-context rings behind a "show ancestors" toggle. — toggle in bottom-right wired to `state.showAncestors`; default flipped from off to on after iteration round 2.
- [x] Add a *second* visual channel for cultural-cluster membership. — task C8: `data/clusters.json` defines Aurignacian sphere (5 members) and IUP sphere (5 members); per-frame convex hull (Andrew's monotone chain) drawn as faint translucent polygon with dashed stroke; only includes members currently faded-in, so the cluster grows visibly as its sites pop up.
- [x] **Routes follow land, not great circles.** — task C7 + I3: 27 origin-arcs classified by `route_kind ∈ {land, coastal, sea}` (16 / 5 / 9); 12 with hand-authored waypoints. European routes go Levant → central Anatolia → Bosphorus → Carpathians instead of cutting the Black Sea; Madjedbebe hops Sumatra → Wallacea → Sahul instead of flying the Indian Ocean. Sea = dashed teal, coastal = dotted ochre, land = solid ochre.
- [x] **Fill the Lapita → Aotearoa content gap.** — task A1: 4 new East Polynesia events (Society Is., Marquesas, Hawaiʻi, Rapa Nui) authored from Wilmshurst 2011, with Sear 2020 and Athens 2014 critiques noted. Aotearoa origin re-pointed to Society Islands per the "long pause + pulse" model. Event count 77 → 81.
- [x] When an arc's origin marker is < 50 % opacity at arc-start, render the arc lighter. — pre-computed `_arcFaintOrigin` flag.
- [x] Tune clock breakpoints so the Holocene segment isn't a 13.5 s sprint. — last segment widened from 15 % → 25 %.

- [x] Exit criteria: 100 % of milestones render a real reference triple or display a visible "verification needed" badge; the dispersal narrative reads as continuous wandering (chain visible via origin links + arcs); cultural-vs-geographic relationships visually distinguishable (Aurignacian/IUP hulls vs. directional arcs).

## Phase 4.5 — Polish round ✅

Short visual + content polish triggered by the 2026-04-26 evening review. Ran fully autonomous, single-pass per task, logged to `SESSION-LOG.md`.

- [x] **P1 — Solid + thicker lines.** All 8 arc colour constants converted from `rgba` to full-opacity hex; widths bumped land 1.6→2.8, sea 1.5→2.6, coastal 1.4→2.4 (active state). "Drawn" and "faint origin" states are now solid colour shifts, not alpha. Cluster hulls kept their fill-alpha.
- [x] **P2 — Active labels.** Marker titles render in mono 11 px in the category colour next to active dots, with a 1-px dark backdrop on the 4 cardinal directions for legibility. Iteration 4 added two-pass label layout with greedy collision-avoidance (6 candidate positions per label) plus 6 data-nudges to events that previously shared exact coordinates (Lucy/Selam, Bering-LB/standstill, Oldowan/Acheulean, etc.).
- [x] **P3 — Doppeldatum (ka + classical years).** `alternateDateForm()` + `clockSecondary()` helpers; BP convention with smart rounding (≥100 ka rounds to 1,000; ≥10 ka to 100; ≥2 ka to 50). Applied in panel `panelDate` (e.g. `~315,000 years ago · ~313,000 BCE – 258,000 BCE`), tick tooltips, and clock readout (small mono secondary line under the main value).
- [x] **P4 — Lay-language excerpt for every event.** `summary_lay` field authored on all 81 events; panel renders it as a prominent 1.05 rem display-serif paragraph above a smaller "Details" tier (the technical summary).

### Iteration rounds (fed back from visual review)

- [x] **I4 — Label collision-avoidance + data nudges** (2026-04-26 night).
- [x] **I5 — Ancestors layer default ON** (one-line flip after visual review).
- [x] **P5 — Images + video embeds in panel** (2026-04-26 night). 74 events get a hero image figure with attribution caption (CC + PD mix from Wikimedia Commons); YouTube videos render as a 16:9 thumbnail-with-play-overlay that opens in a new tab (avoids YouTube embed-error 153 from restricted videos).
- [x] **P6 — Replace bad-fit panel images** (2026-04-26 late night). 18 events had wrong-fit images (Ranis showed an industry distribution map; Madagascar showed street food; Marquesas showed the modern flag; Jebel Irhoud showed an archaeologist pointing at sediment; Denisova 3 used the wrong species's holotype). All replaced via targeted Commons full-text search — now showing the actual specimen/site/object.

## Phase 5 — Polish

- [ ] Mobile layout (bottom sheet for the panel).
- [ ] Visual style pass per `DESIGN.md` (palette, typography, eased motion).
- [ ] Optional: glacial-sea-level overlay (Sahul/Sunda/Beringia/Doggerland).
- [ ] Performance: 60fps on a mid-range phone, < 200kB JS gzipped if achievable.
- [ ] Accessibility: keyboard controls (space = play/pause, ←/→ = scrub, enter = open panel).
- [ ] Thumbnails (`thumb.png`, `thumb.webp`, `thumb-sm.webp`) per repo convention.
- [ ] `meta.json` → `status: complete`, real `stack`, real `license_notes`.

## Phase 6 — Ship

- [ ] Final read-through of every milestone for tone and accuracy.
- [ ] Commit with the standard message format.
- [ ] Push, watch the Cloudflare Pages build.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Scope creep into population-genetics rabbit hole | DESIGN.md scope guardrails. Branching is hinted at, not modeled. |
| Pretending the science is settled when it isn't | Every date is a *range*. Debated milestones marked. No clean point estimates as cosmetic shortcuts. |
| Fabricated citations (LLM hazard) | Every reference verified against a real URL/DOI. `todo: true` is allowed; invented DOIs are not. |
| Mobile performance | 2D map by default; Canvas not SVG for the animated layer; profile early. |
| Falls into "unfinished" purgatory | Phase exits are concrete and inspectable. Each phase ends in something I can show, even if rough. |
