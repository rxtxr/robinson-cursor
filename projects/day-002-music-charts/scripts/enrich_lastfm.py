#!/usr/bin/env python3
"""Enrich artists with Last.fm data (global popularity, similar artists, tags).

Last.fm API: 5 req/sec, requires API key.
Reads key from .env file.
"""

import json
import os
import time
import duckdb
import requests
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "data" / "music.duckdb"
CACHE_DIR = BASE / "data" / "lastfm_cache"
ENV_PATH = BASE / ".env"

# Load .env
def load_env():
    if ENV_PATH.exists():
        with open(ENV_PATH) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_env()

API_KEY = os.environ.get("LASTFM_API_KEY")
if not API_KEY:
    raise RuntimeError("LASTFM_API_KEY not set. Check .env file.")

LASTFM_BASE = "http://ws.audioscrobbler.com/2.0/"
HEADERS = {
    "User-Agent": "robinson-cursor-music-graph/0.1",
}

RATE_LIMIT = 0.2  # 5 req/sec
last_request_time = 0.0


def lastfm_get(method, params=None):
    """Make a rate-limited request to Last.fm API."""
    global last_request_time
    elapsed = time.time() - last_request_time
    if elapsed < RATE_LIMIT:
        time.sleep(RATE_LIMIT - elapsed)

    if params is None:
        params = {}
    params["method"] = method
    params["api_key"] = API_KEY
    params["format"] = "json"

    resp = requests.get(LASTFM_BASE, params=params, headers=HEADERS, timeout=30)
    last_request_time = time.time()

    if resp.status_code == 429:
        print("  Rate limited, waiting 10s...")
        time.sleep(10)
        return lastfm_get(method, params)

    if resp.status_code >= 500:
        print(f"  Server error {resp.status_code}, skipping...")
        return None

    if resp.status_code == 404:
        return None

    resp.raise_for_status()
    data = resp.json()

    if "error" in data:
        return None

    return data


def cache_path(artist_name):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    safe = artist_name.replace("/", "_").replace("\x00", "")[:200]
    return CACHE_DIR / f"{safe}.json"


def get_cached(artist_name):
    p = cache_path(artist_name)
    if p.exists():
        with open(p) as f:
            return json.load(f)
    return None


def save_cache(artist_name, data):
    p = cache_path(artist_name)
    with open(p, "w") as f:
        json.dump(data, f, ensure_ascii=False)


def fetch_artist_info(artist_name):
    """Fetch artist info from Last.fm."""
    cached = get_cached(artist_name)
    if cached is not None:
        return cached

    data = lastfm_get("artist.getinfo", {"artist": artist_name})
    if data and "artist" in data:
        save_cache(artist_name, data["artist"])
        return data["artist"]
    return None


def fetch_similar_artists(artist_name):
    """Fetch similar artists from Last.fm."""
    cache_key = f"_similar_{artist_name}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    data = lastfm_get("artist.getsimilar", {"artist": artist_name, "limit": 10})
    if data and "similarartists" in data:
        similar = data["similarartists"].get("artist", [])
        save_cache(cache_key, similar)
        return similar
    return []


def load_artist_list():
    """Load artist list from DB or cached JSON (if DB is locked)."""
    artist_list_cache = BASE / "data" / "artist_list.json"

    # Try DB first
    try:
        con = duckdb.connect(str(DB_PATH), read_only=True)
        rows = con.execute("""
            SELECT a.name, COUNT(*) as plays
            FROM artists a
            JOIN listens l ON LOWER(l.artist_name) = LOWER(a.name)
            GROUP BY a.name
            ORDER BY plays DESC
        """).fetchall()
        con.close()
        result = [(r[0], r[1]) for r in rows]
        # Cache for next time
        with open(artist_list_cache, "w") as f:
            json.dump(result, f, ensure_ascii=False)
        return result
    except Exception:
        pass

    # Fallback: cached list
    if artist_list_cache.exists():
        print("  (using cached artist list — DB is locked)")
        with open(artist_list_cache) as f:
            return [tuple(x) for x in json.load(f)]

    raise RuntimeError("Cannot read artist list: DB locked and no cache. Run when DB is free first.")


def main():
    artist_names = load_artist_list()
    print(f"[lastfm] Enriching {len(artist_names)} artists...")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = sum(1 for name, _ in artist_names if get_cached(name) is not None)
    remaining = len(artist_names) - cached
    print(f"  Cached: {cached}, Remaining: {remaining}")
    if remaining > 0:
        est_minutes = remaining * RATE_LIMIT / 60
        print(f"  Estimated time: {est_minutes:.0f} minutes")

    results = []
    similar_map = []

    for i, (name, plays) in enumerate(artist_names):
        info = fetch_artist_info(name)
        if info is None:
            continue

        stats = info.get("stats", {})
        tags = info.get("tags", {}).get("tag", [])
        tag_names = [t["name"] for t in tags] if isinstance(tags, list) else []

        results.append({
            "artist_name": name,
            "lastfm_url": info.get("url"),
            "listeners": int(stats.get("listeners", 0)),
            "playcount_global": int(stats.get("playcount", 0)),
            "user_playcount": plays,
            "tags": json.dumps(tag_names) if tag_names else None,
            "bio_summary": (info.get("bio", {}).get("summary") or "")[:500],
        })

        # Fetch similar artists for top 500 artists
        if i < 500:
            similar = fetch_similar_artists(name)
            for s in similar:
                if isinstance(s, dict):
                    similar_map.append({
                        "artist_name": name,
                        "similar_name": s.get("name"),
                        "match": float(s.get("match", 0)),
                    })

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(artist_names)}] artists processed")

    # Phase 2: Write results to DB
    print("\nWriting to database...")
    con = duckdb.connect(str(DB_PATH))
    con.execute("DROP TABLE IF EXISTS artist_lastfm")
    con.execute("""
        CREATE TABLE artist_lastfm (
            artist_name VARCHAR,
            lastfm_url VARCHAR,
            listeners INTEGER,
            playcount_global BIGINT,
            user_playcount INTEGER,
            tags VARCHAR,
            bio_summary VARCHAR
        )
    """)

    for r in results:
        con.execute(
            "INSERT INTO artist_lastfm VALUES (?,?,?,?,?,?,?)",
            (r["artist_name"], r["lastfm_url"], r["listeners"],
             r["playcount_global"], r["user_playcount"], r["tags"],
             r["bio_summary"])
        )

    # Save similarity graph
    con.execute("DROP TABLE IF EXISTS artist_similarity")
    con.execute("""
        CREATE TABLE artist_similarity (
            artist_name VARCHAR,
            similar_name VARCHAR,
            match_score FLOAT
        )
    """)
    for s in similar_map:
        con.execute(
            "INSERT INTO artist_similarity VALUES (?,?,?)",
            (s["artist_name"], s["similar_name"], s["match"])
        )

    print(f"\n[lastfm] Saved {len(results)} artists to artist_lastfm")
    print(f"[lastfm] Saved {len(similar_map)} similarity edges to artist_similarity")

    # Summary stats
    if results:
        listeners = [r["listeners"] for r in results if r["listeners"] > 0]
        if listeners:
            median_listeners = sorted(listeners)[len(listeners) // 2]
            print(f"\n  Median global listeners: {median_listeners:,}")
            obscure = [r for r in results if r["listeners"] < 10000 and r["listeners"] > 0]
            print(f"  'Obscure' artists (<10k listeners): {len(obscure)}")
            mainstream = [r for r in results if r["listeners"] > 1_000_000]
            print(f"  'Mainstream' artists (>1M listeners): {len(mainstream)}")

    con.close()
    print("\nDone! Last.fm enrichment complete.")


if __name__ == "__main__":
    main()
