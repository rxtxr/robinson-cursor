"""Turn the raw GeoJSON into a compact columnar JSON for web delivery.

Output shape:
{
  "bbox": [minLng, minLat, maxLng, maxLat],
  "meta": {"count": N, "source": "...", "fetched": "YYYY-MM-DD"},
  "species": [
    {"g": "Quercus", "s": "robur", "d": "Stiel-Eiche"},  // id = array index
    ...
  ],
  "lng": [...],   // rounded to 5 decimals (≈ 1 m)
  "lat": [...],
  "sp":  [...],   // species index
  "yr":  [...],   // planting year, or null
  "h":   [...],   // height in meters (int), or null
  "r":   [...]    // crown radius in decimeters (int), or null
}
"""

import datetime
import gzip
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
RAW = HERE / "trees_raw.geojson"
OUT = HERE.parent / "trees.json"

raw = json.loads(RAW.read_text(encoding="utf-8"))
feats = raw["features"]
print(f"raw features: {len(feats)}")


def canon_species(p):
    g = (p.get("Gattung") or "").strip() or None
    s = (p.get("Art") or "").strip() or None
    d = (p.get("DeutscherName") or "").strip() or None
    return (g, s, d)


species_index = {}
species_list = []
for f in feats:
    key = canon_species(f["properties"])
    if key not in species_index:
        species_index[key] = len(species_list)
        species_list.append(key)
print(f"distinct species (gattung+art+de): {len(species_list)}")

genus_counter = Counter(k[0] for k in species_list)
print(f"distinct genera: {len(genus_counter)}")
print("top 10 genera by species variants:")
for g, n in genus_counter.most_common(10):
    print(f"  {g}: {n}")

lng, lat, sp, yr, h, r = [], [], [], [], [], []
min_lng = min_lat = float("inf")
max_lng = max_lat = float("-inf")

for f in feats:
    x, y = f["geometry"]["coordinates"]
    lng.append(round(x, 5))
    lat.append(round(y, 5))
    min_lng = min(min_lng, x)
    min_lat = min(min_lat, y)
    max_lng = max(max_lng, x)
    max_lat = max(max_lat, y)

    p = f["properties"]
    sp.append(species_index[canon_species(p)])

    pflj = p.get("PFLJ")
    yr.append(int(pflj) if isinstance(pflj, int) and pflj > 1700 else None)

    hoehe = p.get("Hoehe")
    h.append(int(round(hoehe)) if isinstance(hoehe, (int, float)) and hoehe >= 0 else None)

    kr = p.get("Kronenradius")
    r.append(int(round(kr * 10)) if isinstance(kr, (int, float)) and kr >= 0 else None)

out = {
    "bbox": [round(min_lng, 5), round(min_lat, 5), round(max_lng, 5), round(max_lat, 5)],
    "meta": {
        "count": len(feats),
        "source": "Umweltbetrieb Bremen — Baumkataster (öffentlicher ArcGIS-Dienst '_offen')",
        "service": (
            "https://gris2.umweltbetrieb-bremen.de/arcgis/rest/services/"
            "Baumkataster/WMS_Baumkataster_UBB_offen/MapServer/0"
        ),
        "fetched": datetime.date.today().isoformat(),
    },
    "species": [{"g": g, "s": s, "d": d} for (g, s, d) in species_list],
    "lng": lng,
    "lat": lat,
    "sp": sp,
    "yr": yr,
    "h": h,
    "r": r,
}

OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
print(f"wrote {OUT} — {OUT.stat().st_size/1e6:.2f} MB uncompressed")

gz = gzip.compress(OUT.read_bytes(), compresslevel=9)
print(f"gzip -9: {len(gz)/1e6:.2f} MB")
