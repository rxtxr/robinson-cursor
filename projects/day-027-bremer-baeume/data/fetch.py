"""Fetch Bremen Baumkataster layer 0 as paged GeoJSON and write a combined file."""

import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen

BASE = (
    "https://gris2.umweltbetrieb-bremen.de/arcgis/rest/services/"
    "Baumkataster/WMS_Baumkataster_UBB_offen/MapServer/0/query"
)
PAGE = 1000
OUT = Path(__file__).parent / "trees_raw.geojson"


def fetch_page(offset: int) -> list:
    url = (
        f"{BASE}?where=1%3D1&outFields=*&resultOffset={offset}"
        f"&resultRecordCount={PAGE}&returnGeometry=true&f=geojson"
    )
    req = Request(url, headers={"User-Agent": "robinson-cursor-day-027"})
    for attempt in range(4):
        try:
            with urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
                return data.get("features", [])
        except Exception as e:
            if attempt == 3:
                raise
            print(f"  retry offset={offset} after {e}", file=sys.stderr)
            time.sleep(2 ** attempt)
    return []


def count_total() -> int:
    url = f"{BASE}?where=1%3D1&returnCountOnly=true&f=json"
    req = Request(url, headers={"User-Agent": "robinson-cursor-day-027"})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())["count"]


def main():
    total = count_total()
    print(f"total features: {total}")
    offsets = list(range(0, total, PAGE))

    features = [None] * len(offsets)
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(fetch_page, off): i for i, off in enumerate(offsets)}
        done = 0
        for fut in as_completed(futures):
            i = futures[fut]
            features[i] = fut.result()
            done += 1
            print(f"  [{done}/{len(offsets)}] page {i} → {len(features[i])} features")

    flat = [f for page in features for f in page]
    print(f"fetched: {len(flat)}")

    OUT.write_text(
        json.dumps({"type": "FeatureCollection", "features": flat}),
        encoding="utf-8",
    )
    print(f"wrote {OUT} ({OUT.stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
