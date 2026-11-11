#!/usr/bin/env python3
"""How loud the low end of each record's preview is, 20 times a second.

The orb on the Music section beats with these while a preview plays. Run after
tools/catalog.py when records are added (needs ffmpeg; nothing is saved but
the numbers):

    python3 tools/env.py && python3 tools/build.py

Writes data/env.json: {trackId: "one base-36 digit per 1/20 s, 0 quiet to z loud"}.
"""
import array, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
RATE, WIN = 2000, 100            # 2 kHz is plenty under a 150 Hz low-pass; 100 samples = 1/20 s
DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz"


def envelope(url):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", url, "-ac", "1", "-af", "lowpass=f=150",
                          "-ar", str(RATE), "-f", "s16le", "-"], capture_output=True, timeout=90).stdout
    pcm = array.array("h"); pcm.frombytes(raw[: len(raw) // 2 * 2])
    if len(pcm) < WIN * 20:
        return None
    rms = []
    for i in range(0, len(pcm) - WIN + 1, WIN):
        w = pcm[i:i + WIN]
        rms.append((sum(x * x for x in w) / WIN) ** 0.5)
    s = sorted(rms)
    lo, hi = s[int(len(s) * 0.15)], s[int(len(s) * 0.985)] or 1
    out = []
    for v in rms:
        t = min(1.0, max(0.0, (v - lo) / max(1e-6, hi - lo))) ** 1.6      # the hits stand out from the bed
        out.append(DIGITS[round(t * 35)])
    return "".join(out)


if __name__ == "__main__":
    cat = json.load(open(P("data/catalog.json")))
    path = P("data/env.json")
    env = json.load(open(path)) if os.path.exists(path) and "--all" not in sys.argv else {}
    for c in cat:
        key = str(c["trackId"])
        if key in env or not c.get("preview"):
            continue
        try:
            e = envelope(c["preview"])
        except Exception as err:                       # one bad file must not stop the rest
            e = None; print("  failed:", c["title"], err)
        if e:
            env[key] = e
        print(("ok   " if e else "skip ") + c["title"], flush=True)
    json.dump(env, open(path, "w"), separators=(",", ":"))
    print("data/env.json:", len(env), "of", len(cat), "records")
