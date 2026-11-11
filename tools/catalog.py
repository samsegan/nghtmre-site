#!/usr/bin/env python3
"""Rebuild data/catalog.json, data/album.json and the cover art from Apple's
public catalogue (the iTunes lookup API; no key needed).

    python3 tools/catalog.py

RELEASES below is the hand-picked list, newest first: Apple collection ids.
Add a new record by putting its id at the top (the number at the end of its
Apple Music link). LINKS holds NGHTMRE's own smart links where his site has
one; every other record gets a universal album.link page built from the id.
"""
import json, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIST_ID = 910641213
ALBUM = 1887643726            # MINDFULL (Deluxe Version): the featured album

RELEASES = [
    6769552621,  # Can't Stop Me Now
    6798029441,  # No Air
    6786449123,  # Computah
    6781836156,  # Stfu
    1891414868,  # Earthquake
    1887643726,  # MINDFULL (Deluxe Version)
    1886003236,  # Screen Time
    1870703327,  # Free
    1823703988,  # Everybody Knows
    1814240507,  # TYPE SH*T
    1812494336,  # Up Top
    1803626707,  # Buried A Friend
    1795537712,  # Torch
    1774218218,  # Lean onto Me
    1761886883,  # Angel
    1741434080,  # UNSOUND 2
    1742157357,  # Voodoo
    1737876848,  # Restless
    1731007014,  # Thrilla
    1719696900,  # In Your Eyes
    1711640650,  # All Night
    1705104600,  # DRMVRSE Deluxe
    1702267771,  # On My Mind
    1695998511,  # Gigantic NGHTMRE
    1711456743,  # One Chance
    1691158968,  # Back For More
    1646301644,  # Monster
    1640579398,  # Fall Into Me
    1601528144,  # UNSOUND EP
    1711704749,  # Shady Intentions
    1589107808,  # Shell Shock
    1721427216,  # MOSH
    1711711670,  # Scars
    1711713314,  # Speak Easy
    1553952565,  # Falling
    1711704861,  # Tu Tu Tu
    1711663292,  # Nuclear Bass Face
    1711663274,  # Wrist
    1497052677,  # FEELING GUD
    1714740191,  # CASH COW
    1714746043,  # Bruises
    1714740925,  # Man's First Inhibition
    1714920474,  # REDLIGHT
    1452703365,  # Bang
    1445199959,  # Like That
    1414699008,  # Grave
    1385679630,  # Magic Hour
    1313576343,  # NGHTMRE, Pt. II
    1268855598,  # Embrace
    1211347159,  # End of the Night
    1166391765,  # GUD VIBRATIONS
    1564812474,  # Frontlines
    1106106655,  # Need You
    1084894326,  # NGHTMRE EP
    1055186641,  # Aftershock
    1048316677,  # Nuclear Bonds
    1018119102,  # Street
]

# NGHTMRE's own links, as published on nghtmre.com (home and /pages/music).
LINKS = {
    1761886883: "https://dimension.lnk.to/angel",
    1741434080: "https://gudvibrations.ffm.to/unsound2",
    1705104600: "https://nghtmre.ffm.to/drmvrse-deluxe",
    1711456743: "http://knock2.lnk.to/onechance",
    1640579398: "http://smarturl.it/NGHTMRE-FallIntoMe",
    1601528144: "https://gudvibrations.io/UNSOUND",
    1711704749: "https://ffm.to/shadyintentions",
    1589107808: "https://gudvibrations.ffm.to/shellshock",
    1721427216: "https://ffm.to/m0sh",
    1711711670: "https://ffm.to/nm-scars",
    1711713314: "https://ffm.to/speakeasy",
    1553952565: "http://gudvibrations.lnk.to/falling",
    1711704861: "http://ffm.to/tututu",
    1711663292: "https://ffm.to/nuclearbassface",
    1711663274: "https://ffm.to/wrist",
    1497052677: "https://cmg.ffm.to/feelinggud",
    1714740191: "https://ffm.to/cashcow",
    1714746043: "https://ffm.to/nght-bruises",
    1714740925: "https://ffm.to/mans1",
    1714920474: "https://ffm.to/-redlight",
}


def get(url):
    # curl, not urllib: the python.org build of Python ships without root certificates
    return subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", url], check=True, capture_output=True).stdout


def lookup(ids):
    out = []
    for i in range(0, len(ids), 8):
        chunk = ",".join(str(x) for x in ids[i:i + 8])
        url = f"https://itunes.apple.com/lookup?id={chunk}&entity=song&limit=200&country=us"
        out += json.loads(get(url))["results"]
        time.sleep(0.4)
    return out


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]


def clean(name):
    """'Torch - Single' -> ('Torch', 'Single')."""
    kind = "Album"
    for tag, k in ((" - Single", "Single"), (" - EP", "EP")):
        if name.endswith(tag):
            return name[: -len(tag)], k
    if name.upper().endswith(" EP"):
        return name, "EP"
    return name, kind


def split_feat(title):
    """'Wrist (feat. Tory Lanez)' -> ('Wrist', 'Tory Lanez')."""
    m = re.search(r"\s*[\(\[]feat\.\s*([^\)\]]+)[\)\]]", title)
    if not m:
        return title, ""
    return (title[: m.start()] + title[m.end():]).strip(), m.group(1).strip()


def main():
    res = lookup(RELEASES)
    cols = {r["collectionId"]: r for r in res if r.get("wrapperType") == "collection"}
    tracks = {}
    for r in res:
        if r.get("wrapperType") == "track" and r.get("kind") == "song":
            tracks.setdefault(r["collectionId"], []).append(r)
    for t in tracks.values():
        t.sort(key=lambda r: (r.get("discNumber", 1), r.get("trackNumber", 0)))

    os.makedirs(os.path.join(ROOT, "art"), exist_ok=True)
    catalog, missing = [], []
    for cid in RELEASES:
        c = cols.get(cid)
        if not c:
            missing.append(cid)
            continue
        name, kind = clean(c["collectionName"])
        title, feat = split_feat(name)
        tr = tracks.get(cid, [])
        first = next((t for t in tr if t.get("previewUrl")), None)
        s = slug(title) or str(cid)
        art = f"art/{s}.webp"
        path = os.path.join(ROOT, art)
        if not os.path.exists(path):
            src = c["artworkUrl100"].replace("100x100bb.jpg", "520x520bb.webp")
            open(path, "wb").write(get(src))
            time.sleep(0.15)
        catalog.append({
            "id": cid,
            "title": title,
            "feat": feat,
            "artists": c["artistName"],
            "kind": kind if c.get("trackCount", 1) > 1 or kind != "Album" else "Single",
            "tracks": c.get("trackCount", 1),
            "date": c["releaseDate"][:10],
            "art": art,
            "preview": first["previewUrl"] if first else "",
            "trackId": first["trackId"] if first else 0,
            "link": LINKS.get(cid, f"https://album.link/i/{cid}"),
        })

    al = cols[ALBUM]
    album = {
        "id": ALBUM,
        "title": clean(al["collectionName"])[0],
        "date": al["releaseDate"][:10],
        "copyright": al.get("copyright", ""),
        "art": next(c["art"] for c in catalog if c["id"] == ALBUM),
        "link": LINKS.get(ALBUM, f"https://album.link/i/{ALBUM}"),
        "tracks": [],
    }
    for t in tracks.get(ALBUM, []):
        title, feat = split_feat(t["trackName"])
        album["tracks"].append({
            "n": t.get("trackNumber", 0),
            "title": title,
            "feat": feat,
            "artists": t["artistName"],
            "ms": t.get("trackTimeMillis", 0),
            "preview": t.get("previewUrl", ""),
            "trackId": t["trackId"],
        })

    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    json.dump(catalog, open(os.path.join(ROOT, "data/catalog.json"), "w"), indent=1, ensure_ascii=False)
    json.dump(album, open(os.path.join(ROOT, "data/album.json"), "w"), indent=1, ensure_ascii=False)
    print(f"{len(catalog)} records, {len(album['tracks'])} album tracks")
    if missing:
        print("not found:", missing, file=sys.stderr)


if __name__ == "__main__":
    main()
