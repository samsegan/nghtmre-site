#!/usr/bin/env python3
"""The pieces the landing's dream and the orb need. Run when the art changes.

    uv run --with pillow --with numpy tools/dream.py            # everything
    uv run --with pillow --with numpy tools/dream.py --check DIR  # also save test pictures

Writes:
  img/hero-dream.webp   the portrait as a thermal camera would see it
  data/slices.json      where the portrait's five slices are cut (percent of the picture)
  data/colors.json      two glow colours for every cover in art/
"""
import colorsys, glob, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
SIZE = 1800  # hero.webp is 1800 square; hero-m.webp is the same picture at 1000

# The portrait is five stacked slices. Each cut follows the rim of a plate in
# the artwork: (x, y) points in hero.webp's pixels, left to right. Outside the
# plate the cut runs level to the picture's edges.
CUTS = [
    # under the sunglasses slice: just below its yellow rim (arched)
    [(598, 772), (650, 755), (700, 746), (750, 740), (800, 736), (850, 734), (900, 734), (950, 736),
     (1000, 740), (1050, 746), (1100, 755), (1150, 772)],
    # under the eyes slice (arched)
    [(644, 984), (700, 970), (750, 964), (800, 961), (850, 959), (900, 959), (950, 962), (1000, 968),
     (1040, 976), (1072, 992)],
    # the top plate of the mouth slice: just above its near rim (bowed)
    [(636, 1258), (680, 1274), (720, 1283), (760, 1289), (800, 1292), (850, 1294), (900, 1294), (950, 1292),
     (1000, 1288), (1050, 1280), (1100, 1262)],
    # the top plate of the chin slice (bowed)
    [(550, 1432), (580, 1454), (620, 1468), (680, 1480), (750, 1488), (820, 1492), (900, 1493), (980, 1491),
     (1050, 1486), (1110, 1476), (1150, 1464), (1192, 1436)],
]


def cut_line(c):
    """A cut, run out level to both edges."""
    return [(0, c[0][1])] + c + [(SIZE, c[-1][1])]


def bands():
    """Five polygons, top to bottom, in hero.webp's pixels."""
    lines = [[(0, 0), (SIZE, 0)]] + [cut_line(c) for c in CUTS] + [[(0, SIZE), (SIZE, SIZE)]]
    return [lines[i] + lines[i + 1][::-1] for i in range(5)]


def write_slices():
    out = [[[round(x / SIZE * 100, 2), round(y / SIZE * 100, 2)] for x, y in poly] for poly in bands()]
    json.dump(out, open(P("data/slices.json"), "w"), separators=(",", ":"))
    print("data/slices.json:", [len(p) for p in out], "points")


# cold to hot, in the colours of the Mindfull artwork's glow
HEAT = [(0.00, "#04030c"), (0.14, "#0c0a3d"), (0.30, "#1d22c9"), (0.44, "#2f6bff"), (0.54, "#18c964"),
        (0.64, "#ff2d55"), (0.78, "#ff7a1a"), (0.90, "#fcc000"), (1.00, "#fff3b0")]


def heat_lut():
    xs = [s for s, _ in HEAT]
    cols = np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for _, c in HEAT], float)
    t = np.linspace(0, 1, 256)
    return np.stack([np.interp(t, xs, cols[:, k]) for k in range(3)], axis=1).astype(np.uint8)


def thermal(size=1200):
    from PIL import ImageFilter
    # a thermal camera is soft: a little blur also takes the film grain out
    im = Image.open(P("img/hero.webp")).convert("RGB").resize((size, size), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6))
    a = np.asarray(im).astype(float) / 255
    luma = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    # the yellow of the smiley and the rims is the hottest thing in the picture
    yellow = np.clip((a[..., 0] + a[..., 1]) / 2 - a[..., 2], 0, 1)
    # spread the lit skin over the whole scale: its darkest parts blue, its
    # middle green to red, only the highlights yellow
    lit = luma[luma > 0.2]
    marks = np.percentile(lit, [2, 25, 50, 75, 92, 99.5])
    t = np.interp(luma, [0.0, 0.16] + list(marks), [0.0, 0.07, 0.26, 0.47, 0.60, 0.72, 0.86, 1.0])
    t = np.clip(t + 0.22 * yellow * (luma > 0.45), 0, 1)
    out = heat_lut()[(t * 255).astype(np.uint8)]
    Image.fromarray(out).save(P("img/hero-dream.webp"), "WEBP", quality=74, method=6)
    print("img/hero-dream.webp:", os.path.getsize(P("img/hero-dream.webp")) // 1024, "KB")


def glow(path):
    """Two vivid, different colours from a cover."""
    a = np.asarray(Image.open(path).convert("RGB").resize((40, 40), Image.LANCZOS)).reshape(-1, 3) / 255
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in a])
    w = hsv[:, 1] * (0.25 + hsv[:, 2])                 # vivid and not too dark counts most
    hist = np.zeros(24)
    np.add.at(hist, (hsv[:, 0] * 24).astype(int) % 24, w)
    hist = hist + np.roll(hist, 1) * .5 + np.roll(hist, -1) * .5
    if hist.max() < 6:                                  # a grey cover: his yellow, and a cool purple
        return ["#fcc000", "#7a3cff"]
    h1 = int(hist.argmax())
    far = np.array([min((i - h1) % 24, (h1 - i) % 24) for i in range(24)])
    h2hist = np.where(far >= 4, hist, 0)
    h2 = int(h2hist.argmax()) if h2hist.max() > hist.max() * .18 else (h1 + 3) % 24

    def col(h):
        sel = ((hsv[:, 0] * 24).astype(int) % 24 == h) & (hsv[:, 1] > .25)
        hue = float(np.average(hsv[sel, 0], weights=w[sel] + 1e-6)) if sel.any() else (h + .5) / 24
        r, g, b = colorsys.hsv_to_rgb(hue, 0.86, 1.0)
        return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))
    return [col(h1), col(h2)]


def write_colors():
    out = {}
    for f in sorted(glob.glob(P("art/*.webp"))):
        out["art/" + os.path.basename(f)] = glow(f)
    json.dump(out, open(P("data/colors.json"), "w"), indent=0)
    print("data/colors.json:", len(out), "covers")
    return out


def check(folder, colors):
    """Pictures to look at: the slices pulled apart, the thermal portrait, the colours."""
    from PIL import ImageDraw
    src = Image.open(P("img/hero.webp")).convert("RGB")
    canvas = Image.new("RGB", (SIZE, SIZE), (37, 37, 37))
    for poly, dx in zip(bands(), (-70, 80, -50, 60, -75)):
        m = Image.new("L", (SIZE, SIZE), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        canvas.paste(src, (dx, 0), m)
    canvas.crop((350, 350, 1450, 1750)).resize((550, 700), Image.LANCZOS).save(os.path.join(folder, "apart.png"))
    Image.open(P("img/hero-dream.webp")).resize((600, 600), Image.LANCZOS).save(os.path.join(folder, "thermal.png"))
    names = sorted(colors)
    sheet = Image.new("RGB", (12 * 90, ((len(names) + 11) // 12) * 120), (10, 10, 10))
    d = ImageDraw.Draw(sheet)
    for i, n in enumerate(names):
        x, y = (i % 12) * 90, (i // 12) * 120
        sheet.paste(Image.open(P(n)).convert("RGB").resize((88, 88)), (x, y))
        d.rectangle([x, y + 90, x + 43, y + 116], fill=colors[n][0])
        d.rectangle([x + 45, y + 90, x + 88, y + 116], fill=colors[n][1])
    sheet.save(os.path.join(folder, "colors.png"))


if __name__ == "__main__":
    write_slices()
    thermal()
    cols = write_colors()
    if "--check" in sys.argv:
        check(sys.argv[sys.argv.index("--check") + 1], cols)
