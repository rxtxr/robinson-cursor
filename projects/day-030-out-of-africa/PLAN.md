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

## Phase 6 — Ship ✅

- [~] Final read-through of every milestone for tone and accuracy. — lay summaries authored for all 81 events in one go (see SESSION-LOG); systematic per-event re-read deferred. Reader feedback can now flow back via the in-app feedback button → KV + email notification.
- [x] Commit with the standard message format. — two commits on 2026-04-26: `chore: add /api/feedback Worker route + KV binding` (041359b) and `day 030: out-of-africa — Phase 5 polish, UX pass, local images` (a4c06bd).
- [x] Push, watch the Cloudflare Pages build. — pushed to main 2026-04-26; deploy succeeded; first feedback-form roundtrip confirmed end-to-end (KV write + Resend email arrival at mareisen@pm.me).

## Phase 7 — Backlog

Outstanding items as of 2026-04-26. The five highest-impact fixes shipped same day; everything below is the residue. Surfaced in-app via the *Known issues & TODOs* lightbox (linked from changelog + feedback), so readers can see what's wobbly without having to read this file.

The project is otherwise complete and the data layer is frozen. Anything in this phase is opt-in polish, not a blocker.

### Content / data layer

**Critical (would fix if a Phase 7.1 happens):**

- [ ] **`madagascar-settlement.origin_id`** points to `lubang-jeriji-saleh` (40 ka Borneo cave painter). 38.5-ka cultural-ancestry leap, violates the project's own *origin arcs ≠ cultural ancestry* rule. Quick-fix: set `origin_id: null`. Right-fix: introduce a new `austronesian-expansion` chain (Taiwan ~5 ka → SE-Borneo ~2 ka → Madagascar ~1.2 ka).
- [ ] Audit all 27 `origin_id` chains against the rule "origin marker is on screen at arc start *and* the link is physical migration, not cultural inheritance". The `_arcFaintOrigin` flag is already computed; could become a hard filter.
- [ ] **Toba lay-summary** ("may have squeezed our population to a near-bottleneck") rehabilitates a hypothesis the technical summary itself calls "largely rejected". Reword the lay tier to match.
- [ ] **Levallois pin** at Sinai (lat 30, lon 34) contradicts the multi-origin framing the entry's own summary now carries. Either drop the pin or render as a regional hull (analogue to Aurignacian / IUP).
- [ ] **`split-neanderthal-vs-denisovan`** is pinned at Atapuerca (Spain) for a deep-genetics population split. Re-pin to `africa-central` (analogous to the Sapiens split) or render off-map as a tree-only event.

**Discutable / framing:**

- [ ] **Apidima 1** stored as `date_range_kya: [210, 210]` despite the entry being explicitly classified as `contested`. Widen to a real range (e.g. `[220, 170]`) so the panel's mini-axis communicates the uncertainty.
- [ ] **Africa-only origins** all chain off Omo Kibish, suggesting a single-source model the project's own pan-African framing rejects. At minimum, re-point Misliya's origin to Jebel Irhoud / North Africa (Aterian context, Sahara corridor).
- [ ] **Cro-Magnon** date format: `~28 ka ¹⁴C BP` is uncalibrated where every other entry is cal BP. Either calibrate or flag the convention break.

**Gaps (would require new events):**

- [ ] **Al Wusta 1** (Saudi Arabia, Groucutt 2018, ~88 ka) — third direct-dated pre-OOA *H. sapiens* site after Misliya / Skhul; absent.
- [ ] **Tam Pà Ling** (Laos, ~70 ka) — strongest evidence for *H. sapiens* in mainland SE Asia beyond the Daoxian dispute; absent.
- [ ] **Niah Cave "Deep Skull"** (Borneo, ~40 ka) — Sundaland arrival; absent.
- [ ] **Liang Bua / *H. floresiensis*** and **Callao Cave / *H. luzonensis*** — independent late-Pleistocene hominin lineages in Wallacea; absent.
- [ ] **Bantu expansion** (~3 ka, West Africa) — re-shaped sub-Saharan Africa linguistically and genomically; absent. Co-prerequisite for the Madagascar founding population.
- [ ] **Inner-African diversity** is visually four pins (Jebel Irhoud + Florisbad + Omo + Kabwe) on an otherwise empty subcontinent. Add Iwo Eleru, Aduma/Herto, or Pinnacle Point detail to make Scerri 2018's pan-African metapopulation visible.
- [ ] **Solutrean hypothesis** as a `rejected` event would be a pedagogical win (currently a sub-clause of the Solutrean entry).

### How it's drawn

- [ ] **Time-axis tick labels** (`300 ka · 100 ka · 30 ka · 5 ka · 1 ka`) under the scrubber. Without them the piecewise-linear clock's non-linearity is invisible — readers can't ground the scrubber position in a date without reading the clock readout mid-drag.
- [ ] **Double date-range bar** in the panel mini-axis: dark core for "best estimate", lighter halo for outer bound. Distinguishes "we know this within ±5 ka" from "somewhere between 280 and 350 ka".
- [ ] **22 point-date events** (`older==younger`) are real ranges in the source studies. The data under-specifies the uncertainty here. Schema change: keep a separate `date_best_kya` field for headline number.
- [ ] **Marker form-channel** unused — only Color encodes category. Glyph (knochen/spitze/stern/welle) would let CB-safety relax and disambiguate the dense IUP / Aurignacian clusters.
- [ ] **Distortion honesty** in flat-map mode: a Tissot indicator on hover or a small scale-bar would acknowledge the ~30 % distortion the Natural-Earth projection introduces at high latitudes / Polynesia.
- [ ] **Cluster hulls anonymous** — Aurignacian and IUP are unlabelled coloured shapes. Add a single small label at the hull centroid.
- [ ] **Modern coastline + LGM ice sheets**: the coastline is always today's. At 20 ka the entire shore was 120 m lower. README is honest about this; the viz isn't. Either render the ETOPO-120 m line during glacial windows or note the simplification on hover.

### Code & polish

- [ ] **Drag-handle mobile bottom-sheet** (`::before` on `.panel`) suggests a drag-to-dismiss gesture that JS does not implement — affordance lie.
- [ ] **Doppelter Escape-Listener** (`main.js:1186` + `main.js:1673`) — harmless, but `closePanel()` fires when panel isn't open.
- [ ] **`getComputedStyle(document.body)` per label-frame** at `main.js:716` and `main.js:870`. Cache the var lookup once at init.
- [ ] **Toter Back-of-Globe-Composite-Pfad** (`BACK_OF_GLOBE_ALPHA = 0`) — clear/drawImage every frame for nothing. Documented re-enable path; cleanup is style only.
- [ ] **PNG → WebP** for 9 panel images (~5 MB saving). Lazy-loaded so no first-paint impact.
- [ ] **`lightboxLastFocused`** is module-scope while `state.lastFocused` is in the state object — inconsistent focus-tracking pattern.
- [ ] **Ice-sheet polygons hard-coded in `main.js`** while every other dataset lives in `assets/*.json`. Move for consistency.

### Look & feel

- [ ] **Aspect-aware behaviour for `.is-portrait` / `.is-square` shipped 2026-04-26.** Remaining: italic-set artist credit (Daynès, Kennis) in image captions where present; subtle inset shadow / hairline border for portrait crops.
- [ ] **Long-form essay mode** — a vertical-scroll prose view of the same 81 milestones with the globe mini-mapped on the side. Would lift the project from *interactive map* to *long-form internet piece* (Pudding / NYT register). Largest discretionary investment.
- [ ] **About-lightbox text** is currently a single utilitarian sentence ("press play to watch the story unfold"). Real editorial voice — Garamond italics, pull-quote, lead — would set the tone for first-time visitors.
- [ ] **Bottombar polish** — the `← all projects · about · changelog · feedback · known issues` chain is set in 0.7 rem mute mono. Disproportionately leise vs. the rest of the chrome's craft level.

### Reader suggestions

From [u/yourfriendstag](https://www.reddit.com/user/yourfriendstag/):

- [ ] **Event list with click-to-center.** A scrollable list that surfaces each event as the timeline crosses it; clicking a row opens the panel and recenters the globe on that location. Closes the gap between "scrubbing through time" and "knowing what just appeared" — currently a reader has to spot the new dot themselves.
- [ ] **Off-view activity indicator.** Some signal — counter, edge-arrow cluster, or mini-globe inset — for what's happening in parts of the world the camera isn't currently on. Makes the simultaneity of e.g. Sahul + Aurignacian + Late Stone Age East Africa visible.
- [ ] **Paneled multi-geography view.** Split the stage so two or more regions can be watched in parallel, sharing a single timeline. Architecturally significant (separate projection + render targets) but the right move for a comparative deep-time read.
- [ ] **Category filter dropdown.** Scope scrubber + map to a single theme (fossils only, art only, climate only). Category encoding already exists in the data; the cost is mostly UI. Low-cost, high-discoverability win if event count grows.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Scope creep into population-genetics rabbit hole | DESIGN.md scope guardrails. Branching is hinted at, not modeled. |
| Pretending the science is settled when it isn't | Every date is a *range*. Debated milestones marked. No clean point estimates as cosmetic shortcuts. |
| Fabricated citations (LLM hazard) | Every reference verified against a real URL/DOI. `todo: true` is allowed; invented DOIs are not. |
| Mobile performance | 2D map by default; Canvas not SVG for the animated layer; profile early. |
| Falls into "unfinished" purgatory | Phase exits are concrete and inspectable. Each phase ends in something I can show, even if rough. |
