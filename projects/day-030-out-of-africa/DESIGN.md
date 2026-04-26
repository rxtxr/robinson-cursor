# Out of Africa — Design

## One-line concept

A self-playing, pausable, explorable journey through the scientifically-supported picture of how *Homo sapiens* spread across the planet — every stop annotated with the primary literature.

## Why this, why now

The "Out of Africa" story is one of the most-revised areas of science of the last two decades. Genome-scale ancient DNA, new fossil dates, and ancient admixture detection have rewritten the textbook several times since 2010. A visualization that *cites its sources* — and shows the uncertainty bands honestly — is more useful than yet another arrow-on-a-map graphic that pretends the picture is settled.

## Audience

Curious adult readers — the same audience as a long-form science article. No assumed academic background. But the depth is there for readers who want to follow a citation.

## Core experience

1. **Loads → starts playing.** A clock at the top reads "~315,000 years ago." A world map below shows Africa lit up. As the clock advances, dots and arrows appear in the right places.
2. **Pause anytime.** Spacebar or button. The clock freezes; the map state is preserved.
3. **Click a milestone.** A panel slides in with: title, date (with uncertainty range), location, 2–4 paragraph description, references block (paper / Wikipedia / video).
4. **Scrub the timeline.** A scrubber under the clock lets the user jump to any era.
5. **Keep moving.** Press play again, or it resumes after N seconds of inactivity (TBD).

## Visualization shape

### Spatial layer
- **Dual projection that morphs by zoom level.** At world view: `d3.geoOrthographic` — a globe, drag-rotatable; "Out of Africa" reads planetary, Africa is not Mercator-shrunk. Zoomed into a region (Levant, Wallacea, Beringia): `d3.geoNaturalEarth1` or `d3.geoEqualEarth` — labels stay horizontal, distances are honest, sea-level overlays (Sundaland, Sahul, Doggerland, Beringia) sit cleanly. Transition is an eased projection morph along zoom, not a hard mode switch.
- **Single render stack.** D3-geo + Canvas 2D for both projections. No Three.js / WebGL globe — the orthographic globe is a 2D projection of a sphere on canvas, which keeps the JS budget under the < 200 kB target from Phase 5 and avoids a second render path. Natural Earth land polygons (~1 MB GeoJSON) styled in palette; no tile service, no Mapbox token.
- Continents in a muted base style; sea levels at glacial maxima rendered as a togglable overlay (Sahul, Sundaland, Beringia, Doggerland — these matter for the story).
- Migration paths drawn as flowing lines that *appear over time*, not all at once. Same `[lon, lat]` control points yield great-circle arcs on the globe and geodesic curves on the flat projection — D3 handles both.

### Temporal layer
- Timeline at the top, log-ish scale because the interesting density is non-uniform: ~3M years of hominin context compressed, then ~70k years of dispersal expanded, then the last ~5k years (Polynesia, Madagascar) need their own zoom.
- Clock readout in calendar-friendly form ("70,000 years ago", "1280 CE").

### Reference layer
- Detail panel for each milestone. Layout: title → date range → location → description → "References" with three slots: paper / Wikipedia / video. Slots can be empty if no good source exists; better to show "TODO: verify" than fabricate.

## What counts as a "milestone"

A milestone is a single point on the map+time grid. Categories (each will get its own marker glyph and color so the map reads at a glance):

- **`fossil`** — bones. Jebel Irhoud, Omo Kibish, Misliya, Madjedbebe, Tianyuan, Ust'-Ishim, Lucy, Turkana Boy, Sima de los Huesos, Cheddar Man, Mungo Man, ...
- **`branch`** — lineage split (e.g. H. sapiens / Neanderthal / Denisovan ancestor)
- **`admixture`** — gene flow event (Neanderthal introgression ~49–45kya, Denisovan introgression in Sahul/East Asia)
- **`tool`** — lithic / material culture: Oldowan, Acheulean, Levallois, Mousterian, Howiesons Poort, Aurignacian, Gravettian, Solutrean, Magdalenian, Clovis, Lapita, ...
- **`art`** — symbolic behavior: Blombos engravings, Diepkloof eggshells, Hoffmann-2018 Neanderthal cave art, Sulawesi figurative paintings, Löwenmensch, Hohle Fels Venus, Chauvet, Lascaux, Altamira, ...
- **`climate`** — Toba ~74kya, Last Glacial Maximum, Green Sahara periods, Bering land bridge open/close
- **`settlement`** — first arrival in a region (Sahul, Beringia, the Americas, remote Oceania, Madagascar)

Total target: 60–100 milestones. Few enough to curate carefully, many enough to feel rich. The category mix should not be all `fossil` — it's the variety that makes the story breathe.

## Appearance — what these people *looked like*

Every `fossil` milestone (and any `art` or `settlement` milestone tied to a specific individual) gets an **`appearance`** block when we know enough to populate it. Three sources, in order of trust:

1. **Skeletal morphology** — what the bones say directly (cranial form, body proportions, sexual dimorphism). Robust, but doesn't tell you skin or eye color.
2. **Ancient DNA pigmentation alleles** — for Late Pleistocene and Holocene specimens with sequenced genomes. *SLC24A5*, *SLC45A2*, *MC1R*, *HERC2/OCA2*, etc. give probabilistic predictions for skin, hair, eye color. These are predictions, not photographs — note the uncertainty.
3. **Facial reconstructions** — interpretive. Daynès, Gurche, Björklund, Kennis brothers all produce different faces from the same skull. **Always credit the reconstructor and the institution that holds the rights.** Never present a reconstruction as "what this person looked like" — present it as "X's reconstruction of what this person may have looked like."

`appearance` field schema (draft):

```json
"appearance": {
  "morphology": "Long low cranium, modern face, robust brow ridge...",
  "adna_pigmentation": {
    "skin": "dark (high probability)",
    "eyes": "blue (HERC2 derived allele present)",
    "hair": "dark",
    "source_paper_doi": "10.1038/s41559-018-0488-4"
  },
  "reconstruction": {
    "artist": "Élisabeth Daynès",
    "year": 2017,
    "institution": "Natural History Museum London",
    "image_url": "...",
    "credit_required": true
  }
}
```

Not every milestone has all three. Many fossils have only morphology. Most have no ancient DNA. Many famous specimens have no rights-cleared reconstruction image. The data file marks each sub-block as present/absent rather than faking a guess.

### Layer C structural decision (2026-04-25 review)

`RESEARCH.md` Layer C ("Faces, bones, and what they looked like") originally read as a parallel list of ~30 iconic skeletons. Promoting all of them to top-level `events.json` milestones would push the count well over the 80-target and over-weight the `fossil` category. Decision:

- **Top-level milestones**, kept as standalone events: specimens whose point in time/space is *not* already covered by the main migration sections (1–15) — Lucy, Selam, Turkana Boy, Lake Mungo, Cro-Magnon, Sungir, Dolní Věstonice, Ust'-Ishim, Kostenki 14, Goyet Q116-1, Cheddar Man, La Braña 1, Loschbour, Kennewick Man, Naia, plus the Denisovan finds with no main-section counterpart (Denisova 3, Xiahe, Cobra Cave).
- **`appearance` annotation only** on the existing main-section milestone: specimens that duplicate a main-section entry — Jebel Irhoud, Omo Kibish, Florisbad, Sima de los Huesos, Skhul V / Qafzeh 9, Tianyuan Man, Bacho Kiro, Ranis, Zlatý kůň, plus Pestera cu Oase 1.
- This brings the projected `events.json` count down toward the upper end of the 40–80 target instead of overshooting it, while still letting Layer C's "what they looked like" payload appear in the detail panel of the relevant milestone.

Important honesty note: ancient-DNA pigmentation has rewritten the popular image of pre-Neolithic Europeans (dark skin + light eyes was common in the Mesolithic; light skin in Europe is a *recent* sweep, ~5–8 ka). The visualization should show this — not buried in a footnote.

## Honesty about uncertainty

Every date is a *range*, not a number. The visualization must show the range, not just a midpoint. A milestone whose date is debated (e.g. Apidima Cave, Chiquihuite Cave, White Sands footprints) needs a visible "debated" marker, not a silent commitment to one side. **Escape-hatch check:** if I find myself rendering a clean point estimate to make the design look tidier, that's the warning sign — fix the design, don't hide the uncertainty.

### Origin arcs ≠ cultural ancestry (lesson from Phase 3, 2026-04-25)

A migration arrow on a map reads as "people physically moved from A to B." It must not be used for cultural inheritance, genetic ancestry, or industry-successor relationships. A first pass at this project gave 51 events an `origin_id` and produced a striking visual — but with two failure modes:

- **The Aurignacian hub.** Aurignacian is a continent-wide industry ~43–26 ka, not a place. Pinning it at one coord (lat 47°N, lon 5°E) and drawing arrows from there to Cro-Magnon, Hohle Fels, Löwenmensch, Chauvet, Lascaux, Solutréen, Dolní Věstonice etc. read as "all these cultures came from this one spot in central France." Wrong story. Those people were already in those places; they belonged to the same toolkit cluster.
- **Time-skipping arrows.** WHG appearance stars (Cheddar Man, La Braña, Loschbour) at 7–10 ka were given `origin_id = aurignacian` (~28 ka). That's a 20 ka leap across LGM refugia and post-glacial expansion. The arrow flattens a complex history into a single false journey.

Rule from now on: an `origin_id` may be set only when (a) one population physically moved from origin location to event location and (b) the origin marker is at least partially present in time when the arc starts. Cultural / industry relationships need a *different* visual channel — faint cluster lines, hull regions, or pure colour grouping — anything but arrows.

## Scope guardrails (what this is *not*)

- Not a phylogenetic tree app. Branching can be hinted at; full population genetics belongs in a different project.
- Not a paleoclimate simulator. Climate is context, not the subject.
- Not a "race science" target. The story is *one species moving*. Population structure within H. sapiens after dispersal is out of scope.
- Not exhaustive. 40–80 curated milestones, not 400 fossil sites.

## Open design questions

1. **Globe vs. flat map.** Globe is more honest about distances (esp. Beringia, Pacific) but worse on mobile. Decide after a 2D prototype.
2. **Auto-advance speed.** A full play-through at a comfortable reading pace is probably 3–5 minutes. Test.
3. **What to do during the long boring stretches.** Between ~250kya and ~120kya not much happens at the species level. Compress, skip with a "..." beat, or use it for paleoclimate context?
4. **Mobile layout.** Detail panel as bottom sheet. Map gets less real estate. Probably fine.
5. **Citation rendering.** Inline footnote-style, or a per-milestone references block? Probably the latter — fewer interactions, easier to scan.
6. **Source quality bar.** Wikipedia is fine for general orientation, the *primary* slot must be a peer-reviewed paper or a credentialed institutional source. Videos: PBS Eons, Royal Institution, university lectures preferred over speculative pop channels.

## Visual style direction (provisional)

- Quiet, paper-feeling base — not a NASA glow map.
- Type: a humanist serif for body + a geometric sans for the clock/scrubber.
- Color: ochre / clay / charcoal palette, evoking the sediment layers the evidence comes out of. No dark-mode neon.
- Animations: slow, eased, never "snappy." This is deep time.

## Success criteria

- A non-archaeologist friend can sit through the auto-play and come away with a clearer mental model than they had before.
- An archaeologist friend can spot-check 5 random milestones and not find a fabricated citation or a date that's wrong by more than the published uncertainty range.
- It runs smoothly on a mid-range phone.
