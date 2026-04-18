# Day 022 — aquafail

First project that failed end-to-end. The shared thread across three
sessions was *procedural watercolor clouds in the browser.* The framing
around that thread varied — only sessions 1 and 2 knew about the
downstream cherry-blossom animation; session 3 was started with a single
reference image and *"can you generate something like this?"* after
sessions 1 and 2 had already failed.

**Status:** fail.

## What was tried

Three attempts across three separate sessions. Attempts 2 and 3 are in the
archive as full grids. Attempt 1 is represented by three selected frames
(`results/shader/`) — the closest-to-goal (`cloud_band`) plus two named
failure modes from the post-mortem (`cauliflower_rim`, `lego_bars`); full
source lives externally as `watercolor.html`.

- **Attempt 1 — WebGL fragment shader (Beer-Lambert layering).** The one
  real physics breakthrough: additive pigment behaviour via
  `pow(color, density)`. Good piece, wrong whole. Oscillation rather than
  accumulation: rim lines → cell membrane, granulation → foxing, hard
  edges → Lego bars, soft edges → Gaussian clouds. Root cause: a fragment
  shader computes per pixel without neighbourhood or time, but watercolor
  features are emergent from fluid dynamics. Reaction-diffusion would
  have been the right class of approach.
- **Attempt 2 — `aqua/`, Three.js fluid sim.** GPU ping-pong diffusion;
  RGBA state buffer with `R = water, G = wet pigment, B = dry pigment`.
  Thirteen parameter sweeps (`shots_v1` … `shots_v13i`), every final
  frame in `results/aqua/`. Core mistake: committed to "single-pass
  procedural watercolor" without first checking whether that can match
  the reference. It can't. Curtis 1997 is a multi-layer fluid pipeline
  running over minutes, not a shader running per pixel.
- **Attempt 3 — `cloud_test/`, image generation.** Different track
  entirely: skip the simulation, generate the cloud as an image via FBM
  then metaballs. Seventeen outputs in `results/cloud_test/`. Three full
  iterations of claiming the approach would work without rendering a
  single image; only started actually comparing when the user said *"just
  render something."* m9–m12 reach cumulus silhouette but read as grapes
  or bubble wrap, not watercolor.

## Meta-analysis

Three independent sessions. Three different AI runs. **Three different
briefs** (different reference material, different scope, different
question shape — session 3 in particular was framed tighter after two
known failures). Same failure shape in all three. The full meta-analysis
is in `index.html`; the headline patterns are:

1. **Capability claim without rendering** — quality promised before any
   output existed.
2. **Method locked in before feasibility checked** — single-pass / per-pixel
   approach committed to, even though the literature (Curtis 1997) says
   the problem needs multi-pass fluid simulation.
3. **Parametric drift instead of method change** — iteration without
   learning; tweaks fix one symptom and introduce another.
4. **No objective progress metric** — no reference-comparison harness,
   ever, in any of the three sessions.
5. **Scope negotiated late, or not at all** — hours spent on hero quality
   for a backdrop role.
6. **Communication drift toward optimism** — every iteration reported as
   "closer," describing technical progress rather than goal progress.

Consistent "what would have worked" across all three: an honest feasibility
framing up front (60–70 % approximation from procedural; full reference
match needs multi-pass pipeline or prerendered asset), plus a
reference-comparison step every iteration, plus a method-change rule after
three unclear iterations.

The uncomfortable observation: session 3 was specifically framed tighter
(*"can you generate something like this?"* with a single reference,
following two known failures). You'd expect a narrowed brief after two
failures to produce either a cleaner "no" or an honest scoping answer.
It produced the same failure shape. Different briefings, different
references, different scopes — same trap. That's a structural bias in
how the system answers *"can you do X?"* for visual-quality goals, not
a briefing artifact. Filing this as `status: fail` is the honest outcome;
its value is diagnostic.

## Gallery

`index.html` is a static gallery of every saved final frame from attempts
2 and 3, followed by the meta-analysis and the three post-mortems in full.
No interaction — just the evidence and the reading.

## Source

Source for the Three.js fluid sim (attempt 2) lives outside this folder at
`~/projects/artworks/aqua/index.html` and is intentionally not published
here. The point is the results.
