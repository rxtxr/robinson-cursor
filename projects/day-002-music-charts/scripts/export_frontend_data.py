#!/usr/bin/env python3
"""Export pre-computed JSON data for the frontend.

Reads from raw data files directly (no DB lock needed).
Outputs compact JSON files to be served statically.
"""

import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from normalize import normalize_listen

BASE = Path(__file__).resolve().parent.parent
RAW = BASE / "raw-data"
OUT = BASE / "data" / "frontend"


def load_all_listens():
    """Load all listens from both sources into a unified list."""
    listens = []

    # Spotify
    sp_dir = RAW / "spotify"
    for f in sorted(sp_dir.glob("Streaming_History_Audio_*.json")):
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
                    "tr": name,
                    "ar": rec.get("master_metadata_album_artist_name", ""),
                    "al": rec.get("master_metadata_album_album_name", ""),
                    "ms": rec.get("ms_played", 0),
                    "sk": rec.get("skipped") or False,
                    "sh": rec.get("shuffle") or False,
                    "pl": rec.get("platform", ""),
                    "rs": rec.get("reason_start", ""),
                    "re": rec.get("reason_end", ""),
                    "s": "sp",
                })

    # ListenBrainz
    lb_dir = RAW / "listenbrainz" / "listens"
    for f in sorted(lb_dir.glob("*/*.jsonl")):
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
                mbid_map = tm.get("mbid_mapping") or {}
                artists = mbid_map.get("artists") or []
                listens.append({
                    "t": rec.get("listened_at", 0),
                    "tr": name,
                    "ar": tm.get("artist_name", ""),
                    "al": tm.get("release_name", ""),
                    "ms": 0,
                    "sk": False,
                    "sh": False,
                    "pl": "",
                    "rs": "",
                    "re": "",
                    "s": "lb",
                    "mb": mbid_map.get("recording_mbid"),
                    "amb": artists[0]["artist_mbid"] if artists else None,
                    "caa": mbid_map.get("caa_release_mbid"),
                    "cid": mbid_map.get("caa_id"),
                })

    before = len(listens)
    listens = [l for l in listens if normalize_listen(l)]
    print(f"  Normalized: {before - len(listens)} excluded, {len(listens)} remaining")

    listens.sort(key=lambda x: x["t"])
    print(f"Loaded {len(listens)} total listens")
    return listens


def export_all_listens(listens):
    """Export compact listen events for client-side filtering."""
    # Slim version: only essential fields, short keys
    slim = []
    for l in listens:
        entry = {
            "t": l["t"],
            "tr": l["tr"],
            "ar": l["ar"],
            "al": l["al"],
            "s": l["s"],
        }
        if l["ms"]:
            entry["ms"] = l["ms"]
        if l["sk"]:
            entry["sk"] = 1
        if l["sh"]:
            entry["sh"] = 1
        if l.get("pl"):
            entry["pl"] = l["pl"]
        slim.append(entry)

    write_json("listens.json", slim)
    print(f"  listens.json: {len(slim)} events")


def export_timeline(listens):
    """Monthly play counts by source."""
    monthly = defaultdict(lambda: {"sp": 0, "lb": 0, "ms_sp": 0})
    for l in listens:
        dt = datetime.fromtimestamp(l["t"], tz=timezone.utc)
        key = f"{dt.year}-{dt.month:02d}"
        monthly[key][l["s"]] += 1
        if l["s"] == "sp":
            monthly[key]["ms_sp"] += l.get("ms", 0)

    result = [{"m": k, "sp": v["sp"], "lb": v["lb"], "ms": v["ms_sp"]}
              for k, v in sorted(monthly.items())]
    write_json("timeline.json", result)
    print(f"  timeline.json: {len(result)} months")


def export_heatmap(listens):
    """Hour × Day-of-week heatmap."""
    heatmap = defaultdict(int)
    for l in listens:
        dt = datetime.fromtimestamp(l["t"], tz=timezone.utc)
        heatmap[(dt.weekday(), dt.hour)] += 1

    result = [{"d": d, "h": h, "c": c} for (d, h), c in sorted(heatmap.items())]
    write_json("heatmap.json", result)
    print(f"  heatmap.json: {len(result)} cells")


def export_top_artists(listens):
    """Top artists by play count and listening time."""
    plays = Counter()
    ms_total = defaultdict(int)
    first_listen = {}
    last_listen = {}

    for l in listens:
        ar = l["ar"]
        if not ar:
            continue
        plays[ar] += 1
        ms_total[ar] += l.get("ms", 0)
        t = l["t"]
        if ar not in first_listen or t < first_listen[ar]:
            first_listen[ar] = t
        if ar not in last_listen or t > last_listen[ar]:
            last_listen[ar] = t

    result = []
    for ar, count in plays.most_common(500):
        result.append({
            "n": ar,
            "p": count,
            "ms": ms_total[ar],
            "f": first_listen[ar],
            "l": last_listen[ar],
        })

    write_json("top_artists.json", result)
    print(f"  top_artists.json: {len(result)} artists")


def export_top_tracks(listens):
    """Top tracks by play count."""
    plays = Counter()
    track_info = {}
    for l in listens:
        key = (l["tr"], l["ar"])
        plays[key] += 1
        if key not in track_info:
            track_info[key] = {"al": l["al"]}

    result = []
    for (tr, ar), count in plays.most_common(500):
        result.append({
            "tr": tr,
            "ar": ar,
            "al": track_info[(tr, ar)]["al"],
            "p": count,
        })

    write_json("top_tracks.json", result)
    print(f"  top_tracks.json: {len(result)} tracks")


def export_artist_timeline(listens):
    """Monthly plays per artist (top 100 artists only)."""
    # Find top 100 artists
    plays = Counter()
    for l in listens:
        if l["ar"]:
            plays[l["ar"]] += 1
    top100 = {ar for ar, _ in plays.most_common(100)}

    monthly = defaultdict(lambda: defaultdict(int))
    for l in listens:
        ar = l["ar"]
        if ar not in top100:
            continue
        dt = datetime.fromtimestamp(l["t"], tz=timezone.utc)
        key = f"{dt.year}-{dt.month:02d}"
        monthly[key][ar] += 1

    result = []
    for month in sorted(monthly.keys()):
        entry = {"m": month}
        for ar, count in monthly[month].items():
            entry[ar] = count
        result.append(entry)

    write_json("artist_timeline.json", result)
    print(f"  artist_timeline.json: {len(result)} months × top 100 artists")


def export_discovery_timeline(listens):
    """When each artist was first heard."""
    first_listen = {}
    play_counts = Counter()
    for l in listens:
        ar = l["ar"]
        if not ar:
            continue
        play_counts[ar] += 1
        t = l["t"]
        if ar not in first_listen or t < first_listen[ar]:
            first_listen[ar] = t

    result = []
    for ar, t in sorted(first_listen.items(), key=lambda x: x[1]):
        result.append({
            "n": ar,
            "t": t,
            "p": play_counts[ar],
        })

    write_json("discoveries.json", result)
    print(f"  discoveries.json: {len(result)} artist discoveries")


def export_session_data(listens):
    """Listening sessions (gap > 30 min = new session)."""
    sessions = []
    current_session = []
    SESSION_GAP = 30 * 60  # 30 minutes

    sp_listens = [l for l in listens if l["s"] == "sp"]  # Only Spotify has timing data
    for i, l in enumerate(sp_listens):
        if current_session and (l["t"] - sp_listens[i - 1]["t"]) > SESSION_GAP:
            if len(current_session) >= 2:
                sessions.append({
                    "start": current_session[0]["t"],
                    "end": current_session[-1]["t"],
                    "tracks": len(current_session),
                    "ms": sum(x.get("ms", 0) for x in current_session),
                })
            current_session = []
        current_session.append(l)

    if len(current_session) >= 2:
        sessions.append({
            "start": current_session[0]["t"],
            "end": current_session[-1]["t"],
            "tracks": len(current_session),
            "ms": sum(x.get("ms", 0) for x in current_session),
        })

    write_json("sessions.json", sessions)
    print(f"  sessions.json: {len(sessions)} sessions")


def export_skip_data(listens):
    """Skip analysis per artist/track (Spotify only)."""
    artist_stats = defaultdict(lambda: {"plays": 0, "skips": 0, "ms_total": 0})
    for l in listens:
        if l["s"] != "sp":
            continue
        ar = l["ar"]
        if not ar:
            continue
        artist_stats[ar]["plays"] += 1
        if l.get("sk"):
            artist_stats[ar]["skips"] += 1
        artist_stats[ar]["ms_total"] += l.get("ms", 0)

    result = []
    for ar, stats in artist_stats.items():
        if stats["plays"] >= 10:  # min plays threshold
            result.append({
                "n": ar,
                "p": stats["plays"],
                "sk": stats["skips"],
                "ms": stats["ms_total"],
                "r": round(stats["skips"] / stats["plays"], 3),
            })

    result.sort(key=lambda x: -x["p"])
    write_json("skips.json", result[:500])
    print(f"  skips.json: {len(result[:500])} artists with skip data")


def export_platform_data(listens):
    """Platform usage over time (Spotify only)."""
    monthly = defaultdict(lambda: Counter())
    for l in listens:
        if l["s"] != "sp" or not l.get("pl"):
            continue
        dt = datetime.fromtimestamp(l["t"], tz=timezone.utc)
        key = f"{dt.year}-{dt.month:02d}"
        # Normalize platform names
        pl = l["pl"].lower()
        if "android" in pl:
            pl = "android"
        elif "ios" in pl or "iphone" in pl or "ipad" in pl:
            pl = "ios"
        elif "osx" in pl or "macos" in pl or "os_x" in pl:
            pl = "macos"
        elif "windows" in pl:
            pl = "windows"
        elif "linux" in pl:
            pl = "linux"
        elif "web" in pl:
            pl = "web"
        elif "cast" in pl or "chromecast" in pl:
            pl = "cast"
        elif "sonos" in pl:
            pl = "sonos"
        monthly[key][pl] += 1

    result = []
    for month in sorted(monthly.keys()):
        entry = {"m": month}
        entry.update(dict(monthly[month]))
        result.append(entry)

    write_json("platforms.json", result)
    print(f"  platforms.json: {len(result)} months")


def export_loyalty_data(listens):
    """Artist loyalty: how many years does each artist span?"""
    artist_years = defaultdict(set)
    artist_plays = Counter()
    for l in listens:
        ar = l["ar"]
        if not ar:
            continue
        dt = datetime.fromtimestamp(l["t"], tz=timezone.utc)
        artist_years[ar].add(dt.year)
        artist_plays[ar] += 1

    result = []
    for ar in artist_plays:
        years = sorted(artist_years[ar])
        if len(years) >= 2:
            result.append({
                "n": ar,
                "p": artist_plays[ar],
                "y": years,
                "span": years[-1] - years[0] + 1,
                "active": len(years),
            })

    result.sort(key=lambda x: (-x["active"], -x["p"]))
    write_json("loyalty.json", result[:500])
    print(f"  loyalty.json: {len(result[:500])} artists")


def export_listening_clock(listens):
    """Hourly distribution by year."""
    yearly_hours = defaultdict(lambda: [0] * 24)
    for l in listens:
        dt = datetime.fromtimestamp(l["t"], tz=timezone.utc)
        yearly_hours[dt.year][dt.hour] += 1

    result = {str(y): hours for y, hours in sorted(yearly_hours.items())}
    write_json("clock.json", result)
    print(f"  clock.json: {len(result)} years")


def export_source_comparison(listens):
    """Spotify vs ListenBrainz overlap analysis."""
    sp_artists = Counter()
    lb_artists = Counter()
    for l in listens:
        ar = l["ar"]
        if not ar:
            continue
        if l["s"] == "sp":
            sp_artists[ar] += 1
        else:
            lb_artists[ar] += 1

    both = set(sp_artists.keys()) & set(lb_artists.keys())
    sp_only = set(sp_artists.keys()) - set(lb_artists.keys())
    lb_only = set(lb_artists.keys()) - set(sp_artists.keys())

    result = {
        "summary": {
            "both": len(both),
            "sp_only": len(sp_only),
            "lb_only": len(lb_only),
        },
        "sp_only_top": [{"n": a, "p": sp_artists[a]} for a in sorted(sp_only, key=lambda x: -sp_artists[x])[:50]],
        "lb_only_top": [{"n": a, "p": lb_artists[a]} for a in sorted(lb_only, key=lambda x: -lb_artists[x])[:50]],
    }
    write_json("sources.json", result)
    print(f"  sources.json: {len(both)} shared, {len(sp_only)} sp-only, {len(lb_only)} lb-only")


def write_json(filename, data):
    path = OUT / filename
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
    size_kb = path.stat().st_size / 1024
    return size_kb


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Loading all listens...")
    listens = load_all_listens()

    print(f"\nExporting frontend data to {OUT}/")
    export_all_listens(listens)
    export_timeline(listens)
    export_heatmap(listens)
    export_top_artists(listens)
    export_top_tracks(listens)
    export_artist_timeline(listens)
    export_discovery_timeline(listens)
    export_session_data(listens)
    export_skip_data(listens)
    export_platform_data(listens)
    export_loyalty_data(listens)
    export_listening_clock(listens)
    export_source_comparison(listens)

    # Total size
    total_kb = sum(f.stat().st_size for f in OUT.glob("*.json")) / 1024
    print(f"\nTotal export size: {total_kb:.0f} KB ({total_kb/1024:.1f} MB)")


if __name__ == "__main__":
    main()
