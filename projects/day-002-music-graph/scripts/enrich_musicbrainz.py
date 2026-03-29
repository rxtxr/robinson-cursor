#!/usr/bin/env python3
"""Enrich tracks and artists with MusicBrainz metadata (genres, tags, labels, etc.).

Respects MusicBrainz rate limit: 1 request/second.
Saves progress incrementally so it can be resumed.
"""

import json
import time
import duckdb
import requests
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "data" / "music.duckdb"
CACHE_DIR = BASE / "data" / "mb_cache"

MB_BASE = "https://musicbrainz.org/ws/2"
HEADERS = {
    "User-Agent": "robinson-cursor-music-graph/0.1 (https://robinson-cursor.com)",
    "Accept": "application/json",
}

# Rate limiting
RATE_LIMIT = 1.0  # seconds between requests
last_request_time = 0.0


def mb_get(endpoint, params=None):
    """Make a rate-limited request to MusicBrainz API."""
    global last_request_time
    elapsed = time.time() - last_request_time
    if elapsed < RATE_LIMIT:
        time.sleep(RATE_LIMIT - elapsed)

    url = f"{MB_BASE}/{endpoint}"
    if params is None:
        params = {}
    params["fmt"] = "json"

    resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
    last_request_time = time.time()

    if resp.status_code == 503:
        print("  Rate limited, waiting 5s...")
        time.sleep(5)
        return mb_get(endpoint, params)

    if resp.status_code == 404:
        return None

    resp.raise_for_status()
    return resp.json()


def cache_path(entity_type, mbid):
    d = CACHE_DIR / entity_type
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{mbid}.json"


def get_cached(entity_type, mbid):
    p = cache_path(entity_type, mbid)
    if p.exists():
        with open(p) as f:
            return json.load(f)
    return None


def save_cache(entity_type, mbid, data):
    p = cache_path(entity_type, mbid)
    with open(p, "w") as f:
        json.dump(data, f, ensure_ascii=False)


def fetch_recording(mbid):
    """Fetch recording details including artist credits, releases, tags, genres."""
    cached = get_cached("recording", mbid)
    if cached is not None:
        return cached

    data = mb_get(f"recording/{mbid}", {
        "inc": "artist-credits+releases+tags+genres+ratings"
    })
    if data:
        save_cache("recording", mbid, data)
    return data


def fetch_artist(mbid):
    """Fetch artist details including tags, genres, relations, area."""
    cached = get_cached("artist", mbid)
    if cached is not None:
        return cached

    data = mb_get(f"artist/{mbid}", {
        "inc": "tags+genres+ratings+url-rels"
    })
    if data:
        save_cache("artist", mbid, data)
    return data


def fetch_release(mbid):
    """Fetch release details including labels, release group."""
    cached = get_cached("release", mbid)
    if cached is not None:
        return cached

    data = mb_get(f"release/{mbid}", {
        "inc": "labels+release-groups+tags+genres"
    })
    if data:
        save_cache("release", mbid, data)
    return data


def extract_tags(data, key="tags"):
    """Extract tags/genres sorted by vote count."""
    items = data.get(key, [])
    return sorted(
        [{"name": t["name"], "count": t.get("count", 0)} for t in items],
        key=lambda x: -x["count"]
    )


def extract_wikidata_id(data):
    """Extract Wikidata ID from MusicBrainz relations."""
    for rel in data.get("relations", []):
        if rel.get("type") == "wikidata":
            url = rel.get("url", {}).get("resource", "")
            if "/wiki/" in url:
                return url.split("/")[-1]
    return None


def enrich_artists(con):
    """Enrich all artists with MusicBrainz data."""
    rows = con.execute("""
        SELECT artist_mbid FROM artists
        WHERE artist_mbid IS NOT NULL
        ORDER BY artist_mbid
    """).fetchall()

    mbids = [r[0] for r in rows]
    print(f"\n[artists] Enriching {len(mbids)} artists with MusicBrainz data...")

    # Check how many are already cached
    cached = sum(1 for m in mbids if get_cached("artist", m) is not None)
    remaining = len(mbids) - cached
    print(f"  Cached: {cached}, Remaining: {remaining}")
    if remaining > 0:
        est_minutes = remaining * RATE_LIMIT / 60
        print(f"  Estimated time: {est_minutes:.0f} minutes")

    results = []
    for i, mbid in enumerate(mbids):
        data = fetch_artist(mbid)
        if data is None:
            continue

        tags = extract_tags(data, "tags")
        genres = extract_tags(data, "genres")
        wikidata_id = extract_wikidata_id(data)

        area = data.get("area", {})
        begin_area = data.get("begin-area", {})

        results.append({
            "artist_mbid": mbid,
            "sort_name": data.get("sort-name"),
            "type": data.get("type"),  # Person, Group, etc.
            "country": data.get("country"),
            "area_name": area.get("name") if area else None,
            "begin_area_name": begin_area.get("name") if begin_area else None,
            "begin_date": data.get("life-span", {}).get("begin"),
            "end_date": data.get("life-span", {}).get("end"),
            "ended": data.get("life-span", {}).get("ended", False),
            "disambiguation": data.get("disambiguation"),
            "genres": json.dumps([g["name"] for g in genres]) if genres else None,
            "tags": json.dumps([t["name"] for t in tags]) if tags else None,
            "wikidata_id": wikidata_id,
        })

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(mbids)}] artists processed")

    # Write to DB
    con.execute("DROP TABLE IF EXISTS artist_mb")
    con.execute("""
        CREATE TABLE artist_mb (
            artist_mbid VARCHAR PRIMARY KEY,
            sort_name VARCHAR,
            type VARCHAR,
            country VARCHAR,
            area_name VARCHAR,
            begin_area_name VARCHAR,
            begin_date VARCHAR,
            end_date VARCHAR,
            ended BOOLEAN,
            disambiguation VARCHAR,
            genres VARCHAR,
            tags VARCHAR,
            wikidata_id VARCHAR
        )
    """)

    for r in results:
        con.execute(
            "INSERT OR REPLACE INTO artist_mb VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (r["artist_mbid"], r["sort_name"], r["type"], r["country"],
             r["area_name"], r["begin_area_name"], r["begin_date"],
             r["end_date"], r["ended"], r["disambiguation"],
             r["genres"], r["tags"], r["wikidata_id"])
        )

    print(f"[artists] Saved {len(results)} enriched artists to artist_mb")
    with_genres = sum(1 for r in results if r["genres"])
    with_wikidata = sum(1 for r in results if r["wikidata_id"])
    print(f"  With genres: {with_genres}, With Wikidata ID: {with_wikidata}")


def enrich_recordings(con, limit=1000):
    """Enrich top recordings (by play count) with MusicBrainz data."""
    rows = con.execute(f"""
        SELECT recording_mbid FROM tracks
        WHERE recording_mbid IS NOT NULL
        ORDER BY play_count DESC
        LIMIT {limit}
    """).fetchall()

    mbids = [r[0] for r in rows]
    print(f"\n[recordings] Enriching {len(mbids)} recordings with MusicBrainz data...")

    cached = sum(1 for m in mbids if get_cached("recording", m) is not None)
    remaining = len(mbids) - cached
    print(f"  Cached: {cached}, Remaining: {remaining}")
    if remaining > 0:
        est_minutes = remaining * RATE_LIMIT / 60
        print(f"  Estimated time: {est_minutes:.0f} minutes")

    results = []
    for i, mbid in enumerate(mbids):
        data = fetch_recording(mbid)
        if data is None:
            continue

        tags = extract_tags(data, "tags")
        genres = extract_tags(data, "genres")

        # Get first release date from releases
        first_release_date = None
        releases = data.get("releases", [])
        dates = [r.get("date") for r in releases if r.get("date")]
        if dates:
            first_release_date = min(dates)

        results.append({
            "recording_mbid": mbid,
            "title": data.get("title"),
            "length_ms": data.get("length"),
            "first_release_date": first_release_date,
            "genres": json.dumps([g["name"] for g in genres]) if genres else None,
            "tags": json.dumps([t["name"] for t in tags]) if tags else None,
        })

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(mbids)}] recordings processed")

    con.execute("DROP TABLE IF EXISTS recording_mb")
    con.execute("""
        CREATE TABLE recording_mb (
            recording_mbid VARCHAR PRIMARY KEY,
            title VARCHAR,
            length_ms BIGINT,
            first_release_date VARCHAR,
            genres VARCHAR,
            tags VARCHAR
        )
    """)

    for r in results:
        con.execute(
            "INSERT OR REPLACE INTO recording_mb VALUES (?,?,?,?,?,?)",
            (r["recording_mbid"], r["title"], r["length_ms"],
             r["first_release_date"], r["genres"], r["tags"])
        )

    print(f"[recordings] Saved {len(results)} enriched recordings to recording_mb")


def enrich_releases(con, limit=1000):
    """Enrich top releases with label info."""
    rows = con.execute(f"""
        SELECT r.release_mbid FROM releases r
        JOIN (
            SELECT release_mbid, SUM(play_count) as total_plays
            FROM tracks WHERE release_mbid IS NOT NULL
            GROUP BY release_mbid
            ORDER BY total_plays DESC
            LIMIT {limit}
        ) t ON r.release_mbid = t.release_mbid
        ORDER BY t.total_plays DESC
    """).fetchall()

    mbids = [r[0] for r in rows]
    print(f"\n[releases] Enriching {len(mbids)} releases with MusicBrainz data...")

    cached = sum(1 for m in mbids if get_cached("release", m) is not None)
    remaining = len(mbids) - cached
    print(f"  Cached: {cached}, Remaining: {remaining}")
    if remaining > 0:
        est_minutes = remaining * RATE_LIMIT / 60
        print(f"  Estimated time: {est_minutes:.0f} minutes")

    results = []
    for i, mbid in enumerate(mbids):
        data = fetch_release(mbid)
        if data is None:
            continue

        # Labels
        label_info = data.get("label-info", [])
        labels = [li["label"]["name"] for li in label_info
                  if li.get("label") and li["label"].get("name")]

        # Release group for type (Album, Single, EP, etc.)
        rg = data.get("release-group", {})
        rg_type = rg.get("primary-type")

        tags = extract_tags(data, "tags")
        genres = extract_tags(data, "genres")

        results.append({
            "release_mbid": mbid,
            "title": data.get("title"),
            "date": data.get("date"),
            "country": data.get("country"),
            "status": data.get("status"),
            "release_group_type": rg_type,
            "labels": json.dumps(labels) if labels else None,
            "genres": json.dumps([g["name"] for g in genres]) if genres else None,
            "tags": json.dumps([t["name"] for t in tags]) if tags else None,
        })

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(mbids)}] releases processed")

    con.execute("DROP TABLE IF EXISTS release_mb")
    con.execute("""
        CREATE TABLE release_mb (
            release_mbid VARCHAR PRIMARY KEY,
            title VARCHAR,
            date VARCHAR,
            country VARCHAR,
            status VARCHAR,
            release_group_type VARCHAR,
            labels VARCHAR,
            genres VARCHAR,
            tags VARCHAR
        )
    """)

    for r in results:
        con.execute(
            "INSERT OR REPLACE INTO release_mb VALUES (?,?,?,?,?,?,?,?,?)",
            (r["release_mbid"], r["title"], r["date"], r["country"],
             r["status"], r["release_group_type"], r["labels"],
             r["genres"], r["tags"])
        )

    print(f"[releases] Saved {len(results)} enriched releases to release_mb")


def print_summary(con):
    print("\n=== MUSICBRAINZ ENRICHMENT SUMMARY ===")
    for table in ["artist_mb", "recording_mb", "release_mb"]:
        try:
            count = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"  {table}: {count} rows")
        except Exception:
            print(f"  {table}: not created")

    # Genre coverage
    try:
        total = con.execute("SELECT COUNT(*) FROM artist_mb").fetchone()[0]
        with_genres = con.execute("SELECT COUNT(*) FROM artist_mb WHERE genres IS NOT NULL AND genres != '[]'").fetchone()[0]
        print(f"\n  Artist genre coverage: {with_genres}/{total} ({100*with_genres/total:.0f}%)")
    except Exception:
        pass

    try:
        total = con.execute("SELECT COUNT(*) FROM recording_mb").fetchone()[0]
        with_genres = con.execute("SELECT COUNT(*) FROM recording_mb WHERE genres IS NOT NULL AND genres != '[]'").fetchone()[0]
        print(f"  Recording genre coverage: {with_genres}/{total} ({100*with_genres/total:.0f}%)")
    except Exception:
        pass

    # Wikidata readiness
    try:
        with_wd = con.execute("SELECT COUNT(*) FROM artist_mb WHERE wikidata_id IS NOT NULL").fetchone()[0]
        print(f"\n  Artists with Wikidata ID: {with_wd} (ready for geo/detail enrichment)")
    except Exception:
        pass

    # Top genres
    try:
        print("\n  Top 20 artist genres:")
        rows = con.execute("""
            SELECT genre, COUNT(*) as cnt
            FROM (
                SELECT UNNEST(from_json(genres, '["VARCHAR"]')) AS genre
                FROM artist_mb
                WHERE genres IS NOT NULL AND genres != '[]'
            )
            GROUP BY genre
            ORDER BY cnt DESC
            LIMIT 20
        """).fetchall()
        for genre, cnt in rows:
            print(f"    {genre}: {cnt}")
    except Exception as e:
        print(f"  (could not compute top genres: {e})")


def main():
    con = duckdb.connect(str(DB_PATH))
    try:
        # Artists first (fewer, faster, gives us wikidata_ids)
        enrich_artists(con)
        # Recordings (most entities, longest)
        enrich_recordings(con)
        # Releases (labels, types)
        enrich_releases(con)
        print_summary(con)
    finally:
        con.close()

    print("\nDone! MusicBrainz enrichment complete.")
    print(f"Cache saved to: {CACHE_DIR}")


if __name__ == "__main__":
    main()
