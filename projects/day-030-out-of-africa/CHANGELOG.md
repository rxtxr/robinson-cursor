# Changelog

Content and scientific changes to the dataset (`assets/events.json`, `assets/clusters.json`, source citations). Technical changes to code, styling, or infrastructure are tracked in git history, not here.

Categories follow the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) convention:
- **Added** — new events, references, images
- **Revised** — confidence level changes, reframings, summary rewrites
- **Corrected** — factual fixes (wrong journal, wrong date, wrong DOI)
- **Removed** — entries or references pulled

## 2026-04-26 — post-publication review pass

Four-track review (anthropology / software architecture / scientific visualization / art direction). Top-priority findings implemented; the rest tracked in PLAN.md (Phase 7) and surfaced in-app via the new *Known issues & TODOs* lightbox. Encoding-relevant changes are listed here because they affect how the data reads, even where the change is purely visual.

### Revised
- **Category palette**: switched to Okabe-Ito 8-class color-blind-safe (`fossil` amber, `art` reddish purple, `tool` bluish green, `settlement` yellow, `climate` sky blue, `branch` neutral grey, `admixture` vermillion). Previous all-warm sediment palette had four categories collapsing to indistinguishable orange under deuteranopia/protanopia. Brand-anchor (`fossil ≈ amber`) preserved. Affects markers, scrubber ticks, and labels.

### Added
- **Legend** (bottom-left, collapsible). Lists every category, route kind (land / coastal / sea), confidence stroke (`?` glyph + dashed), and cultural-cluster hull actually present in the loaded data. Generated from the same constants that drive rendering, so it can never drift out of sync.
- **Aspect-aware image frames** in the panel — portraits get 320 px max-height with focal point at 22 % from the top; squares get 280 px and centred crop. Previously every Wikimedia source got a uniform 16:9 landscape crop, lopping off heads on Daynès / Kennis reconstructions.
- **Editorial lead-in** above the lay-language paragraph (28 px ochre rule, ochre lead-cap on the first letter). Panel title bumped one notch (≈ 1.55 → 1.95 rem clamp) for a real editorial-headline moment vs. a slightly-larger body line.

### Earlier on 2026-04-26 — Levallois reframed as debated

#### Revised
- `levallois`: `confidence` changed from `"well-established"` to `"debated"`. The single-origin (African genesis with diffusion) vs multi-origin (independent in-situ development across Africa, Eurasia, and India) question is actively contested in the literature; the previous framing as settled science was wrong. Summary and lay summary rewritten to surface the debate. Trigger: feedback from [u/Paleolithic_US](https://www.reddit.com/user/Paleolithic_US/) on r/Anthropology pointing out that "for Levallois it is a lot more complicated than you have."

#### Added
- `levallois`: White, Ashton & Scott (2011), *Developments in Quaternary Sciences* 14:53–65 added as a second supporting paper for the multi-origin position (DOI 10.1016/B978-0-444-53597-9.00005-4).
- `levallois`: Foley & Lahr (1997), *Cambridge Archaeological Journal* 7(1):3–36 added as a `critique` entry representing the single-origin counter-position (DOI 10.1017/S0959774300001451).
