#!/usr/bin/env python3
"""Enrich artists with Wikidata metadata (coordinates, founding year, members, etc.).

Uses wikidata_ids from MusicBrainz enrichment.
Wikidata SPARQL endpoint: 50 req/sec, very fast.
"""

import json
import time
import duckdb
import requests
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "data" / "music.duckdb"
CACHE_DIR = BASE / "data" / "wd_cache"

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
HEADERS = {
    "User-Agent": "robinson-cursor-music-graph/0.1 (https://robinson-cursor.com)",
}

# Properties we want
PROPS = {
    "P31": "instance_of",       # band, person, etc.
    "P136": "genres",           # genre (multiple)
    "P264": "labels",           # record label (multiple)
    "P495": "country_of_origin",
    "P571": "inception",        # founding date
    "P576": "dissolved",        # dissolution date
    "P527": "members",          # has part (members)
    "P740": "formation_location",
    "P18": "image",             # image filename
    "P625": "coordinates",      # coordinate location
    "P1303": "instruments",     # instrument played
    "P569": "birth_date",       # for persons
    "P19": "birth_place",       # for persons
    "P1953": "discogs_id",
    "P3478": "songkick_id",
    "P1902": "spotify_artist_id",
    "P6423": "allmusic_id",
}


def fetch_wikidata_entity(qid):
    """Fetch a Wikidata entity by QID."""
    cache_file = CACHE_DIR / f"{qid}.json"
    if cache_file.exists():
        with open(cache_file) as f:
            return json.load(f)

    resp = requests.get(WIKIDATA_API, params={
        "action": "wbgetentities",
        "ids": qid,
        "format": "json",
        "languages": "en|de",
        "props": "claims|labels|descriptions|sitelinks",
    }, headers=HEADERS, timeout=30)

    resp.raise_for_status()
    data = resp.json()
    entity = data.get("entities", {}).get(qid)

    if entity:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(cache_file, "w") as f:
            json.dump(entity, f, ensure_ascii=False)

    return entity


def get_claim_values(entity, prop_id):
    """Extract values for a property from Wikidata claims."""
    claims = entity.get("claims", {}).get(prop_id, [])
    values = []
    for claim in claims:
        mainsnak = claim.get("mainsnak", {})
        datavalue = mainsnak.get("datavalue", {})
        dtype = datavalue.get("type")

        if dtype == "wikibase-entityid":
            values.append(datavalue["value"]["id"])
        elif dtype == "string":
            values.append(datavalue["value"])
        elif dtype == "time":
            values.append(datavalue["value"]["time"])
        elif dtype == "globecoordinate":
            values.append({
                "lat": datavalue["value"]["latitude"],
                "lon": datavalue["value"]["longitude"],
            })
        elif dtype == "quantity":
            values.append(datavalue["value"]["amount"])

    return values


def get_label(entity, lang="en"):
    """Get entity label in preferred language."""
    labels = entity.get("labels", {})
    for l in [lang, "de", "en"]:
        if l in labels:
            return labels[l]["value"]
    return None


def resolve_entity_labels(qids):
    """Batch-resolve QIDs to labels (up to 50 at a time)."""
    if not qids:
        return {}

    labels = {}
    # Wikidata allows up to 50 entities per request
    for i in range(0, len(qids), 50):
        batch = qids[i:i + 50]
        resp = requests.get(WIKIDATA_API, params={
            "action": "wbgetentities",
            "ids": "|".join(batch),
            "format": "json",
            "languages": "en|de",
            "props": "labels",
        }, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        entities = resp.json().get("entities", {})
        for qid, entity in entities.items():
            labels[qid] = get_label(entity) or qid

    return labels


def process_artist(entity, qid):
    """Extract structured data from a Wikidata entity."""
    result = {"wikidata_id": qid}

    result["label_en"] = get_label(entity, "en")
    result["label_de"] = get_label(entity, "de")

    desc = entity.get("descriptions", {})
    result["description_en"] = desc.get("en", {}).get("value")

    # Genres (as QIDs, resolve later)
    result["genre_qids"] = get_claim_values(entity, "P136")

    # Labels (record labels, as QIDs)
    result["label_qids"] = get_claim_values(entity, "P264")

    # Country of origin
    result["country_qids"] = get_claim_values(entity, "P495")

    # Formation location
    formation_locs = get_claim_values(entity, "P740")
    result["formation_location_qids"] = formation_locs

    # Coordinates (from formation location or direct)
    coords = get_claim_values(entity, "P625")
    result["coordinates"] = coords[0] if coords else None

    # Inception / birth
    inception = get_claim_values(entity, "P571")
    birth = get_claim_values(entity, "P569")
    date = inception[0] if inception else (birth[0] if birth else None)
    result["start_date"] = date

    # Dissolved
    dissolved = get_claim_values(entity, "P576")
    result["end_date"] = dissolved[0] if dissolved else None

    # Members (as QIDs)
    result["member_qids"] = get_claim_values(entity, "P527")

    # Image
    images = get_claim_values(entity, "P18")
    result["image_filename"] = images[0] if images else None

    # Instance of
    result["instance_of_qids"] = get_claim_values(entity, "P31")

    # Spotify artist ID
    spotify_ids = get_claim_values(entity, "P1902")
    result["spotify_artist_id"] = spotify_ids[0] if spotify_ids else None

    return result


def main():
    con = duckdb.connect(str(DB_PATH))

    try:
        rows = con.execute("""
            SELECT artist_mbid, wikidata_id
            FROM artist_mb
            WHERE wikidata_id IS NOT NULL
            ORDER BY artist_mbid
        """).fetchall()
    except Exception as e:
        print(f"Error: {e}")
        print("Run enrich_musicbrainz.py first!")
        return

    print(f"[wikidata] Found {len(rows)} artists with Wikidata IDs")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = sum(1 for _, qid in rows if (CACHE_DIR / f"{qid}.json").exists())
    remaining = len(rows) - cached
    print(f"  Cached: {cached}, Remaining: {remaining}")

    # Phase 1: Fetch all entities
    all_results = []
    all_qids_to_resolve = set()

    for i, (artist_mbid, qid) in enumerate(rows):
        entity = fetch_wikidata_entity(qid)
        if entity is None:
            continue

        result = process_artist(entity, qid)
        result["artist_mbid"] = artist_mbid
        all_results.append(result)

        # Collect QIDs that need label resolution
        for key in ["genre_qids", "label_qids", "country_qids",
                     "formation_location_qids", "member_qids", "instance_of_qids"]:
            all_qids_to_resolve.update(result.get(key, []))

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(rows)}] entities fetched")

    # Phase 2: Resolve all QIDs to labels
    print(f"\n  Resolving {len(all_qids_to_resolve)} entity labels...")
    qid_labels = resolve_entity_labels(list(all_qids_to_resolve))

    # Phase 3: Build final table
    con.execute("DROP TABLE IF EXISTS artist_wikidata")
    con.execute("""
        CREATE TABLE artist_wikidata (
            artist_mbid VARCHAR PRIMARY KEY,
            wikidata_id VARCHAR,
            label_en VARCHAR,
            label_de VARCHAR,
            description_en VARCHAR,
            genres VARCHAR,
            record_labels VARCHAR,
            country VARCHAR,
            formation_location VARCHAR,
            lat DOUBLE,
            lon DOUBLE,
            start_date VARCHAR,
            end_date VARCHAR,
            members VARCHAR,
            image_filename VARCHAR,
            instance_of VARCHAR,
            spotify_artist_id VARCHAR
        )
    """)

    for r in all_results:
        genres = [qid_labels.get(q, q) for q in r.get("genre_qids", [])]
        labels = [qid_labels.get(q, q) for q in r.get("label_qids", [])]
        countries = [qid_labels.get(q, q) for q in r.get("country_qids", [])]
        formation = [qid_labels.get(q, q) for q in r.get("formation_location_qids", [])]
        members = [qid_labels.get(q, q) for q in r.get("member_qids", [])]
        instance_of = [qid_labels.get(q, q) for q in r.get("instance_of_qids", [])]

        coords = r.get("coordinates")
        lat = coords["lat"] if coords else None
        lon = coords["lon"] if coords else None

        con.execute(
            "INSERT INTO artist_wikidata VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (r["artist_mbid"], r["wikidata_id"], r["label_en"], r["label_de"],
             r["description_en"],
             json.dumps(genres) if genres else None,
             json.dumps(labels) if labels else None,
             countries[0] if countries else None,
             formation[0] if formation else None,
             lat, lon,
             r["start_date"], r["end_date"],
             json.dumps(members) if members else None,
             r["image_filename"],
             json.dumps(instance_of) if instance_of else None,
             r["spotify_artist_id"])
        )

    print(f"\n[wikidata] Saved {len(all_results)} enriched artists to artist_wikidata")

    # Summary
    with_coords = sum(1 for r in all_results if r.get("coordinates"))
    with_genres = sum(1 for r in all_results if r.get("genre_qids"))
    with_members = sum(1 for r in all_results if r.get("member_qids"))
    with_image = sum(1 for r in all_results if r.get("image_filename"))
    print(f"  With coordinates: {with_coords}")
    print(f"  With genres: {with_genres}")
    print(f"  With members: {with_members}")
    print(f"  With image: {with_image}")

    con.close()
    print("\nDone! Wikidata enrichment complete.")


if __name__ == "__main__":
    main()
