#!/usr/bin/env python3
"""Export Billboard-style chart data for the frontend.

Generates:
- Yearly charts (songs + albums) per year
- Decade Top 100 (songs + artists)
- Genre charts (all-time)
- All-time Top 100 (songs + artists)
"""

import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from normalize import EXCLUDE_ARTISTS, ARTIST_MERGES, TRACK_RENAMES, normalize_listen

BASE = Path(__file__).resolve().parent.parent
RAW = BASE / "raw-data"
OUT = BASE / "data" / "frontend"

def load_all_listens():
    listens = []

    # Spotify
    for f in sorted((RAW / "spotify").glob("Streaming_History_Audio_*.json")):
        with open(f) as fh:
            for rec in json.load(fh):
                name = rec.get("master_metadata_track_name")
                if not name:
                    continue
                ts = rec.get("ts", "")
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except Exception:
                    continue
                listens.append({
                    "t": int(dt.timestamp()),
                    "year": dt.year,
                    "tr": name,
                    "ar": rec.get("master_metadata_album_artist_name", ""),
                    "al": rec.get("master_metadata_album_album_name", ""),
                    "ms": rec.get("ms_played", 0),
                    "s": "sp",
                })

    # ListenBrainz
    for f in sorted((RAW / "listenbrainz" / "listens").glob("*/*.jsonl")):
        with open(f) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                tm = rec.get("track_metadata", {})
                name = tm.get("track_name")
                if not name:
                    continue
                listened_at = rec.get("listened_at", 0)
                dt = datetime.fromtimestamp(listened_at, tz=timezone.utc)
                listens.append({
                    "t": listened_at,
                    "year": dt.year,
                    "tr": name,
                    "ar": tm.get("artist_name", ""),
                    "al": tm.get("release_name", ""),
                    "ms": 0,
                    "s": "lb",
                })

    # Apply normalization (excludes, merges, renames)
    before = len(listens)
    listens = [l for l in listens if normalize_listen(l)]
    print(f"  Normalized: {before - len(listens)} excluded, {len(listens)} remaining")

    listens.sort(key=lambda x: x["t"])
    print(f"Loaded {len(listens)} listens")
    return listens


def get_decade(year):
    return (year // 10) * 10


def export_yearly_charts(listens):
    """Top songs and albums per year."""
    yearly_songs = defaultdict(Counter)
    yearly_albums = defaultdict(Counter)
    yearly_song_info = {}
    yearly_album_info = defaultdict(lambda: defaultdict(set))

    for l in listens:
        y = l["year"]
        song_key = (l["tr"], l["ar"])
        album_key = (l["al"], l["ar"])

        yearly_songs[y][song_key] += 1
        if song_key not in yearly_song_info:
            yearly_song_info[song_key] = {"al": l["al"]}

        if l["al"]:
            yearly_albums[y][album_key] += 1
            yearly_album_info[y][album_key].add(l["tr"])

    result = {}
    for y in sorted(yearly_songs.keys()):
        songs = []
        for (tr, ar), count in yearly_songs[y].most_common(100):
            songs.append({
                "tr": tr, "ar": ar,
                "al": yearly_song_info.get((tr, ar), {}).get("al", ""),
                "p": count,
            })

        albums = []
        for (al, ar), count in yearly_albums[y].most_common(50):
            albums.append({
                "al": al, "ar": ar, "p": count,
                "tc": len(yearly_album_info[y][(al, ar)]),  # unique tracks
            })

        result[str(y)] = {"songs": songs, "albums": albums}

    write_json("yearly_charts.json", result)
    print(f"  yearly_charts.json: {len(result)} years")


def export_decade_charts(listens):
    """Top 100 songs, albums and artists per decade."""
    decade_songs = defaultdict(Counter)
    decade_albums = defaultdict(Counter)
    decade_album_tracks = defaultdict(lambda: defaultdict(set))
    decade_artists = defaultdict(Counter)
    decade_artist_ms = defaultdict(lambda: defaultdict(int))
    song_info = {}

    for l in listens:
        dec = get_decade(l["year"])
        song_key = (l["tr"], l["ar"])
        album_key = (l["al"], l["ar"])
        decade_songs[dec][song_key] += 1
        decade_artists[dec][l["ar"]] += 1
        decade_artist_ms[dec][l["ar"]] += l.get("ms", 0)

        if l["al"]:
            decade_albums[dec][album_key] += 1
            decade_album_tracks[dec][album_key].add(l["tr"])

        if song_key not in song_info:
            song_info[song_key] = {"al": l["al"]}

    result = {}
    for dec in sorted(decade_songs.keys()):
        songs = []
        for (tr, ar), count in decade_songs[dec].most_common(100):
            songs.append({
                "tr": tr, "ar": ar,
                "al": song_info.get((tr, ar), {}).get("al", ""),
                "p": count,
            })

        albums = []
        for (al, ar), count in decade_albums[dec].most_common(100):
            albums.append({
                "al": al, "ar": ar, "p": count,
                "tc": len(decade_album_tracks[dec][(al, ar)]),
            })

        artists = []
        for ar, count in decade_artists[dec].most_common(100):
            artists.append({
                "n": ar, "p": count,
                "ms": decade_artist_ms[dec][ar],
            })

        result[str(dec)] = {
            "songs": songs,
            "albums": albums,
            "artists": artists,
            "total_plays": sum(decade_songs[dec].values()),
        }

    write_json("decade_charts.json", result)
    print(f"  decade_charts.json: {len(result)} decades")


def export_alltime_charts(listens):
    """All-time Top 100 songs and artists."""
    song_plays = Counter()
    artist_plays = Counter()
    artist_ms = defaultdict(int)
    song_info = {}
    artist_first = {}
    artist_last = {}

    for l in listens:
        song_key = (l["tr"], l["ar"])
        song_plays[song_key] += 1
        artist_plays[l["ar"]] += 1
        artist_ms[l["ar"]] += l.get("ms", 0)

        if song_key not in song_info:
            song_info[song_key] = {"al": l["al"]}

        ar = l["ar"]
        t = l["t"]
        if ar not in artist_first or t < artist_first[ar]:
            artist_first[ar] = t
        if ar not in artist_last or t > artist_last[ar]:
            artist_last[ar] = t

    songs = []
    for (tr, ar), count in song_plays.most_common(200):
        songs.append({
            "tr": tr, "ar": ar,
            "al": song_info.get((tr, ar), {}).get("al", ""),
            "p": count,
        })

    artists = []
    for ar, count in artist_plays.most_common(200):
        artists.append({
            "n": ar, "p": count,
            "ms": artist_ms[ar],
            "f": artist_first.get(ar, 0),
            "l": artist_last.get(ar, 0),
        })

    write_json("alltime_songs.json", songs)
    write_json("alltime_artists.json", artists)
    print(f"  alltime_songs.json: {len(songs)} songs")
    print(f"  alltime_artists.json: {len(artists)} artists")


def export_genre_charts(listens):
    """Genre charts — uses Spotify artist genres from cache if available."""
    # Try to load Spotify genre data
    genre_cache = BASE / "data" / "spotify_cache" / "artists.json"
    spotify_genres = {}
    if genre_cache.exists():
        with open(genre_cache) as f:
            artists_data = json.load(f)
            # Build artist name -> genres map
            for aid, a in artists_data.items():
                if a.get("genres"):
                    name_lower = a["name"].lower()
                    spotify_genres[name_lower] = a["genres"]
        print(f"  Loaded Spotify genres for {len(spotify_genres)} artists")

    # Also try MB cache
    mb_cache = BASE / "data" / "mb_cache" / "artist"
    mb_genres = {}
    if mb_cache.exists():
        for f in mb_cache.glob("*.json"):
            try:
                with open(f) as fh:
                    data = json.load(fh)
                    name = data.get("name", "").lower()
                    genres = [g["name"] for g in data.get("genres", []) if g.get("name")]
                    tags = [t["name"] for t in data.get("tags", []) if t.get("name") and t.get("count", 0) > 0]
                    if genres or tags:
                        mb_genres[name] = genres if genres else tags[:5]
            except Exception:
                pass
        print(f"  Loaded MB genres for {len(mb_genres)} artists")

    # Merge: prefer Spotify, fallback to MB
    def get_genres(artist_name):
        name = artist_name.lower()
        return spotify_genres.get(name) or mb_genres.get(name) or []

    # Count plays per genre
    genre_plays = Counter()
    genre_artists = defaultdict(Counter)
    genre_songs = defaultdict(Counter)
    song_info = {}

    for l in listens:
        genres = get_genres(l["ar"])
        if not genres:
            continue
        song_key = (l["tr"], l["ar"])
        if song_key not in song_info:
            song_info[song_key] = {"al": l["al"]}

        for g in genres:
            genre_plays[g] += 1
            genre_artists[g][l["ar"]] += 1
            genre_songs[g][song_key] += 1

    # Build genre charts
    result = []
    for genre, total in genre_plays.most_common(50):
        top_artists = [{"n": ar, "p": c} for ar, c in genre_artists[genre].most_common(20)]
        top_songs = [{"tr": tr, "ar": ar, "al": song_info.get((tr, ar), {}).get("al", ""), "p": c}
                     for (tr, ar), c in genre_songs[genre].most_common(20)]

        result.append({
            "genre": genre,
            "total_plays": total,
            "artist_count": len(genre_artists[genre]),
            "top_artists": top_artists,
            "top_songs": top_songs,
        })

    write_json("genre_charts.json", result)
    print(f"  genre_charts.json: {len(result)} genres")

    # Coverage stats
    total_listens = len(listens)
    covered = sum(1 for l in listens if get_genres(l["ar"]))
    print(f"  Genre coverage: {covered}/{total_listens} ({100*covered/total_listens:.0f}%)")


def write_json(filename, data):
    path = OUT / filename
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
    size_kb = path.stat().st_size / 1024
    print(f"    → {size_kb:.0f} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Loading all listens...")
    listens = load_all_listens()

    print(f"\nExporting Billboard data to {OUT}/")
    export_yearly_charts(listens)
    export_decade_charts(listens)
    export_alltime_charts(listens)
    export_genre_charts(listens)

    total_kb = sum(f.stat().st_size for f in OUT.glob("*.json")) / 1024
    print(f"\nTotal frontend data: {total_kb:.0f} KB")


if __name__ == "__main__":
    main()
