#!/usr/bin/env python3
"""Ingest Spotify + ListenBrainz raw data into a unified DuckDB database."""

import json
import duckdb
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
RAW = BASE / "raw-data"
DB_PATH = BASE / "data" / "music.duckdb"


def ingest_spotify(con):
    """Load all Spotify streaming history JSON files."""
    spotify_dir = RAW / "spotify"
    files = sorted(spotify_dir.glob("Streaming_History_Audio_*.json"))
    print(f"[spotify] Found {len(files)} audio files")

    all_records = []
    for f in files:
        with open(f) as fh:
            records = json.load(fh)
            all_records.extend(records)
    print(f"[spotify] Loaded {len(all_records)} audio stream records")

    con.execute("DROP TABLE IF EXISTS spotify_raw")
    glob_pattern = str(spotify_dir / "Streaming_History_Audio_*.json")
    con.execute(f"""
        CREATE TABLE spotify_raw AS
        SELECT
            ts,
            platform,
            ms_played,
            conn_country,
            master_metadata_track_name AS track_name,
            master_metadata_album_artist_name AS artist_name,
            master_metadata_album_album_name AS album_name,
            spotify_track_uri,
            reason_start,
            reason_end,
            shuffle,
            skipped,
            offline,
            incognito_mode
        FROM read_json_auto('{glob_pattern}')
    """)

    count = con.execute("SELECT COUNT(*) FROM spotify_raw").fetchone()[0]
    print(f"[spotify] Ingested {count} rows into spotify_raw")


def ingest_listenbrainz(con):
    """Load all ListenBrainz JSONL listen files."""
    lb_dir = RAW / "listenbrainz" / "listens"
    files = sorted(lb_dir.glob("*/*.jsonl"))
    print(f"[listenbrainz] Found {len(files)} monthly files")

    all_records = []
    for f in files:
        with open(f) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                record = json.loads(line)
                tm = record.get("track_metadata", {})
                mbid = tm.get("mbid_mapping") or {}
                artists = mbid.get("artists") or []

                all_records.append({
                    "listened_at": record.get("listened_at"),
                    "track_name": tm.get("track_name"),
                    "artist_name": tm.get("artist_name"),
                    "release_name": tm.get("release_name"),
                    "recording_mbid": mbid.get("recording_mbid"),
                    "recording_msid": tm.get("recording_msid"),
                    "release_mbid": mbid.get("release_mbid"),
                    "artist_mbid": artists[0]["artist_mbid"] if artists else None,
                    "caa_release_mbid": mbid.get("caa_release_mbid"),
                    "caa_id": mbid.get("caa_id"),
                })

    print(f"[listenbrainz] Loaded {len(all_records)} listen records")

    con.execute("DROP TABLE IF EXISTS listenbrainz_raw")
    con.execute("""
        CREATE TABLE listenbrainz_raw (
            listened_at BIGINT,
            track_name VARCHAR,
            artist_name VARCHAR,
            release_name VARCHAR,
            recording_mbid VARCHAR,
            recording_msid VARCHAR,
            release_mbid VARCHAR,
            artist_mbid VARCHAR,
            caa_release_mbid VARCHAR,
            caa_id BIGINT
        )
    """)

    # Insert in batches
    batch_size = 10000
    for i in range(0, len(all_records), batch_size):
        batch = all_records[i:i + batch_size]
        con.executemany(
            "INSERT INTO listenbrainz_raw VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [(r["listened_at"], r["track_name"], r["artist_name"], r["release_name"],
              r["recording_mbid"], r["recording_msid"], r["release_mbid"],
              r["artist_mbid"], r["caa_release_mbid"], r["caa_id"]) for r in batch]
        )

    count = con.execute("SELECT COUNT(*) FROM listenbrainz_raw").fetchone()[0]
    print(f"[listenbrainz] Ingested {count} rows into listenbrainz_raw")


def ingest_feedback(con):
    """Load ListenBrainz feedback (loved/hated tracks)."""
    fb_path = RAW / "listenbrainz" / "feedback.jsonl"
    if not fb_path.exists():
        print("[feedback] No feedback file found, skipping")
        return

    records = []
    with open(fb_path) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))

    print(f"[feedback] Loaded {len(records)} feedback records")

    con.execute("DROP TABLE IF EXISTS feedback")
    con.execute("""
        CREATE TABLE feedback (
            score INTEGER,
            created BIGINT,
            recording_mbid VARCHAR,
            recording_msid VARCHAR
        )
    """)
    con.executemany(
        "INSERT INTO feedback VALUES (?, ?, ?, ?)",
        [(r["score"], r["created"], r.get("recording_mbid"), r.get("recording_msid")) for r in records]
    )
    count = con.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
    print(f"[feedback] Ingested {count} rows")


def build_unified_listens(con):
    """Create a unified listens table from both sources."""
    con.execute("DROP TABLE IF EXISTS listens")
    con.execute("""
        CREATE TABLE listens AS

        -- Spotify listens
        SELECT
            epoch_ms(ts::TIMESTAMP) / 1000 AS listened_at,
            track_name,
            artist_name,
            album_name,
            spotify_track_uri,
            NULL AS recording_mbid,
            NULL AS artist_mbid,
            NULL AS release_mbid,
            NULL AS caa_release_mbid,
            NULL AS caa_id,
            ms_played,
            skipped,
            shuffle,
            platform,
            reason_start,
            reason_end,
            'spotify' AS source
        FROM spotify_raw
        WHERE track_name IS NOT NULL

        UNION ALL

        -- ListenBrainz listens
        SELECT
            listened_at,
            track_name,
            artist_name,
            release_name AS album_name,
            NULL AS spotify_track_uri,
            recording_mbid,
            artist_mbid,
            release_mbid,
            caa_release_mbid,
            caa_id,
            NULL AS ms_played,
            NULL AS skipped,
            NULL AS shuffle,
            NULL AS platform,
            NULL AS reason_start,
            NULL AS reason_end,
            'listenbrainz' AS source
        FROM listenbrainz_raw
        WHERE track_name IS NOT NULL
    """)

    count = con.execute("SELECT COUNT(*) FROM listens").fetchone()[0]
    print(f"[unified] Created listens table with {count} rows")


def build_entity_tables(con):
    """Extract unique artists, tracks, releases for enrichment."""

    # Unique artists
    con.execute("DROP TABLE IF EXISTS artists")
    con.execute("""
        CREATE TABLE artists AS
        SELECT DISTINCT
            artist_name AS name,
            FIRST(artist_mbid) AS artist_mbid
        FROM listens
        WHERE artist_name IS NOT NULL
        GROUP BY artist_name
    """)
    total = con.execute("SELECT COUNT(*) FROM artists").fetchone()[0]
    with_mbid = con.execute("SELECT COUNT(*) FROM artists WHERE artist_mbid IS NOT NULL").fetchone()[0]
    print(f"[artists] {total} unique artists ({with_mbid} with MusicBrainz ID)")

    # Unique recordings (by mbid where available, else by name+artist)
    con.execute("DROP TABLE IF EXISTS tracks")
    con.execute("""
        CREATE TABLE tracks AS
        SELECT
            recording_mbid,
            FIRST(track_name) AS track_name,
            FIRST(artist_name) AS artist_name,
            FIRST(album_name) AS album_name,
            FIRST(spotify_track_uri) AS spotify_track_uri,
            FIRST(release_mbid) AS release_mbid,
            FIRST(caa_release_mbid) AS caa_release_mbid,
            FIRST(caa_id) AS caa_id,
            COUNT(*) AS play_count
        FROM listens
        WHERE recording_mbid IS NOT NULL
        GROUP BY recording_mbid

        UNION ALL

        SELECT
            NULL AS recording_mbid,
            track_name,
            artist_name,
            FIRST(album_name) AS album_name,
            FIRST(spotify_track_uri) AS spotify_track_uri,
            NULL AS release_mbid,
            NULL AS caa_release_mbid,
            NULL AS caa_id,
            COUNT(*) AS play_count
        FROM listens
        WHERE recording_mbid IS NULL
        GROUP BY track_name, artist_name
    """)
    total = con.execute("SELECT COUNT(*) FROM tracks").fetchone()[0]
    with_mbid = con.execute("SELECT COUNT(*) FROM tracks WHERE recording_mbid IS NOT NULL").fetchone()[0]
    print(f"[tracks] {total} unique tracks ({with_mbid} with MusicBrainz ID)")

    # Unique releases
    con.execute("DROP TABLE IF EXISTS releases")
    con.execute("""
        CREATE TABLE releases AS
        SELECT
            release_mbid,
            FIRST(album_name) AS album_name,
            FIRST(artist_name) AS artist_name,
            FIRST(caa_release_mbid) AS caa_release_mbid,
            FIRST(caa_id) AS caa_id
        FROM listens
        WHERE release_mbid IS NOT NULL
        GROUP BY release_mbid
    """)
    total = con.execute("SELECT COUNT(*) FROM releases").fetchone()[0]
    print(f"[releases] {total} unique releases")


def print_summary(con):
    print("\n=== DATABASE SUMMARY ===")
    tables = con.execute("SHOW TABLES").fetchall()
    for (table,) in tables:
        count = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count} rows")

    print("\n=== TIMELINE ===")
    result = con.execute("""
        SELECT source,
               MIN(to_timestamp(listened_at)) AS earliest,
               MAX(to_timestamp(listened_at)) AS latest,
               COUNT(*) AS plays
        FROM listens
        GROUP BY source
    """).fetchall()
    for source, earliest, latest, plays in result:
        print(f"  {source}: {earliest} → {latest} ({plays:,} plays)")

    print("\n=== ENRICHMENT READINESS ===")
    mbid_tracks = con.execute("SELECT COUNT(*) FROM tracks WHERE recording_mbid IS NOT NULL").fetchone()[0]
    mbid_artists = con.execute("SELECT COUNT(*) FROM artists WHERE artist_mbid IS NOT NULL").fetchone()[0]
    print(f"  Tracks with recording_mbid: {mbid_tracks} (ready for MusicBrainz)")
    print(f"  Artists with artist_mbid: {mbid_artists} (ready for MusicBrainz)")
    caa = con.execute("SELECT COUNT(*) FROM tracks WHERE caa_release_mbid IS NOT NULL AND caa_id IS NOT NULL").fetchone()[0]
    print(f"  Tracks with Cover Art: {caa} (URLs can be built directly)")


def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    con = duckdb.connect(str(DB_PATH))
    try:
        ingest_spotify(con)
        ingest_listenbrainz(con)
        ingest_feedback(con)
        build_unified_listens(con)
        build_entity_tables(con)
        print_summary(con)
    finally:
        con.close()

    print(f"\nDatabase saved to: {DB_PATH}")
    print(f"Size: {DB_PATH.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
