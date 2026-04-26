/* scripts/add-origins.mjs
 *
 * One-shot tool: patch data/events.json with `origin_id` fields per the
 * mapping below. Re-run is idempotent (overwrites existing origin_id values).
 *
 * Usage: node scripts/add-origins.mjs
 *
 * The origin chain is the backbone of Phase 3's "wandering" feel: every event
 * with an origin_id will animate an arc from origin coords to itself during
 * a short window before its date_range_kya[0]. See main.js renderPaths().
 */

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "data/events.json";

// origin_id is restricted to events where (a) one population physically moved
// from origin location to event location, and (b) the origin marker is at
// least partially present in time when the arc starts. Cultural-only links
// (Aurignacian → its successors, IUP → Aurignacian), same-region transmission
// (Diepkloof ← Blombos, Sungir ← Kostenki, Skhul ← Misliya), genetic
// ancestry without migration (Kennewick, Clovis, the WHG appearance stars),
// and chronological inversions (Chiquihuite predates Beringia; Sulawesi-Muna
// rock art predates Wallacea arrival in the consensus model) are deliberately
// not encoded as origin arcs — they would read as "people moved from A to B"
// when no such move occurred.
//
// Pan-African co-origins (Jebel Irhoud, Omo Kibish) and contested in-Africa
// successors (Florisbad, Blombos, Pinnacle Point) are also left without
// origin: pan-African origin model treats them as parallel populations, not
// a chain.
const ORIGINS = {
  // Pre-OOA long-distance trial dispersals from East Africa
  "misliya-cave":                 "omo-kibish-1",
  "apidima-1":                    "omo-kibish-1",
  "fuyan-cave-daoxian":           "omo-kibish-1",

  // Main OOA wave — East Africa → Bab-el-Mandeb corridor
  "main-out-of-africa":           "omo-kibish-1",

  // SE Asia / Wallacea — sapiens reaching Wallacea via the coastal route
  "denisovan-admixture":          "southern-coastal-route",
  "lubang-jeriji-saleh":          "southern-coastal-route",

  // Sahul — final water-crossing leg of the southern coastal route
  "madjedbebe-sahul":             "southern-coastal-route",
  "lake-mungo":                   "madjedbebe-sahul",

  // Europe IUP wave — main OOA reaches northern latitudes
  "grotte-mandrin":               "main-out-of-africa",
  "bacho-kiro":                   "main-out-of-africa",
  "pestera-cu-oase-1":            "bacho-kiro",
  "ranis-ilsenhohle":             "main-out-of-africa", // not bacho-kiro: ranis older bound (49 ka) precedes bacho-kiro's date (45 ka)
  "zlaty-kun":                    "main-out-of-africa", // same chronology issue
  "kostenki-14":                  "bacho-kiro",

  // Siberia / East Asia
  "ust-ishim-man":                "main-out-of-africa",
  "tianyuan-man":                 "ust-ishim-man",

  // Beringia → Americas
  "beringian-standstill":         "ust-ishim-man",
  "white-sands-footprints":       "beringian-standstill",
  "monte-verde-ii":               "white-sands-footprints",
  "naia-hoyo-negro":              "white-sands-footprints",

  // Pacific
  "lapita-expansion":             "madjedbebe-sahul",
  "east-polynesia-aotearoa":      "lapita-expansion",

  // Madagascar (Austronesian voyage from Borneo)
  "madagascar-settlement":        "lubang-jeriji-saleh"
};

// ─────────────────────────────────────────────────────────────────────────

const data = JSON.parse(readFileSync(FILE, "utf8"));
const ids = new Set(data.events.map(e => e.id));

// validate — every origin_id must point to an existing event
const broken = [];
for (const [id, origin] of Object.entries(ORIGINS)) {
  if (!ids.has(id))     broken.push(`event id missing: ${id}`);
  if (!ids.has(origin)) broken.push(`origin id missing: ${id} → ${origin}`);
}
if (broken.length) {
  console.error("validation failed:");
  for (const b of broken) console.error("  -", b);
  process.exit(1);
}

// rewrite events with origin_id where applicable
let touched = 0;
data.events = data.events.map(ev => {
  if (ORIGINS[ev.id]) {
    touched++;
    return { ...ev, origin_id: ORIGINS[ev.id] };
  }
  // strip any stale origin_id that no longer applies
  if ("origin_id" in ev) {
    const { origin_id: _, ...rest } = ev;
    return rest;
  }
  return ev;
});

writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
console.log(`patched ${touched} / ${data.events.length} events with origin_id`);
