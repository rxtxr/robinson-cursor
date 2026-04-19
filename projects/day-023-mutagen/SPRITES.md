# Mutagen Sprite Generation

Plan to generate monster-part sprites via the local `artworks` Flask server and assemble them as layered visuals in-game.

## Design decisions

- **Format:** 512×512 PNG-RGBA, transparent background, one sprite per (mutation × level).
- **View:** consistent 3/4 front, eye-level, centered on the anchor point for its slot.
- **Style:** bold Ligne-claire outline + flat fills (works with artworks' `tintin-zit` LoRA; consistent across parts is more important than stylistic novelty).
- **Levels:** generate **L1, L3, L5**. The engine scales/opacifies between for L2 and L4 (saves 40% of API cost and keeps visual variety high).
- **Composition:** transparent layers stacked on a neutral "base body" sprite. Draw order (back → front): base body → skin → back → body → head → front.

## Canvas + anchor spec

Each sprite is rendered on a 512×512 transparent canvas. The visible part sits inside a **slot box**. The engine composites layers using these anchors:

| Slot    | Anchor (x,y) | Box size | Notes                                 |
|---------|--------------|----------|---------------------------------------|
| body    | 256, 320     | 280×280  | base torso — covers center-lower      |
| head    | 256, 170     | 220×220  | skull / face parts                    |
| front   | 256, 380     | 300×200  | forelimbs, claws, paws                |
| back    | 256, 220     | 360×240  | wings, spines, extending behind torso |
| skin    | 256, 290     | 320×340  | full-body overlay (hide, plate, stone)|

The sprite fills its box; the rest of the canvas is pure transparent. Even a "skin" sprite leaves head/front/back un-overdrawn.

## Prompt template

```
STYLE: bold black outline, clean ligne-claire linework, flat cel-shaded color fills, limited 5-color palette, no gradients, no rendering details, sharp edges, no texture noise, no background — pure transparent background, isolated subject only, no ground shadow, no scene elements. Game asset sprite sheet aesthetic.

SUBJECT: {part_name} — {level_descriptor}. {anatomy_hint}. {slot_framing}.

COMPOSITION: single sprite, subject fills {box_hint} of a 512×512 square, centered horizontally, anchored at {anchor_hint}. 3/4 front view. Crisp silhouette, readable against any background color.

NEGATIVE: background, environment, shadow, gradient, photorealism, texture, grain, watermark, multiple subjects, extra limbs beyond those described, full body (unless subject is a skin mutation).
```

**Fill variables per mutation:**

| id              | part_name            | anatomy_hint                                             | slot_framing                   | box_hint      | anchor_hint       |
|-----------------|----------------------|----------------------------------------------------------|--------------------------------|---------------|-------------------|
| claws           | curved claws         | two clawed forelimbs, no body attached, just forearms    | lower-center, paws forward     | lower 40%     | y=380 center      |
| horns           | horns                | pair of horns, no head attached, just the horns          | upper-center, symmetric        | upper 35%     | y=170 center      |
| poison_gland    | poison gland sac     | glowing green translucent sac on abdomen area            | center-lower, no body behind   | middle 35%    | y=320 center      |
| fire_sac        | fire sac             | glowing red-orange sac, heat shimmer in outline only     | center-lower, no body behind   | middle 35%    | y=320 center      |
| electric_organ  | electric organ       | cobalt-blue bulbous organ with arc-glyph accents         | center-lower, no body behind   | middle 35%    | y=320 center      |
| leather_hide    | leather hide         | tanned brown leathery skin overlay, creature-shaped      | whole-body silhouette          | 62% of canvas | y=290 center      |
| chitin_plate    | chitin plate armor   | segmented black-green insectoid armor plates             | whole-body silhouette          | 62% of canvas | y=290 center      |
| wings           | leathery wings       | two bat-like wings, no body attached, spread behind      | mid-back, symmetric spread     | upper-back 70%| y=220 center      |
| stone_skin      | stone skin           | cracked grey stone overlay, creature-shaped              | whole-body silhouette          | 62% of canvas | y=290 center      |
| keen_senses     | sensory head crest   | large pointed ears + extra forehead eye, no head behind  | upper-center                   | upper 35%     | y=170 center      |

**Fusions (level 3–5 visually, use same template; unlocked only ≥L3 in-game):**

| id             | part_name              | anatomy_hint                                                          |
|----------------|------------------------|-----------------------------------------------------------------------|
| magma_crust    | magma-cracked stone    | stone overlay with glowing orange lava veins through cracks           |
| venom_claws    | venom-dripping claws   | claws with translucent green venom droplets falling from tips         |
| thunder_strike | lightning-wreathed wings | wings crackling with cobalt electricity arcs along bone edges       |

## Level descriptors

Keep the **shape** recognizable across levels; let size, ornamentation, saturation escalate.

| Level | Descriptor                                                                                 |
|-------|--------------------------------------------------------------------------------------------|
| L1    | "nascent version, small, barely formed, muted color, simple silhouette"                    |
| L3    | "developed version, confident silhouette, saturated color, one layer of secondary detail"  |
| L5    | "apex version, oversized and overgrown, intense saturation, multiple layers of detail, asymmetric flourishes, menacing profile" |

## Base body (generate once)

```
STYLE: {same as above}
SUBJECT: neutral amphibian-reptilian creature base body, small stocky quadruped, blank pale-grey skin, no distinguishing features, no horns, no claws, no wings, no plates, neutral standing pose, empty head (smooth skull), empty forelimbs (simple paws).
COMPOSITION: full body, fills center 62% of 512×512, centered, 3/4 front view.
NEGATIVE: {same as above} + any prominent feature, any colored limb, any visible organ.
```

## Concrete prompt example (claws L3)

```
STYLE: bold black outline, clean ligne-claire linework, flat cel-shaded color fills, limited 5-color palette, no gradients, no rendering details, sharp edges, no texture noise, no background — pure transparent background, isolated subject only, no ground shadow, no scene elements. Game asset sprite sheet aesthetic.

SUBJECT: curved claws — developed version, confident silhouette, saturated color, one layer of secondary detail. Two clawed forelimbs, no body attached, just forearms. Lower-center framing, paws forward.

COMPOSITION: single sprite, subject fills lower 40% of a 512×512 square, centered horizontally, anchored at y=380 center. 3/4 front view. Crisp silhouette, readable against any background color.

NEGATIVE: background, environment, shadow, gradient, photorealism, texture, grain, watermark, multiple subjects, extra limbs beyond those described, full body.
```

## Target batch

- 10 base mutations × 3 levels (L1, L3, L5) = **30**
- 3 fusions × 3 levels = **9**
- 1 base body = **1**
- **Total: 40 sprites**

Each sprite: generate at 1024×1024 for quality, downscale + alpha-matte to 512×512.

## Output folder layout

```
artworks/archive/sprites/
├── base_body.png
├── claws/
│   ├── L1.png
│   ├── L3.png
│   └── L5.png
├── horns/
│   ├── L1.png
│   ├── L3.png
│   └── L5.png
├── ... (one folder per mutation + fusion)
└── _preview.html   # contact-sheet of all generated sprites
```

In-game import: copy `archive/sprites/` into `day-023-mutagen/src/assets/sprites/` when satisfied.

## Server adjustments needed in `artworks/`

Minimal-invasive, additive only:

1. **Chroma-key → alpha post-process.** Generators don't produce alpha natively. Prompt already demands "pure transparent background" — in practice models output a near-uniform color (white/grey). Add a small helper that takes the PNG bytes, thresholds the most-common border color → alpha, and saves RGBA. Trigger by optional `alpha_matte: true` flag on `/api/generate`. ~20 lines, uses Pillow (add to `requirements.txt`).

2. **Standalone batch script `sprite_batch.py`.** Reads a `sprites.json` (the full prompt list above, generated from this doc), calls `/api/generate` once per sprite, saves into `archive/sprites/<id>/L<level>.png`. No new endpoint; just orchestrates the existing one. ~80 lines.

3. **`sprites.json` next to the script.** Machine-readable version of the table above so the script is data-driven.

4. **Contact-sheet HTML.** `archive/sprites/_preview.html` auto-generated by the script, shows a grid of every sprite over a checkerboard background so transparency is visually verifiable.

No changes to `MODELS`, `RESTYLE_PIPELINES`, or the existing endpoints — purely additive.

## Open questions

- **Model choice for first batch:** FLUX.2 Pro (best prompt adherence, non-local) vs `comfyui-tintin-zit` (consistent style via LoRA, local/free but slower). Recommendation: start with `tintin-zit` for style consistency; fall back to FLUX if alpha-matting fails on its output.
- **Hand-off format:** PNG sprites vs tracing them to SVG (`potrace`). PNG is the pragmatic path given timebox. Spec in `CLAUDE.md` says "SVG-Komposition" — we'd deviate, but keep the composition layer (slot anchors, draw order) identical.
