"""Fetch iconic album covers for the planet artists.

Strategy:
1. Hand-curated OVERRIDES map artist -> the album that defines them. This is
   the authoritative list — the tool just finds the right release-group MBID.
2. Fallback for artists not in OVERRIDES: query MB for release-groups, strongly
   filter out bootlegs / compilations / live / remix / soundtrack, then pick the
   one with the highest release count (proxy for how iconic the album is — more
   pressings = more popular).
3. CAA fetch per release-group; if that has no art, iterate down the ranked list.

Run with project dir as cwd or invoke by path.
"""
from __future__ import annotations
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

UA = "klangkosmos/1.0 (https://robinson-cursor.com; marius.bruns@gmail.com)"

PROJECT = Path(__file__).resolve().parent.parent
DATA = PROJECT / "data"
COVERS = PROJECT / "covers"
COVERS.mkdir(exist_ok=True)

# Hand-picked iconic albums. These are the records that each artist is known
# for — not always their highest-rated on MB, but the one a listener would
# associate with them. Keyed by artist name exactly as it appears in top_artists.json.
OVERRIDES: dict[str, str] = {
    "Aphex Twin": "Selected Ambient Works 85-92",
    "DJ Shadow": "Endtroducing.....",
    "The Chemical Brothers": "Dig Your Own Hole",
    "Earthling": "Radar",
    "Regina Spektor": "Begin to Hope",
    "Portishead": "Dummy",
    "Cat Power": "You Are Free",
    "Radiohead": "OK Computer",
    "Sia": "1000 Forms of Fear",
    "Rainer Maria": "A Better Version of Me",
    "Daft Punk": "Discovery",
    "Tocotronic": "Digital ist besser",
    "Silver Mt. Zion": "He Has Left Us Alone but Shafts of Light Sometimes Grace the Corner of Our Rooms…",
    "UNKLE": "Psyence Fiction",
    "Pink Floyd": "The Dark Side of the Moon",
    "Nirvana": "Nevermind",
    "Boards of Canada": "Music Has the Right to Children",
    "The Album Leaf": "In a Safe Place",
    "Beastie Boys": "Paul's Boutique",
    "Interpol": "Turn On the Bright Lights",
    "The Notwist": "Neon Golden",
    "Simon & Garfunkel": "Bridge Over Troubled Water",
    "Tegan and Sara": "The Con",
    "The Prodigy": "The Fat of the Land",
}

# Secondary-types to reject when auto-picking. These are rarely the canonical record.
REJECT_SECONDARIES = {
    "Compilation", "Live", "Remix", "Soundtrack", "Interview",
    "Demo", "Audiobook", "Spokenword", "DJ-mix", "Mixtape/Street",
}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    return re.sub(r"[\s_-]+", "-", s)


def http_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def http_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def mb_query(q: str, limit: int = 25) -> list[dict]:
    url = f"https://musicbrainz.org/ws/2/release-group?query={urllib.parse.quote(q)}&limit={limit}&fmt=json"
    data = http_json(url)
    return data.get("release-groups", [])


def is_real_album(rg: dict) -> bool:
    if rg.get("primary-type") != "Album":
        return False
    if set(rg.get("secondary-types") or []) & REJECT_SECONDARIES:
        return False
    return True


def search_override(artist: str, album: str) -> list[dict]:
    # Exact title search, filter to the matching artist. Helps when artist names
    # collide (e.g. "Earthling" — there are two different artists).
    q = f'release:"{album}" AND artist:"{artist}"'
    rgs = mb_query(q, limit=10)
    rgs = [rg for rg in rgs if is_real_album(rg)]
    # Prefer exact-title matches
    album_norm = album.lower().strip()
    exact = [rg for rg in rgs if rg.get("title", "").lower().strip() == album_norm]
    return exact or rgs


def search_iconic(artist: str) -> list[dict]:
    # Use artist-constrained query and rank by release count — more pressings =
    # more iconic / widely owned.
    q = f'artist:"{artist}" AND primarytype:album'
    rgs = mb_query(q, limit=25)
    rgs = [rg for rg in rgs if is_real_album(rg)]
    # Also require the credited artist name to match (MB score can be lenient)
    artist_norm = artist.lower().strip()
    def credited_to(rg):
        for ac in rg.get("artist-credit") or []:
            if (ac.get("name") or "").lower().strip() == artist_norm:
                return True
            a = ac.get("artist") or {}
            if (a.get("name") or "").lower().strip() == artist_norm:
                return True
        return False
    rgs = [rg for rg in rgs if credited_to(rg)]
    # Sort by (release-count desc, score desc)
    rgs.sort(key=lambda rg: (-int(rg.get("count") or 0), -int(rg.get("score") or 0)))
    return rgs


def fetch_cover_for_rg(rg_id: str) -> bytes | None:
    for size in (500, 250):
        url = f"https://coverartarchive.org/release-group/{rg_id}/front-{size}"
        try:
            return http_bytes(url)
        except Exception:
            continue
    return None


def find_cover(artist: str) -> tuple[bytes | None, dict | None]:
    rgs: list[dict] = []
    override = OVERRIDES.get(artist)
    try:
        if override:
            rgs = search_override(artist, override)
            # If override search returned nothing, fall back to iconic
            if not rgs:
                time.sleep(1.1)
                rgs = search_iconic(artist)
        else:
            rgs = search_iconic(artist)
    except Exception as e:
        print(f"  [MB error] {artist}: {e}", file=sys.stderr)
        return None, None

    for rg in rgs:
        rg_id = rg["id"]
        img = fetch_cover_for_rg(rg_id)
        if img and len(img) > 2000:
            return img, rg
        time.sleep(0.6)
    return None, None


def main():
    top = json.loads((DATA / "top_artists.json").read_text())
    loy_list = json.loads((DATA / "loyalty.json").read_text())
    loy_by = {a["n"]: a for a in loy_list}

    merged = []
    for a in top:
        lo = loy_by.get(a["n"])
        span = lo["span"] if lo else 0
        active = lo["active"] if lo else 0
        ratio = active / span if span else 0
        merged.append({"name": a["n"], "plays": a["p"], "span": span, "active": active, "ratio": ratio})
    planets = [a for a in merged if a["ratio"] >= 0.80 and a["span"] >= 2][:24]

    # Clear any stale entries so overrides take effect.
    # (Keep existing covers only if the artist isn't in OVERRIDES — that way
    # auto-picked covers persist across runs, but hand-curated ones re-fetch
    # to match the override album.)
    force_refetch = set(OVERRIDES.keys())

    out = {}
    missing = []
    for i, p in enumerate(planets):
        name = p["name"]
        slug = slugify(name)
        dest = COVERS / f"{slug}.jpg"

        if dest.exists() and dest.stat().st_size > 2000 and name not in force_refetch:
            print(f"[{i+1:2}/{len(planets)}] {name}  (cached)")
            # Preserve whatever album metadata the previous run wrote
            out[name] = {"path": f"covers/{slug}.jpg", "cached": True}
            continue

        # Delete stale override files before refetching
        if dest.exists() and name in force_refetch:
            dest.unlink()

        tag = f" [override: {OVERRIDES[name]}]" if name in OVERRIDES else ""
        print(f"[{i+1:2}/{len(planets)}] {name}{tag}  …", end="", flush=True)
        img, rg = find_cover(name)
        if img:
            dest.write_bytes(img)
            out[name] = {
                "path": f"covers/{slug}.jpg",
                "album": rg.get("title"),
                "rg_id": rg.get("id"),
                "year": (rg.get("first-release-date") or "")[:4],
            }
            print(f" ok — {rg.get('title')}  ({len(img)//1024} KB)")
        else:
            out[name] = {"path": None}
            missing.append(name)
            print(" no cover found")

        time.sleep(1.1)

    # Merge with existing covers.json so cached entries keep their album metadata
    cj = PROJECT / "covers.json"
    existing = json.loads(cj.read_text()) if cj.exists() else {}
    for name, info in out.items():
        if info.get("cached"):
            # Keep whatever existed before for cached entries
            if name in existing:
                out[name] = existing[name]
    cj.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"\ndone. {sum(1 for v in out.values() if v.get('path'))} covers, {len(missing)} missing.")
    if missing:
        print("missing:", ", ".join(missing))


if __name__ == "__main__":
    main()
