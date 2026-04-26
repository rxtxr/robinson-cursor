/* day-030 — Out of Africa
 *
 * Phase 3 — data binding + auto-play.
 *   - Loads all 77 events + ~11 migration paths.
 *   - Non-linear clock (piecewise linear): deep time compressed, dispersal era
 *     expanded, late prehistory expanded, recent compressed. ~90s full play.
 *   - Markers fade in across their date range; paths "draw on" across their
 *     start_kya → end_kya window as great-circle arcs.
 *   - Play / pause / scrubber wired. Pause + scrub-jump preserve clock state.
 *   - Dual-projection canvas (geoOrthographic ↔ geoNaturalEarth1) inherited
 *     from Phase 2.
 */

import * as d3        from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson  from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

// ── constants ─────────────────────────────────────────────────────────────

const LAND_URL     = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json";
const EVENTS_URL   = "data/events.json";
const PATHS_URL    = "data/paths.json";
const CLUSTERS_URL = "data/clusters.json";

const START_ROTATION = [10, -8, 0];
const ZOOM_MIN        = 1.0;
const ZOOM_MAX        = 5.0;
const ZOOM_FLAT_START = 1.4;
const ZOOM_FLAT_END   = 2.4;

const HIT_RADIUS_PX  = 22;  // matches the larger marker halo
const DRAG_THRESHOLD = 4;

// Total wall-clock duration of a full play-through.
const PLAY_DURATION_SEC = 90;

// Piecewise-linear clock: progress in [0,1] → yearsAgo. Deep time compressed,
// main dispersal era and late prehistory expanded, recent given enough room
// for the dense Holocene story (Lapita → Madagascar → Aotearoa).
const CLOCK_BREAKPOINTS = [
  { progress: 0.00, yearsAgo: 315000 },   // start: Jebel Irhoud
  { progress: 0.18, yearsAgo: 100000 },   // 18% in deep-time hominin context
  { progress: 0.50, yearsAgo:  30000 },   // 32% in main OOA + Sahul + IUP
  { progress: 0.75, yearsAgo:   5000 },   // 25% in late prehistory + Americas
  { progress: 1.00, yearsAgo:    670 }    // 25% in Holocene → ~1280 CE: Aotearoa
];

// Category palette (provisional — Phase 5 will refine).
const CATEGORY_COLORS = {
  fossil:     "#c98a3b",   // ochre
  art:        "#b03f1c",   // rust
  tool:       "#9d8456",   // olive-tan
  settlement: "#e2a04d",   // bright ochre
  climate:    "#6b8e8a",   // sage-teal
  branch:     "#7e6e9c",   // muted violet
  admixture:  "#c9603b"    // clay-orange
};

// Solid arc palette — no alpha. The "drawn" (post-arrival) and "faint origin"
// states use distinct hex shifts toward the background so visual hierarchy
// reads at full opacity. Picked against the dark bg (#161311); each pair
// sits a clear 2 steps apart in luminance.
const PATH_COLOR            = "#e2a04d";   // active land (bright ochre)
const PATH_COLOR_DRAWN      = "#806139";   // post-arrival land (muted ochre)
const PATH_COLOR_FAINT      = "#9a8a6e";   // active land, origin still ghost (warm grey)
const PATH_COLOR_FAINT_DIM  = "#5e564a";   // post-arrival, faint origin (quiet stone)
const PATH_COLOR_SEA        = "#7fb0a8";   // active sea (mid teal)
const PATH_COLOR_SEA_DRAWN  = "#475c5a";   // post-arrival sea (deep teal)
const PATH_COLOR_COASTAL    = "#d59556";   // active coastal (warm amber)
const PATH_COLOR_COASTAL_DRAWN = "#7a5530"; // post-arrival coastal
const PATH_GREAT_CIRCLE_SEGS = 64;                     // smoothness of arc
const PATH_POINT_LEAD_KYA   = 2;                       // for point-dated events (older===younger), give the arc this much wall-time before the dot pops
const PATH_MIN_DEG      = 0.5;                         // skip zero-length arcs (origin and event share a pin)

// Events that belong to the deep-context backdrop, not the H. sapiens
// dispersal story: pre-Homo, early Homo, Neanderthal-only fossils,
// Denisovan-only fossils. Rendered as small hollow rings without
// fade-in or halo so they stay visually subordinate. Hidden by default;
// an "ancestors" toggle reveals them.
const CONTEXT_IDS = new Set([
  "lucy-al-288-1", "selam-dikika-child",
  "turkana-boy", "dmanisi-skull-5",
  "sima-de-los-huesos", "kabwe-broken-hill",
  "la-chapelle-aux-saints", "shanidar-cave", "altamura-man",
  "denisova-3", "xiahe-mandible", "cobra-cave-tam-ngu-hao"
]);
const CONTEXT_COLOR = "rgba(180, 160, 130, 0.55)";

// Conceptual lineage-split events: not place-pins, never rendered on the
// map. Kept in the data so the panel can still surface them via search /
// timeline banners (Phase 4 follow-up).
const HIDDEN_FROM_MAP = new Set([
  "split-sapiens-vs-neanderthal-denisovan",
  "split-neanderthal-vs-denisovan"
]);

// ── DOM ───────────────────────────────────────────────────────────────────

const canvas      = document.getElementById("map");
const ctx         = canvas.getContext("2d");
const panel       = document.getElementById("panel");
const panelClose  = document.getElementById("panelClose");
const hudProj     = document.getElementById("hudProjection");
const hudZoom     = document.getElementById("hudZoom");
const hudAlpha    = document.getElementById("hudAlpha");
const clockValueEl= document.getElementById("clockValue");
const clockAltEl  = document.getElementById("clockAlt");
const playPauseBtn= document.getElementById("playPause");
const scrubberEl  = document.querySelector(".timeline__scrubber");
const scrubberThumb = document.getElementById("scrubberThumb");
const timelineHint  = document.getElementById("timelineHint");
const ancestorsToggle = document.getElementById("toggleAncestors");
const scrubberTicksEl = document.getElementById("scrubberTicks");

// ── state ─────────────────────────────────────────────────────────────────

const state = {
  width: 0, height: 0,
  dpr:   Math.max(1, window.devicePixelRatio || 1),

  zoom:     1.0,
  alpha:    0.0,
  rotation: [...START_ROTATION],

  land:      null,
  graticule: d3.geoGraticule10(),

  events:        null,           // raw events.json
  paths:         null,           // raw paths.json
  clusters:      null,           // raw clusters.json
  eventsById:    new Map(),
  markers:       [],             // [{ id, lon, lat, ev }]
  screenMarkers: [],             // [{ id, x, y }] — refreshed each frame

  clock: {
    playing:    false,
    progress:   0,                // 0..1
    yearsAgo:   CLOCK_BREAKPOINTS[0].yearsAgo,
    lastTs:     null              // for dt
  },

  selectedId: null,
  showAncestors: true,
  needsRender: true
};

// ── projection ────────────────────────────────────────────────────────────

function interpolateProjection(rawA, rawB) {
  const mutate = d3.geoProjectionMutator(t => (lambda, phi) => {
    const a = rawA(lambda, phi);
    const b = rawB(lambda, phi);
    return [
      a[0] + t * (b[0] - a[0]),
      a[1] + t * (b[1] - a[1])
    ];
  });
  let alpha = 0;
  const projection = mutate(alpha);
  projection.preclip(d3.geoClipCircle(Math.PI / 2));
  projection.alpha = function(_) {
    if (!arguments.length) return alpha;
    alpha = +_;
    mutate(alpha);
    projection.preclip(alpha < 0.5 ? d3.geoClipCircle(Math.PI / 2) : d3.geoClipAntimeridian);
    return projection;
  };
  return projection;
}

const projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoNaturalEarth1Raw);
const path = d3.geoPath(projection, ctx);
const visibilityProj = d3.geoOrthographic();

// ── clock helpers ─────────────────────────────────────────────────────────

function progressToYearsAgo(p) {
  p = clamp(p, 0, 1);
  const bp = CLOCK_BREAKPOINTS;
  for (let i = 1; i < bp.length; i++) {
    if (p <= bp[i].progress) {
      const a = bp[i - 1], b = bp[i];
      const t = (p - a.progress) / (b.progress - a.progress);
      return a.yearsAgo + t * (b.yearsAgo - a.yearsAgo);
    }
  }
  return bp.at(-1).yearsAgo;
}

function yearsAgoToProgress(y) {
  // CLOCK_BREAKPOINTS.yearsAgo is monotonically decreasing.
  const bp = CLOCK_BREAKPOINTS;
  if (y >= bp[0].yearsAgo) return 0;
  if (y <= bp.at(-1).yearsAgo) return 1;
  for (let i = 1; i < bp.length; i++) {
    const a = bp[i - 1], b = bp[i];
    if (y >= b.yearsAgo) {
      const t = (a.yearsAgo - y) / (a.yearsAgo - b.yearsAgo);
      return a.progress + t * (b.progress - a.progress);
    }
  }
  return 1;
}

const fmtComma = d3.format(",.0f");

function formatYearsAgo(y) {
  if (y >= 100000) return `${fmtComma(Math.round(y / 1000) * 1000)} years ago`;
  if (y >=  10000) return `${(y / 1000).toFixed(1)}k years ago`;
  if (y >=   2000) return `${fmtComma(y)} years ago`;
  if (y >=      1) return `${1950 - Math.round(y)} CE`;
  return "present";
}

// ── ka ↔ classical-year (BCE/CE) helpers ──
// BP convention: year_CE = 1950 - year_BP. Deep BCE numbers are coarsened
// so the dual form stays readable (no one writes "312,847 BCE").
function fmtCEYear(ceYear) {
  if (ceYear >= 1)  return `${fmtComma(Math.round(ceYear))} CE`;
  // For deep prehistory the strict "+1" of BCE convention is noise; this
  // is approximate dating, not a calendar app.
  return `${fmtComma(Math.abs(Math.round(ceYear)))} BCE`;
}
function bpToCEYear(bp) { return 1950 - bp; }
function roundCE(yearsBP, ceYear) {
  const step =
    yearsBP >= 100000 ? 1000 :
    yearsBP >=  10000 ?  100 :
    yearsBP >=   2000 ?   50 : 1;
  return Math.round(ceYear / step) * step;
}
// Build the alternate-form date string from a date_range_kya pair.
// If date_label is already calendrical (contains AD/BCE/CE), the alt is
// "X years ago"; otherwise the alt is the rounded BCE/CE form.
// Clock-readout secondary line: opposite-form of what formatYearsAgo prints.
// formatYearsAgo prefers calendar form for < 2,000 ya, so this prefers ka.
function clockSecondary(yearsBP) {
  if (yearsBP < 2000) {
    // primary is calendar; secondary = years ago, exact
    return `${fmtComma(Math.round(yearsBP))} years ago`;
  }
  // primary is ka / years ago; secondary = rounded BCE/CE
  const ce = bpToCEYear(yearsBP);
  return fmtCEYear(roundCE(yearsBP, ce));
}

function alternateDateForm(date_label, olderKa, youngerKa) {
  const olderBP   = olderKa * 1000;
  const youngerBP = youngerKa * 1000;
  const isCalendar = /\b(AD|BCE|CE)\b/.test(date_label || "");
  if (isCalendar) {
    if (olderBP === youngerBP) return `~${fmtComma(Math.round(olderBP))} years ago`;
    return `~${fmtComma(Math.round(olderBP))}–${fmtComma(Math.round(youngerBP))} years ago`;
  }
  const o = fmtCEYear(roundCE(olderBP,   bpToCEYear(olderBP)));
  const y = fmtCEYear(roundCE(youngerBP, bpToCEYear(youngerBP)));
  if (olderBP === youngerBP) return `~${o}`;
  return `~${o} – ${y}`;
}

// ── init ──────────────────────────────────────────────────────────────────

(async function init() {
  resize();
  window.addEventListener("resize", () => { resize(); state.needsRender = true; });

  attachInteractionHandlers();
  panelClose.addEventListener("click", closePanel);
  playPauseBtn.addEventListener("click", togglePlay);
  attachScrubberHandlers();
  ancestorsToggle.addEventListener("change", () => {
    state.showAncestors = ancestorsToggle.checked;
    state.needsRender = true;
  });

  const [landTopo, events, paths, clusters] = await Promise.all([
    fetch(LAND_URL).then(r => r.json()),
    fetch(EVENTS_URL).then(r => r.json()),
    fetch(PATHS_URL).then(r => r.json()),
    fetch(CLUSTERS_URL).then(r => r.json())
  ]);
  state.land     = topojson.feature(landTopo, landTopo.objects.land);
  state.events   = events;
  state.paths    = paths;
  state.clusters = clusters;

  // Index events by id and prepare marker list. Lineage-split branch
  // events are kept in the index but excluded from the map.
  for (const ev of events.events) state.eventsById.set(ev.id, ev);
  state.markers = events.events
    .filter(ev => !HIDDEN_FROM_MAP.has(ev.id))
    .map(ev => ({
      id: ev.id,
      lon: ev.location.lon,
      lat: ev.location.lat,
      ev,
      isContext: CONTEXT_IDS.has(ev.id)
    }));

  // Pre-compute polyline vertex arrays for each event with an origin_id.
  // Path goes: origin → (optional waypoints) → event location, with each
  // segment interpolated as a great-circle. Style flags pre-computed:
  //   - _arcDashed:        confidence ∈ {debated, contested}
  //   - _arcFaintOrigin:   origin marker < 50% opacity when arc starts drawing
  //   - _arcRouteKind:     {land, coastal, sea} → controls colour family
  for (const ev of events.events) {
    if (!ev.origin_id) continue;
    const origin = state.eventsById.get(ev.origin_id);
    if (!origin) continue;
    const dLon = ev.location.lon - origin.location.lon;
    const dLat = ev.location.lat - origin.location.lat;
    if (Math.abs(dLon) < PATH_MIN_DEG && Math.abs(dLat) < PATH_MIN_DEG) continue;

    // Build the chain: origin → waypoints → event.
    const points = [
      [origin.location.lon, origin.location.lat],
      ...((ev.waypoints || []).map(w => [w[0], w[1]])),
      [ev.location.lon, ev.location.lat]
    ];
    // Distribute total segments across each leg proportional to angular distance.
    const legs = [];
    let totalDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const dl = Math.abs(b[0] - a[0]);
      const dp = Math.abs(b[1] - a[1]);
      const len = Math.sqrt(dl * dl + dp * dp);
      legs.push({ a, b, len, interp: d3.geoInterpolate(a, b) });
      totalDist += len;
    }
    const coords = [];
    for (const leg of legs) {
      const segs = Math.max(2, Math.round(PATH_GREAT_CIRCLE_SEGS * (leg.len / Math.max(totalDist, 1e-6))));
      for (let i = 0; i <= segs; i++) {
        const p = leg.interp(i / segs);
        // Avoid duplicating the joint between consecutive legs.
        if (coords.length && i === 0) continue;
        coords.push(p);
      }
    }
    ev._originCoords = coords;
    ev._arcDashed = ev.confidence === "debated" || ev.confidence === "contested";
    // Arc window now matches the marker fade-in — long-duration journeys
    // take long, point dates get a small fixed lead. Pre-compute both bounds
    // and the faint-origin flag at the (new) arc start.
    ev._arcStartY = ev.date_range_kya[0] * 1000;
    ev._arcEndY   = (ev.date_range_kya[0] === ev.date_range_kya[1])
      ? (ev.date_range_kya[0] - PATH_POINT_LEAD_KYA) * 1000
      : ev.date_range_kya[1] * 1000;
    ev._arcFaintOrigin = markerOpacity(origin, ev._arcStartY) < 0.5;
    ev._arcRouteKind = ev.route_kind || "land";
  }

  // Pre-compute macro-corridor paths (data/paths.json) the same way. Empty
  // by default in Phase 3; reserved for Phase 4/5 corridor authoring.
  for (const p of paths.paths) {
    const from = state.eventsById.get(p.from_id);
    const to   = state.eventsById.get(p.to_id);
    if (!from || !to) { p._coords = null; continue; }
    const interp = d3.geoInterpolate(
      [from.location.lon, from.location.lat],
      [to.location.lon,   to.location.lat]
    );
    const coords = [];
    for (let i = 0; i <= PATH_GREAT_CIRCLE_SEGS; i++) {
      coords.push(interp(i / PATH_GREAT_CIRCLE_SEGS));
    }
    p._coords = coords;
  }

  buildScrubberTicks();

  // Enable controls now that data is loaded.
  playPauseBtn.disabled = false;
  timelineHint.textContent = "press play";
  updatePlayButtonIcon();

  state.needsRender = true;
  requestAnimationFrame(tick);
})();

// ── frame loop ────────────────────────────────────────────────────────────

function tick(ts) {
  // Advance the play clock.
  if (state.clock.playing) {
    if (state.clock.lastTs != null) {
      const dt = (ts - state.clock.lastTs) / 1000;
      state.clock.progress += dt / PLAY_DURATION_SEC;
      if (state.clock.progress >= 1) {
        state.clock.progress = 1;
        state.clock.playing = false;
        updatePlayButtonIcon();
      }
    }
    state.clock.lastTs = ts;
    state.needsRender = true;
  } else {
    state.clock.lastTs = null;
  }

  state.clock.yearsAgo = progressToYearsAgo(state.clock.progress);

  if (state.needsRender) {
    render();
    state.needsRender = false;
  }
  updateScrubberThumb();
  clockValueEl.textContent = formatYearsAgo(state.clock.yearsAgo);
  clockAltEl.textContent   = clockSecondary(state.clock.yearsAgo);

  requestAnimationFrame(tick);
}

function resize() {
  const r = canvas.getBoundingClientRect();
  state.width  = r.width;
  state.height = r.height;
  canvas.width  = Math.round(r.width  * state.dpr);
  canvas.height = Math.round(r.height * state.dpr);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function configureProjection() {
  const span = ZOOM_FLAT_END - ZOOM_FLAT_START;
  const t    = clamp((state.zoom - ZOOM_FLAT_START) / span, 0, 1);
  state.alpha = t * t * (3 - 2 * t);

  const baseScale = Math.min(state.width, state.height) * 0.45;
  const scale = baseScale * state.zoom;

  projection
    .scale(scale)
    .translate([state.width / 2, state.height / 2])
    .rotate(state.rotation)
    .alpha(state.alpha);

  visibilityProj
    .scale(scale)
    .translate([state.width / 2, state.height / 2])
    .rotate(state.rotation);
}

// ── rendering ─────────────────────────────────────────────────────────────

function render() {
  configureProjection();
  ctx.clearRect(0, 0, state.width, state.height);

  // sphere disc
  ctx.beginPath();
  path({ type: "Sphere" });
  ctx.fillStyle = "#0e0c0a";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(180, 160, 130, 0.18)";
  ctx.stroke();

  // graticule
  ctx.beginPath();
  path(state.graticule);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgba(180, 160, 130, 0.06)";
  ctx.stroke();

  // land
  if (state.land) {
    ctx.beginPath();
    path(state.land);
    ctx.fillStyle   = "#2a241d";
    ctx.fill();
    ctx.lineWidth   = 0.5;
    ctx.strokeStyle = "rgba(180, 160, 130, 0.18)";
    ctx.stroke();
  }

  // cultural-cluster hulls (under paths and markers)
  if (state.clusters) renderClusters();

  // paths first (under markers)
  if (state.paths) renderPaths();

  // markers
  renderMarkers();

  // hud
  hudProj.textContent  = state.alpha < 0.5 ? "globe" : "flat";
  hudZoom.textContent  = state.zoom.toFixed(2);
  hudAlpha.textContent = state.alpha.toFixed(2);
}

function renderMarkers() {
  state.screenMarkers = [];
  const yearsAgo = state.clock.yearsAgo;
  const labelRequests = [];

  for (const m of state.markers) {
    if (m.isContext) {
      // Context (ancestor) markers are an opt-in backdrop layer. The
      // selected one stays visible regardless so closing/reopening the
      // panel doesn't make the marker vanish under the user.
      if (!state.showAncestors && m.id !== state.selectedId) continue;
      const xy = projection([m.lon, m.lat]);
      if (!xy || !Number.isFinite(xy[0])) continue;
      const onBackOfGlobe =
        state.alpha < 0.5 && visibilityProj([m.lon, m.lat]) == null;
      if (onBackOfGlobe) continue;
      drawContextMarker(xy[0], xy[1], m.id === state.selectedId);
      state.screenMarkers.push({ id: m.id, x: xy[0], y: xy[1] });
      continue;
    }

    const opacity = markerOpacity(m.ev, yearsAgo);
    if (opacity <= 0) continue;

    const xy = projection([m.lon, m.lat]);
    if (!xy || !Number.isFinite(xy[0])) continue;
    const onBackOfGlobe =
      state.alpha < 0.5 && visibilityProj([m.lon, m.lat]) == null;
    if (onBackOfGlobe) continue;

    drawMarker(xy[0], xy[1], m.ev, opacity, m.id === state.selectedId);
    state.screenMarkers.push({ id: m.id, x: xy[0], y: xy[1] });

    // Active label: once a marker is meaningfully visible (≥ 50% opacity)
    // and its event window has begun, queue it for the second-pass label
    // layout. Selected markers always queue.
    const olderY = m.ev.date_range_kya[0] * 1000;
    const active = opacity >= 0.5 && yearsAgo <= olderY;
    const selected = m.id === state.selectedId;
    if (active || selected) {
      labelRequests.push({ x: xy[0], y: xy[1], ev: m.ev, opacity, selected });
    }
  }

  layoutAndDrawLabels(labelRequests);
}

// Greedy collision-avoiding label layout. Selected goes first (always
// wins), then most-recently-activated (highest opacity → smallest distance
// from full-fade-in). Each label tries 6 positions around its dot; the
// first that doesn't overlap any previously-placed label is taken.
// Labels that don't fit anywhere are dropped — better silence than a
// pile of unreadable text.
function layoutAndDrawLabels(reqs) {
  if (!reqs.length) return;
  // Selected first, then by descending opacity (most-recently-active first).
  reqs.sort((a, b) => {
    if (a.selected !== b.selected) return a.selected ? -1 : 1;
    return b.opacity - a.opacity;
  });

  const fontStr = "11px " + getComputedStyle(document.body).getPropertyValue("--font-mono");
  ctx.font = fontStr;

  const placed = [];               // {x,y,w,h} rects already taken
  const dotR   = 5;                // matches the (default) marker dot radius
  const padX   = 4, padY = 2;
  const lineH  = 13;

  // Placement candidates, in order of visual preference. dx is anchor x
  // (left edge of text); dy is text baseline.
  function candidatesFor(req, w) {
    const r = dotR + 2;
    return [
      { dx:  r + 4,        dy:  3      },     // E
      { dx:  r + 4,        dy: -r - 4  },     // NE
      { dx:  r + 4,        dy:  r + 12 },     // SE
      { dx: -w - r - 4,    dy:  3      },     // W
      { dx: -w - r - 4,    dy: -r - 4  },     // NW
      { dx: -w - r - 4,    dy:  r + 12 }      // SW
    ];
  }

  function rectFor(x, y, w) {
    return { x: x - padX, y: y - lineH + 2, w: w + 2 * padX, h: lineH + padY };
  }
  function overlaps(a, b) {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  }

  for (const req of reqs) {
    const text = labelTextFor(req.ev);
    const w = ctx.measureText(text).width;
    let chosen = null;
    for (const c of candidatesFor(req, w)) {
      const ax = req.x + c.dx;
      const ay = req.y + c.dy;
      const r  = rectFor(ax, ay, w);
      // Off-canvas rejection
      if (r.x < 4 || r.x + r.w > state.width - 4) continue;
      if (r.y < 4 || r.y + r.h > state.height - 4) continue;
      if (placed.some(p => overlaps(p, r))) continue;
      chosen = { ax, ay, rect: r };
      break;
    }
    if (!chosen) continue;        // too crowded — drop this label
    placed.push(chosen.rect);
    drawLabelAt(chosen.ax, chosen.ay, text, req.ev, req.opacity);
  }
}

function drawLabelAt(x, y, text, ev, opacity) {
  const color = CATEGORY_COLORS[ev.category] || PATH_COLOR;
  ctx.globalAlpha = opacity;
  // ctx.font already set by layoutAndDrawLabels
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(14,12,10,0.92)";
  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) ctx.fillText(text, x + dx, y + dy);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

function markerOpacity(ev, yearsAgo) {
  // Marker only starts fading in once its origin arc (if any) has finished
  // drawing, i.e. once yearsAgo has crossed the event's older bound.
  const olderY   = ev.date_range_kya[0] * 1000;
  const youngerY = ev.date_range_kya[1] * 1000;
  if (yearsAgo >= olderY)   return 0;
  if (yearsAgo <= youngerY) return 1;
  if (olderY === youngerY)  return 1;
  const t = (olderY - yearsAgo) / (olderY - youngerY);
  return t * t * (3 - 2 * t); // smoothstep
}

function drawMarker(x, y, ev, opacity, selected) {
  const color = CATEGORY_COLORS[ev.category] || "#c98a3b";
  const debated = ev.confidence === "debated" || ev.confidence === "contested";
  const haloR = selected ? 18 : 13;
  const dotR  = selected ? 7  : 5;

  ctx.globalAlpha = opacity * (selected ? 0.55 : 0.28);
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(x, y, dotR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = debated ? 1.4 : 1;
  ctx.strokeStyle = debated ? "#161311" : "#1a1612";
  ctx.setLineDash(debated ? [2, 2] : []);
  ctx.stroke();
  ctx.setLineDash([]);

  if (debated) drawDebateMark(x, y, dotR, color, opacity);
  ctx.globalAlpha = 1;
}

function drawContextMarker(x, y, selected) {
  // Hollow ring, smaller, dim — backdrop layer. Bumped up alongside the
  // main markers so the size hierarchy reads cleanly: H. sapiens dispersal
  // events visually outweigh the ancestor backdrop.
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, selected ? 7 : 4.5, 0, Math.PI * 2);
  ctx.lineWidth   = 1.2;
  ctx.strokeStyle = selected ? "#c98a3b" : CONTEXT_COLOR;
  ctx.stroke();
}

// Extract a YouTube video id from common URL forms; returns null for
// non-YouTube URLs (PBS, NOVA player pages, etc.) so we can leave those
// as plain links instead of trying to embed unsupported players.
function youtubeId(url) {
  if (!url) return null;
  let m = /(?:youtube\.com\/(?:watch\?v=|v\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : null;
}

function labelTextFor(ev) {
  let t = ev.title || ev.id;
  // Strip parenthetical / em-dash subtitles — keep the label tight.
  const cutters = [" — ", " ("];
  for (const c of cutters) {
    const i = t.indexOf(c);
    if (i > 0) t = t.slice(0, i);
  }
  if (t.length > 32) t = t.slice(0, 30).trimEnd() + "…";
  return t;
}

// "(?)" glyph next to debated/contested markers — visual pendant to the
// dashed arc style. Positioned NE of the dot so it doesn't collide with
// the marker ring or the next pin.
function drawDebateMark(x, y, dotR, color, opacity) {
  ctx.globalAlpha = opacity;
  ctx.font = "600 11px " + getComputedStyle(document.body).getPropertyValue("--font-mono");
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  // Subtle dark backdrop so the glyph reads on land polygons too.
  const tx = x + dotR + 3;
  const ty = y - dotR - 1;
  ctx.fillStyle = "rgba(14, 12, 10, 0.85)";
  ctx.fillText("?", tx + 0.5, ty);
  ctx.fillText("?", tx - 0.5, ty);
  ctx.fillStyle = color;
  ctx.fillText("?", tx, ty);
}

// Andrew's monotone-chain convex hull on lon/lat points. Safe for the
// current cluster set (all single-continent); not for antimeridian-spanning.
function convexHull(points) {
  if (points.length < 3) return points.slice();
  const pts = points.slice().sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
  const cross = (O, A, B) => (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

function renderClusters() {
  const yearsAgo = state.clock.yearsAgo;
  for (const c of state.clusters.clusters) {
    // Collect lon/lat of currently-visible (≥10% opacity) members.
    const visible = [];
    for (const id of c.member_ids) {
      const ev = state.eventsById.get(id);
      if (!ev) continue;
      const op = markerOpacity(ev, yearsAgo);
      if (op < 0.1) continue;
      visible.push([ev.location.lon, ev.location.lat]);
    }
    if (visible.length < 2) continue;

    // For 2 visible members, draw a thin connector; for 3+, draw a filled hull.
    if (visible.length === 2) {
      const interp = d3.geoInterpolate(visible[0], visible[1]);
      const coords = [];
      for (let i = 0; i <= 24; i++) coords.push(interp(i / 24));
      ctx.beginPath();
      path({ type: "LineString", coordinates: coords });
      ctx.lineWidth   = 1.0;
      ctx.strokeStyle = c.stroke;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    const hull = convexHull(visible);
    if (hull.length < 3) continue;
    // Subdivide each hull edge so the polygon curves with the projection.
    const ring = [];
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i], b = hull[(i + 1) % hull.length];
      const interp = d3.geoInterpolate(a, b);
      const segs = 16;
      for (let s = 0; s < segs; s++) ring.push(interp(s / segs));
    }
    ring.push(ring[0]);

    ctx.beginPath();
    path({ type: "Polygon", coordinates: [ring] });
    ctx.fillStyle   = c.color;
    ctx.fill();
    ctx.lineWidth   = 1.0;
    ctx.strokeStyle = c.stroke;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function renderPaths() {
  const yearsAgo = state.clock.yearsAgo;

  // Origin-derived arcs (event.origin_id chains). Arc window = event's own
  // date_range_kya (or a small fixed lead for point dates). This means a
  // 25-ka journey takes 25 ka of clock-time and a 100-year voyage takes
  // 100 years — long migrations don't feel like rocket launches.
  for (const m of state.markers) {
    const ev = m.ev;
    if (!ev._originCoords) continue;

    const startY = ev._arcStartY;
    const endY   = ev._arcEndY;

    let drawFraction, dim = false;
    if (yearsAgo >= startY) continue;
    else if (yearsAgo <= endY) { drawFraction = 1; dim = true; }
    else { drawFraction = (startY - yearsAgo) / (startY - endY); }

    drawArc(ev._originCoords, drawFraction, {
      dim,
      dashed:       ev._arcDashed,
      faintOrigin:  ev._arcFaintOrigin,
      routeKind:    ev._arcRouteKind
    });
  }

  // Macro-corridor paths from data/paths.json (currently empty).
  if (state.paths) {
    for (const p of state.paths.paths) {
      if (!p._coords) continue;
      const startY = p.start_kya * 1000;
      const endY   = p.end_kya   * 1000;

      let drawFraction, dim = false;
      if (yearsAgo >= startY) continue;
      else if (yearsAgo <= endY) { drawFraction = 1; dim = true; }
      else { drawFraction = (startY - yearsAgo) / (startY - endY); }

      drawArc(p._coords, drawFraction, { dim });
    }
  }
}

function drawArc(coords, fraction, opts) {
  const segs = Math.max(2, Math.round(coords.length * fraction));
  const sub = coords.slice(0, segs);
  if (sub.length < 2) return;
  const dim         = !!opts.dim;
  const dashed      = !!opts.dashed;
  const faintOrigin = !!opts.faintOrigin;
  const routeKind   = opts.routeKind || "land";

  ctx.beginPath();
  path({ type: "LineString", coordinates: sub });

  // Colour family by route kind. All values are full-opacity — visual
  // weight comes from hex shifts and stroke width, never from alpha.
  let width, color, dashPattern = [];
  if (routeKind === "sea") {
    width = dim ? 1.8 : 2.6;
    color = dim ? PATH_COLOR_SEA_DRAWN : PATH_COLOR_SEA;
    dashPattern = [7, 5];                                  // long dashes evoke wave crests
  } else if (routeKind === "coastal") {
    width = dim ? 1.8 : 2.4;
    color = dim ? PATH_COLOR_COASTAL_DRAWN : PATH_COLOR_COASTAL;
    dashPattern = [3, 4];                                  // short dotted, hugging coast
  } else { // land
    width = dim ? 1.8 : 2.8;
    color = dim ? PATH_COLOR_DRAWN : PATH_COLOR;
  }
  if (faintOrigin) {
    // 0.85× width keeps it visibly thinner without disappearing now that
    // the base width is bigger.
    width *= 0.85;
    color = dim ? PATH_COLOR_FAINT_DIM : PATH_COLOR_FAINT;
  }
  // Confidence override: contested/debated forces the dashed pattern even
  // for land routes (overrides the route's intrinsic pattern).
  if (dashed) dashPattern = [4, 3];

  ctx.lineWidth   = width;
  ctx.strokeStyle = color;
  ctx.lineCap     = "round";
  ctx.setLineDash(dashPattern);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ── interaction ───────────────────────────────────────────────────────────

function attachInteractionHandlers() {
  let drag = null;

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x0: e.clientX, y0: e.clientY, rot: [...state.rotation], moved: false };
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;

    const k = 0.4 / state.zoom;
    state.rotation[0] = drag.rot[0] + dx * k;
    state.rotation[1] = clamp(drag.rot[1] - dy * k, -90, 90);
    state.needsRender = true;
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const wasDrag = drag.moved;
    canvas.releasePointerCapture(e.pointerId);
    canvas.classList.remove("dragging");
    drag = null;

    if (!wasDrag) {
      const rect = canvas.getBoundingClientRect();
      hitTestClick(e.clientX - rect.left, e.clientY - rect.top);
    }
  });

  canvas.addEventListener("pointercancel", () => {
    drag = null;
    canvas.classList.remove("dragging");
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    state.zoom = clamp(state.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    state.needsRender = true;
  }, { passive: false });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
    else if (e.key === " " && !e.target.matches("input,textarea")) {
      e.preventDefault();
      togglePlay();
    }
  });
}

function hitTestClick(x, y) {
  let hit = null;
  let bestDist = HIT_RADIUS_PX * HIT_RADIUS_PX;
  for (const m of state.screenMarkers) {
    const dx = x - m.x, dy = y - m.y;
    const d2 = dx*dx + dy*dy;
    if (d2 < bestDist) { bestDist = d2; hit = m; }
  }
  if (hit) openPanel(hit.id);
  else if (state.selectedId) {
    state.selectedId = null;
    state.needsRender = true;
  }
}

// ── play/pause + scrubber ─────────────────────────────────────────────────

function togglePlay() {
  if (state.clock.progress >= 1) state.clock.progress = 0;  // restart from end
  state.clock.playing = !state.clock.playing;
  state.clock.lastTs = null;
  state.needsRender = true;
  updatePlayButtonIcon();
}

function updatePlayButtonIcon() {
  const svg = playPauseBtn.querySelector("svg");
  if (state.clock.playing) {
    svg.innerHTML =
      '<rect x="6" y="4" width="4" height="16"></rect>' +
      '<rect x="14" y="4" width="4" height="16"></rect>';
    playPauseBtn.setAttribute("aria-label", "Pause");
  } else {
    svg.innerHTML = '<polygon points="6,4 20,12 6,20"></polygon>';
    playPauseBtn.setAttribute("aria-label", "Play");
  }
}

function attachScrubberHandlers() {
  let scrubbing = false;

  function progressFromEvent(e) {
    const rect = scrubberEl.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    return x / rect.width;
  }

  scrubberEl.addEventListener("pointerdown", (e) => {
    scrubberEl.setPointerCapture(e.pointerId);
    scrubbing = true;
    state.clock.playing = false;
    updatePlayButtonIcon();
    state.clock.progress = progressFromEvent(e);
    state.needsRender = true;
  });

  scrubberEl.addEventListener("pointermove", (e) => {
    if (!scrubbing) return;
    state.clock.progress = progressFromEvent(e);
    state.needsRender = true;
  });

  scrubberEl.addEventListener("pointerup", (e) => {
    scrubberEl.releasePointerCapture(e.pointerId);
    scrubbing = false;
  });

  scrubberEl.addEventListener("pointercancel", () => { scrubbing = false; });

  // Keyboard nudges (←/→ = ±1%, shift+arrow = ±5%).
  scrubberEl.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    if (e.key === "ArrowLeft")  { state.clock.progress = clamp(state.clock.progress - step, 0, 1); state.needsRender = true; e.preventDefault(); }
    if (e.key === "ArrowRight") { state.clock.progress = clamp(state.clock.progress + step, 0, 1); state.needsRender = true; e.preventDefault(); }
  });
}

function buildScrubberTicks() {
  scrubberTicksEl.innerHTML = "";
  for (const m of state.markers) {
    const ev = m.ev;
    const olderY   = ev.date_range_kya[0] * 1000;
    const youngerY = ev.date_range_kya[1] * 1000;
    const pYounger = yearsAgoToProgress(youngerY);
    const pOlder   = yearsAgoToProgress(olderY);
    const color    = CATEGORY_COLORS[ev.category] || "#c98a3b";

    // Range bar (only if the range projects to ≥1px on the current scrubber).
    if (pOlder !== pYounger) {
      const range = document.createElement("div");
      range.className = "timeline__range";
      const left  = Math.min(pOlder, pYounger) * 100;
      const width = Math.abs(pOlder - pYounger) * 100;
      range.style.left  = `${left}%`;
      range.style.width = `${width}%`;
      range.style.color = color;
      scrubberTicksEl.appendChild(range);
    }

    // Tick at the younger bound (= moment the marker is fully visible).
    const tick = document.createElement("div");
    tick.className = "timeline__tick" + (m.isContext ? " timeline__tick--context" : "");
    tick.style.left = `${pYounger * 100}%`;
    tick.style.color = color;
    tick.dataset.eventId = ev.id;
    tick.title = `${ev.title} — ${ev.date_label} (${alternateDateForm(ev.date_label, ev.date_range_kya[0], ev.date_range_kya[1])})`;
    // Use `click` (not pointerdown) so the scrubber's drag-to-scrub still
    // works in dense regions — `click` only fires on a stationary tap.
    tick.addEventListener("click", (e) => {
      e.stopPropagation();
      state.clock.playing = false;
      updatePlayButtonIcon();
      state.clock.progress = pYounger;
      state.needsRender = true;
      openPanel(ev.id);
    });
    scrubberTicksEl.appendChild(tick);
  }
}

function refreshTickSelection() {
  for (const t of scrubberTicksEl.querySelectorAll(".timeline__tick")) {
    t.classList.toggle("timeline__tick--selected", t.dataset.eventId === state.selectedId);
  }
}

function updateScrubberThumb() {
  const pct = state.clock.progress * 100;
  scrubberThumb.style.left = `${pct}%`;
  scrubberEl.setAttribute("aria-valuenow", String(Math.round(pct)));
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── panel ─────────────────────────────────────────────────────────────────

function openPanel(id) {
  const ev = state.eventsById.get(id);
  if (!ev) return;

  document.getElementById("panelCategory").textContent = ev.category;
  document.getElementById("panelTitle").textContent    = ev.title;
  document.getElementById("panelDate").textContent =
    `${ev.date_label} · ${alternateDateForm(ev.date_label, ev.date_range_kya[0], ev.date_range_kya[1])}`;

  // Date-range bar: the same project-axis the scrubber uses.
  const drBar = document.getElementById("panelDateRangeBar");
  const olderY   = ev.date_range_kya[0] * 1000;
  const youngerY = ev.date_range_kya[1] * 1000;
  const pOlder   = yearsAgoToProgress(olderY);
  const pYounger = yearsAgoToProgress(youngerY);
  const left  = Math.min(pOlder, pYounger) * 100;
  const width = Math.abs(pOlder - pYounger) * 100;
  drBar.style.left  = `${left}%`;
  drBar.style.width = `${width}%`;
  drBar.classList.toggle("panel__daterange-bar--point", olderY === youngerY);

  document.getElementById("panelLocation").textContent =
    `${ev.location.lat.toFixed(2)}°, ${ev.location.lon.toFixed(2)}° — ${ev.location.region}`;

  // Confidence is shown only when not the unremarkable default — keeps the
  // header clean for the 70 well-established events and lets the eye snap
  // to debated/contested entries. When a confidence_note is present, surface
  // it as a short "why" callout right under the level label.
  const conf = document.getElementById("panelConfidence");
  const note = document.getElementById("panelConfidenceNote");
  if (ev.confidence && ev.confidence !== "well-established") {
    conf.textContent = `confidence: ${ev.confidence}`;
    conf.dataset.level = ev.confidence;
    conf.hidden = false;
    if (ev.confidence_note) {
      note.textContent = ev.confidence_note;
      note.dataset.level = ev.confidence;
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  } else {
    conf.hidden = true;
    note.hidden = true;
  }

  // Origin chain: clickable link to the parent event's panel.
  const originEl = document.getElementById("panelOrigin");
  if (ev.origin_id && state.eventsById.has(ev.origin_id)) {
    const origin = state.eventsById.get(ev.origin_id);
    originEl.innerHTML = "";
    originEl.appendChild(document.createTextNode("↳ from "));
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = origin.title;
    a.addEventListener("click", (e) => { e.preventDefault(); openPanel(origin.id); });
    originEl.appendChild(a);
    originEl.hidden = false;
  } else {
    originEl.hidden = true;
  }

  // Image (Wikimedia / Commons hero) — figure + caption with attribution.
  // Caption links to the Commons file page so license + author are one
  // click away.
  const imgFig = document.getElementById("panelImage");
  const imgEl  = document.getElementById("panelImageEl");
  const imgCap = document.getElementById("panelImageCaption");
  if (ev.image && ev.image.url) {
    imgEl.src = ev.image.url;
    imgEl.alt = ev.title;
    imgCap.innerHTML = "";
    const attrText = `${ev.image.attribution || "Wikimedia Commons"} · ${ev.image.license || "license unknown"}`;
    if (ev.image.file_page) {
      const a = document.createElement("a");
      a.href = ev.image.file_page;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = attrText;
      imgCap.appendChild(a);
    } else {
      imgCap.textContent = attrText;
    }
    imgFig.hidden = false;
  } else {
    imgEl.removeAttribute("src");
    imgFig.hidden = true;
  }

  // Lay excerpt (plain language: WHAT + WHY relevant) renders as a
  // prominent paragraph above the technical summary. When a lay excerpt
  // is present, the technical summary becomes a "Details" tier underneath.
  const layEl = document.getElementById("panelLay");
  layEl.innerHTML = "";
  if (ev.summary_lay && ev.summary_lay.trim()) {
    for (const para of ev.summary_lay.split(/\n{2,}/)) {
      if (!para.trim()) continue;
      const p = document.createElement("p");
      p.textContent = para.trim();
      layEl.appendChild(p);
    }
    layEl.hidden = false;
  } else {
    layEl.hidden = true;
  }

  // Technical summary — same paragraph-break support as before.
  const summaryBody  = document.getElementById("panelSummaryBody");
  const summaryTitle = document.getElementById("panelSummaryTitle");
  summaryBody.innerHTML = "";
  const paras = (ev.summary || "").split(/\n{2,}/);
  for (const para of paras) {
    if (!para.trim()) continue;
    const p = document.createElement("p");
    p.textContent = para.trim();
    summaryBody.appendChild(p);
  }
  // Show the "Details" header only when the lay tier is also present —
  // otherwise the technical summary is the only summary, no need to label.
  summaryTitle.hidden = !(ev.summary_lay && ev.summary_lay.trim());

  // Appearance block — only shown when at least one sub-field is present.
  const apSection = document.getElementById("panelAppearance");
  const apBody    = document.getElementById("panelAppearanceBody");
  apBody.innerHTML = "";
  const ap = ev.appearance;
  if (ap && (ap.morphology || ap.adna_pigmentation || ap.reconstruction)) {
    if (ap.morphology) {
      apBody.appendChild(apLine("morphology", ap.morphology));
    }
    if (ap.adna_pigmentation) {
      const parts = [];
      if (ap.adna_pigmentation.skin)  parts.push(`skin: ${ap.adna_pigmentation.skin}`);
      if (ap.adna_pigmentation.eyes)  parts.push(`eyes: ${ap.adna_pigmentation.eyes}`);
      if (ap.adna_pigmentation.hair)  parts.push(`hair: ${ap.adna_pigmentation.hair}`);
      if (parts.length) apBody.appendChild(apLine("aDNA pigmentation", parts.join(" · ")));
    }
    if (ap.reconstruction && ap.reconstruction.artist) {
      const r = ap.reconstruction;
      let txt = `${r.artist}`;
      if (r.year)        txt += `, ${r.year}`;
      if (r.institution) txt += ` — ${r.institution}`;
      const p = apLine("reconstruction", txt);
      p.querySelector(".ap-label + span")?.classList.add("ap-credit");
      apBody.appendChild(p);
    }
    apSection.hidden = false;
  } else {
    apSection.hidden = true;
  }

  // Video — YouTube URLs become a clickable thumbnail that opens YouTube
  // in a new tab. Avoids YouTube embed-error 153 ("owner disabled
  // embedding") that hits a meaningful share of full-episode uploads
  // (NOVA, BBC, etc.). Always-works, privacy-friendly, no iframe load.
  const videoSection = document.getElementById("panelVideo");
  const videoFrame   = document.getElementById("panelVideoFrame");
  const videoCap     = document.getElementById("panelVideoCaption");
  videoFrame.innerHTML = "";
  let embeddedVideo = false;
  if (ev.references.video && !ev.references.video.todo && ev.references.video.url) {
    const ytId = youtubeId(ev.references.video.url);
    if (ytId) {
      const thumb = document.createElement("a");
      thumb.href = ev.references.video.url;
      thumb.target = "_blank";
      thumb.rel = "noopener noreferrer";
      thumb.className = "panel__video-thumb";
      thumb.style.backgroundImage = `url(https://img.youtube.com/vi/${ytId}/hqdefault.jpg)`;
      thumb.setAttribute("aria-label", `Play "${ev.references.video.title || 'video'}" on YouTube`);
      thumb.innerHTML =
        '<svg class="panel__video-play" viewBox="0 0 64 64" aria-hidden="true">' +
        '<circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.55)"/>' +
        '<polygon points="26,20 46,32 26,44" fill="#e9dfcf"/></svg>';
      videoFrame.appendChild(thumb);
      videoCap.innerHTML = "";
      const a = document.createElement("a");
      a.href = ev.references.video.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `${ev.references.video.title} — ${ev.references.video.channel} ↗`;
      videoCap.appendChild(a);
      videoSection.hidden = false;
      embeddedVideo = true;
    }
  }
  if (!embeddedVideo) videoSection.hidden = true;

  const refsList = document.getElementById("panelRefs");
  refsList.innerHTML = "";
  for (const p of (ev.references.papers || []))    refsList.appendChild(refItem("paper", p));
  for (const c of (ev.references.critique || []))  refsList.appendChild(refItem("critique", c));
  if (ev.references.wikipedia) {
    refsList.appendChild(refItem("wikipedia", { url: ev.references.wikipedia, citation: "Wikipedia" }));
  }
  // Video link in refs only when we couldn't embed it (PBS / non-YouTube)
  // or when it's a TODO. Keeps the references list useful and avoids a
  // duplicate of the embedded YouTube link.
  if (ev.references.video && !embeddedVideo) {
    if (ev.references.video.todo) {
      refsList.appendChild(refItem("video", { todo: true, citation: ev.references.video.note || "video — verification needed" }));
    } else {
      refsList.appendChild(refItem("video", {
        url: ev.references.video.url,
        citation: `${ev.references.video.title} — ${ev.references.video.channel}`
      }));
    }
  }

  panel.setAttribute("aria-hidden", "false");
  state.selectedId = id;
  state.needsRender = true;
  refreshTickSelection();
}

function apLine(label, text) {
  const p = document.createElement("p");
  const lbl = document.createElement("span");
  lbl.className = "ap-label";
  lbl.textContent = label;
  p.appendChild(lbl);
  const sp = document.createElement("span");
  sp.textContent = text;
  p.appendChild(sp);
  return p;
}

function closePanel() {
  panel.setAttribute("aria-hidden", "true");
  // Tear down the YouTube iframe so the audio actually stops when the
  // user closes the panel — setting display:none on a parent isn't enough.
  const vf = document.getElementById("panelVideoFrame");
  if (vf) vf.innerHTML = "";
  state.selectedId = null;
  state.needsRender = true;
  refreshTickSelection();
}

function refItem(kind, ref) {
  const li = document.createElement("li");
  if (ref.todo) {
    li.className = "ref-todo";
    li.textContent = `[${kind}] ${ref.citation}`;
    return li;
  }
  const tag = document.createElement("span");
  tag.style.color = "var(--col-fg-mute)";
  tag.style.marginRight = "0.4rem";
  tag.style.fontFamily = "var(--font-mono)";
  tag.style.fontSize = "0.7rem";
  tag.textContent = `[${kind}]`;
  li.appendChild(tag);

  if (ref.url) {
    const a = document.createElement("a");
    a.href = ref.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = ref.citation || ref.url;
    li.appendChild(a);
  } else {
    li.appendChild(document.createTextNode(ref.citation || ""));
  }
  return li;
}
