#!/usr/bin/env python3
"""Build Cover Art Archive URLs from existing ListenBrainz data.

No API calls needed - caa_release_mbid and caa_id are already in the data.
URL format: https://coverartarchive.org/release/{caa_release_mbid}/{caa_id}-{size}.jpg
Sizes: 250, 500, 1200 (pixels)
"""

import duckdb
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "data" / "music.duckdb"


def main():
    con = duckdb.connect(str(DB_PATH))

    con.execute("DROP TABLE IF EXISTS cover_art")
    con.execute("""
        CREATE TABLE cover_art AS
        SELECT DISTINCT
            release_mbid,
            caa_release_mbid,
            caa_id,
            'https://coverartarchive.org/release/' || caa_release_mbid || '/' || CAST(caa_id AS VARCHAR) || '-250.jpg' AS url_250,
            'https://coverartarchive.org/release/' || caa_release_mbid || '/' || CAST(caa_id AS VARCHAR) || '-500.jpg' AS url_500
        FROM tracks
        WHERE caa_release_mbid IS NOT NULL
          AND caa_id IS NOT NULL
    """)

    count = con.execute("SELECT COUNT(*) FROM cover_art").fetchone()[0]
    print(f"[cover_art] Built {count} cover art URLs")

    # Sample
    print("\nSample URLs:")
    rows = con.execute("SELECT url_250 FROM cover_art LIMIT 5").fetchall()
    for (url,) in rows:
        print(f"  {url}")

    con.close()


if __name__ == "__main__":
    main()
