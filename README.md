# NGHTMRE: artist site (preview)

A restyle of [nghtmre.com](https://nghtmre.com/) that keeps its order (the tour
first, then music, video, shop and follow), its yellow on black and **its own
type** (DusterTM for the wide titles, Bootzy for links, buttons and "Follow
NGHTMRE", Alte Haas Grotesk for the text), and adds:

- **torn paper and thick paint**, after [dieantwoord.com](https://www.dieantwoord.com/):
  the landing is split by a ripped edge into the portrait and a slab of yellow
  paint, every section tears into the next, and covers, videos and merch sit on
  sheets torn on all four sides;
- **big type, bracket labels and a sheet that slides over the picture**, after
  [indigo-laboratory.it](https://indigo-laboratory.it/): the tour dates are a
  paper sheet that rides up over the landing,
  lists highlight with a solid box;
- **a dial and hairline panels**, after [theearthcries.com](https://www.theearthcries.com/):
  the bar at the bottom centre is the player, and opens a dial that turns to
  each section.

There is no entry or loading screen: the landing is the page.

Preview: https://samsegan.github.io/nghtmre-site/ (GitHub Pages, on every push
to `main`). The page asks search engines not to list it.

## What is on the page

1. **Landing**, kept minimal so it points at tickets: the Mindfull portrait
   and the paint, with his logo and "Mindfull Tour" in the middle over the
   seam, then a big Get tickets (its heat-map ring runs round it and it
   breathes) and Tour alerts. Tap the logo or the tour name and the landing
   dreams for three seconds: it warps like water, a hypnotic spiral turns over
   it, echoes of the logo float off in the heat-map colours and the photo
   drifts through them. Once you are past the dates a small Get tickets stays
   under TOUR in the top-left corner, and every date's Tickets button is solid.
2. **Tour**: every upcoming date, read live from Seated (the same feed
   nghtmre.com uses) so it stays right by itself; a copy saved at build time
   shows first and stays if Seated cannot be reached. Past dates drop off. Then
   the stage, fog and crowd from nghtmre.com.
3. **Music**: first every record (57, back to 2015) on **the dream wheel**:
   the covers ride a half circle round his crystal-ball mark like the platter
   of a CDJ, endless both ways. Drag or swipe sideways (with momentum), use a
   trackpad, the arrows, the arrow keys or the years under it. The front record
   is sharp and lit and the rest blur and sink into fog; a hypnotic spiral turns
   with the wheel and spins while a preview plays; the rim carries the years in
   the heat-map colours of the Mindfull artwork. Tap the front cover (or
   Preview) for Apple's 30-second preview; when it ends the wheel turns on to
   the next record. Then MINDFULL (Deluxe) with all 17 tracks. `?records=grid`
   shows the old grid of sleeves instead of the wheel.
4. **Video**: 17 films, then 26 clips from the shows (his YouTube Shorts), all
   played in the page. YouTube does the hosting.
5. **Shop**: eight items from nghtmreshop.com, NGHTMRE's Shopify store, with
   the live price, sizes and stock read from the store's public product feed
   (`/products.json`). Pick a size and Add to bag; the bag is kept in the
   browser, and Check out opens the store's own checkout with those items in it
   (Shopify's cart link, `/cart/<variant>:<qty>,...`), so the order, payment
   and shipping all happen on nghtmreshop.com. If the feed cannot be reached the
   cards are plain links to the products, as before.
6. **Connect**: the same links as nghtmre.com's footer, plus Laylo alerts.

## Files

Plain HTML, CSS and JavaScript. No framework, no build step for the page.

| File | What it holds |
|---|---|
| `index.html` | Every section and the fixed wording |
| `css/styles.css` | The look |
| `js/app.js` | Tour list, player, records, videos, merch, the dial |
| `js/data.js` | Generated from `data/` (do not edit by hand) |
| `data/catalog.json`, `data/album.json` | The records and the album's tracks (generated) |
| `data/videos.json` | The films: YouTube id, title, who with |
| `data/clips.json` | The clips (Shorts): YouTube id, title |
| `data/merch.json` | The eight shop items |
| `data/tour.json` | The saved copy of the tour dates |
| `art/`, `img/` | Cover art, photos, video stills, merch |
| `tex/` | Torn edges, paint, paper, grunge, grain (all drawn by `tools/build.py`) |
| `fonts/` | Archivo (the fallback) and DM Mono for the small labels (both SIL Open Font License). His own fonts load from nghtmre.com, where they are licensed; they are not copied here |
| `tools/catalog.py` | Rebuilds the records and their art from Apple's catalogue |
| `tools/build.py` | Rebuilds `js/data.js`; with flags, the textures and pictures |

## Changing things

**A new record:** put its Apple collection id at the top of `RELEASES` in
`tools/catalog.py` (and its smart link in `LINKS` if there is one), then

    python3 tools/catalog.py
    python3 tools/build.py

**Tour dates:** nothing to do; the page reads Seated. To refresh the saved copy:

    python3 tools/build.py --tour

**A new film:** add a row to `data/videos.json`, save its still as
`img/v-<id>.jpg` (16:9, about 960 wide), then `python3 tools/build.py`.

**A new clip:** add a row to `data/clips.json`, save its still as
`img/s-<id>.webp` (9:16, 360 wide), then `python3 tools/build.py`.

**Shop items:** edit `data/merch.json` (the `handle` is the end of the product's
address) and replace `img/m-<n>.webp` in the same order.

**The textures:** `python3 tools/build.py --tex` (needs Pillow and numpy). The
tears are seeded, so they come out the same each time; change a seed for a new
rip.

**Wording, links:** straight in `index.html`.

## Where things come from

- Photos, logo, tour lockup, stage, fog and crowd: nghtmre.com.
- Tour dates and ticket links: Seated, NGHTMRE's tour feed.
- Records, dates, collaborators, cover art and previews: Apple Music's public
  catalogue. Links are NGHTMRE's own smart links where nghtmre.com lists one,
  otherwise an album.link page that offers every service.
- Films: the list on nghtmre.com's home and video pages (one dead link left
  out); stills from YouTube.
- Merch: nghtmreshop.com. Prices, sizes and stock come live from its product
  feed each time the page opens, so they cannot go stale.
- Clips: his YouTube Shorts (the live moments, not the release ads).
- Fonts: nghtmre.com's theme (`/cdn/shop/t/16/assets/`). If that theme is ever
  replaced the address changes and the page falls back to Archivo: update the
  four `@font-face` lines at the top of `css/styles.css`.
- "Gud Vibrations" on the album: its copyright line.

## Preview locally

    python3 -m http.server 8815

then open http://127.0.0.1:8815/.
