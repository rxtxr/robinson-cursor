#!/usr/bin/env python3
"""Enrich with Spotify API data (artist genres, popularity, track popularity).

Audio Features endpoint is restricted (403), so we focus on:
- Artist genres, popularity, followers (batch of 50)
- Track popularity (batch of 50)

Uses Client Credentials flow.
"""

import json
import os
import time
import requests
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "data" / "music.duckdb"
CACHE_DIR = BASE / "data" / "spotify_cache"
ENV_PATH = BASE / ".env"


def load_env():
    if ENV_PATH.exists():
        with open(ENV_PATH) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()


load_env()

CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
if not CLIENT_ID or not CLIENT_SECRET:
    raise RuntimeError("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set.")


class SpotifyClient:
    def __init__(self):
        self.token = None
        self.token_expiry = 0

    def get_token(self):
        if self.token and time.time() < self.token_expiry - 60:
            return self.token
        resp = requests.post("https://accounts.spotify.com/api/token", data={
            "grant_type": "client_credentials",
        }, auth=(CLIENT_ID, CLIENT_SECRET))
        resp.raise_for_status()
        data = resp.json()
        self.token = data["access_token"]
        self.token_expiry = time.time() + data.get("expires_in", 3600)
        return self.token

    def get(self, url, params=None):
        resp = requests.get(url, params=params, headers={
            "Authorization": f"Bearer {self.get_token()}",
        }, timeout=30)
        if resp.status_code == 429:
            retry = int(resp.headers.get("Retry-After", 5))
            print(f"  Rate limited, waiting {retry}s...")
            time.sleep(retry)
            return self.get(url, params)
        resp.raise_for_status()
        return resp.json()


def extract_unique_artist_ids():
    """Extract unique Spotify artist IDs from track data."""
    cache = BASE / "data" / "spotify_artist_ids.json"
    if cache.exists():
        with open(cache) as f:
            return json.load(f)

    sp = SpotifyClient()

    # First get unique track IDs
    track_ids_file = BASE / "data" / "spotify_track_ids.json"
    if not track_ids_file.exists():
        track_ids = set()
        sp_dir = BASE / "raw-data" / "spotify"
        for f in sorted(sp_dir.glob("Streaming_History_Audio_*.json")):
            with open(f) as fh:
                for rec in json.load(fh):
                    uri = rec.get("spotify_track_uri")
                    if uri and uri.startswith("spotify:track:"):
                        track_ids.add(uri.split(":")[-1])
        track_ids = list(track_ids)
        with open(track_ids_file, "w") as f:
            json.dump(track_ids, f)
    else:
        with open(track_ids_file) as f:
            track_ids = json.load(f)

    print(f"[spotify] {len(track_ids)} unique track IDs")

    # Fetch tracks in batches to get artist IDs
    artist_ids = set()
    track_artist_map = {}  # track_id -> [artist_ids]

    batches = [track_ids[i:i + 50] for i in range(0, len(track_ids), 50)]
    print(f"  Fetching {len(batches)} batches of tracks...")

    for i, batch in enumerate(batches):
        data = sp.get("https://api.spotify.com/v1/tracks", {"ids": ",".join(batch)})
        for track in data.get("tracks", []):
            if track:
                tid = track["id"]
                aids = [a["id"] for a in track.get("artists", [])]
                artist_ids.update(aids)
                track_artist_map[tid] = aids

        if (i + 1) % 20 == 0:
            print(f"  [{(i + 1) * 50}/{len(track_ids)}] tracks scanned")
        time.sleep(0.05)

    result = {
        "artist_ids": list(artist_ids),
        "track_artist_map": track_artist_map,
    }
    with open(cache, "w") as f:
        json.dump(result, f)

    print(f"  Found {len(artist_ids)} unique Spotify artist IDs")
    return result


def fetch_artists(sp, artist_ids):
    """Fetch artist details in batches of 50."""
    cache_file = CACHE_DIR / "artists.json"
    if cache_file.exists():
        with open(cache_file) as f:
            return json.load(f)

    results = {}
    batches = [artist_ids[i:i + 50] for i in range(0, len(artist_ids), 50)]
    print(f"[spotify] Fetching {len(batches)} batches of artists...")

    for i, batch in enumerate(batches):
        data = sp.get("https://api.spotify.com/v1/artists", {"ids": ",".join(batch)})
        for artist in data.get("artists", []):
            if artist:
                results[artist["id"]] = {
                    "name": artist["name"],
                    "genres": artist.get("genres", []),
                    "popularity": artist.get("popularity", 0),
                    "followers": artist.get("followers", {}).get("total", 0),
                }

        if (i + 1) % 20 == 0:
            print(f"  [{(i + 1) * 50}/{len(artist_ids)}] artists fetched")
        time.sleep(0.05)

    with open(cache_file, "w") as f:
        json.dump(results, f, ensure_ascii=False)

    print(f"  Fetched {len(results)} artists")
    return results


def fetch_track_popularity(sp, track_ids):
    """Fetch track popularity in batches of 50."""
    cache_file = CACHE_DIR / "track_popularity.json"
    if cache_file.exists():
        with open(cache_file) as f:
            return json.load(f)

    results = {}
    batches = [track_ids[i:i + 50] for i in range(0, len(track_ids), 50)]
    print(f"[spotify] Fetching popularity for {len(batches)} batches...")

    for i, batch in enumerate(batches):
        data = sp.get("https://api.spotify.com/v1/tracks", {"ids": ",".join(batch)})
        for track in data.get("tracks", []):
            if track:
                results[track["id"]] = {
                    "popularity": track.get("popularity", 0),
                    "explicit": track.get("explicit", False),
                    "duration_ms": track.get("duration_ms"),
                }

        if (i + 1) % 20 == 0:
            print(f"  [{(i + 1) * 50}/{len(track_ids)}] tracks fetched")
        time.sleep(0.05)

    with open(cache_file, "w") as f:
        json.dump(results, f)

    print(f"  Fetched popularity for {len(results)} tracks")
    return results


def write_to_db(artist_data, track_data, track_artist_map):
    """Write enriched data to DuckDB."""
    import duckdb
    con = duckdb.connect(str(DB_PATH))

    # Spotify artists
    con.execute("DROP TABLE IF EXISTS spotify_artists")
    con.execute("""
        CREATE TABLE spotify_artists (
            spotify_artist_id VARCHAR PRIMARY KEY,
            name VARCHAR,
            genres VARCHAR,
            popularity INTEGER,
            followers INTEGER
        )
    """)
    for aid, a in artist_data.items():
        con.execute(
            "INSERT INTO spotify_artists VALUES (?,?,?,?,?)",
            (aid, a["name"], json.dumps(a["genres"]) if a["genres"] else None,
             a["popularity"], a["followers"])
        )

    # Spotify track popularity
    con.execute("DROP TABLE IF EXISTS spotify_tracks")
    con.execute("""
        CREATE TABLE spotify_tracks (
            spotify_track_id VARCHAR PRIMARY KEY,
            popularity INTEGER,
            explicit BOOLEAN,
            duration_ms INTEGER
        )
    """)
    for tid, t in track_data.items():
        con.execute(
            "INSERT INTO spotify_tracks VALUES (?,?,?,?)",
            (tid, t["popularity"], t["explicit"], t["duration_ms"])
        )

    # Track -> Artist mapping
    con.execute("DROP TABLE IF EXISTS spotify_track_artists")
    con.execute("""
        CREATE TABLE spotify_track_artists (
            spotify_track_id VARCHAR,
            spotify_artist_id VARCHAR
        )
    """)
    for tid, aids in track_artist_map.items():
        for aid in aids:
            con.execute("INSERT INTO spotify_track_artists VALUES (?,?)", (tid, aid))

    # Summary
    artist_count = con.execute("SELECT COUNT(*) FROM spotify_artists").fetchone()[0]
    with_genres = con.execute("SELECT COUNT(*) FROM spotify_artists WHERE genres IS NOT NULL AND genres != '[]'").fetchone()[0]
    track_count = con.execute("SELECT COUNT(*) FROM spotify_tracks").fetchone()[0]

    print(f"\n=== SPOTIFY ENRICHMENT SUMMARY ===")
    print(f"  Artists: {artist_count} ({with_genres} with genres)")
    print(f"  Tracks: {track_count} (with popularity)")
    print(f"  Track-Artist links: {len(track_artist_map)}")

    # Top genres
    print("\n  Top 20 Spotify genres:")
    rows = con.execute("""
        SELECT genre, COUNT(*) as cnt
        FROM (
            SELECT UNNEST(from_json(genres, '["VARCHAR"]')) AS genre
            FROM spotify_artists
            WHERE genres IS NOT NULL AND genres != '[]'
        )
        GROUP BY genre ORDER BY cnt DESC LIMIT 20
    """).fetchall()
    for genre, cnt in rows:
        print(f"    {genre}: {cnt}")

    con.close()


def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    sp = SpotifyClient()

    # Step 1: Extract unique artist IDs from tracks
    id_data = extract_unique_artist_ids()
    artist_ids = id_data["artist_ids"]
    track_artist_map = id_data["track_artist_map"]

    # Step 2: Fetch artist details (genres, popularity)
    artist_data = fetch_artists(sp, artist_ids)

    # Step 3: Fetch track popularity
    track_ids_file = BASE / "data" / "spotify_track_ids.json"
    with open(track_ids_file) as f:
        track_ids = json.load(f)
    track_data = fetch_track_popularity(sp, track_ids)

    # Step 4: Write to DB
    print("\nWriting to database...")
    write_to_db(artist_data, track_data, track_artist_map)

    print("\nDone! Spotify enrichment complete.")


if __name__ == "__main__":
    main()
