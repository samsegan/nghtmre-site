# NGHTMRE: artist site (preview)

A restyle of [nghtmre.com](https://nghtmre.com/) that keeps its order (the tour
first, then music, video, shop and follow) and its yellow on black, and adds:

- **torn paper and thick paint**, after [dieantwoord.com](https://www.dieantwoord.com/):
  the landing is split by a ripped edge into the portrait and a slab of yellow
  paint, every section tears into the next, and covers, videos and merch sit on
  sheets torn on all four sides;
- **big type, bracket labels and a sheet that slides over the picture**, after
  [indigo-laboratory.it](https://indigo-laboratory.it/): the tour dates are a
  paper sheet that rides up over the landing, headings are eaten-away print,
  lists highlight with a solid box;
- **a dial and hairline panels**, after [theearthcries.com](https://www.theearthcries.com/):
  the bar at the bottom centre is the player, and opens a dial that turns to
  each section.

There is no entry or loading screen: the landing is the page.

Preview: https://samsegan.github.io/nghtmre-site/ (GitHub Pages, on every push
to `main`). The page asks search engines not to list it.

## What is on the page

1. **Landing**: the Mindfull portrait, the tour name, the next show with a
   countdown, tickets.
2. **Tour**: every upcoming date, read live from Seated (the same feed
   nghtmre.com uses) so it stays right by itself; a copy saved at build time
   shows first and stays if Seated cannot be reached. Past dates drop off. Then
   the stage, fog and crowd from nghtmre.com.
3. **Music**: MINDFULL (Deluxe) with all 17 tracks, then 57 records back to
   2015. A tap plays Apple's 30-second preview in the page; the arrow opens the
   record in full.
4. **Video**: 17 films, played in the page.
5. **Shop**: eight items from nghtmreshop.com, each linking to its page there.
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
| `data/merch.json` | The eight shop items |
| `data/tour.json` | The saved copy of the tour dates |
| `art/`, `img/` | Cover art, photos, video stills, merch |
| `tex/` | Torn edges, paint, paper, grunge, grain (all drawn by `tools/build.py`) |
| `fonts/` | Archivo and DM Mono (both SIL Open Font License) |
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
- Merch: nghtmreshop.com. No prices are shown, so none can go stale.
- "Gud Vibrations" on the album: its copyright line.

## Preview locally

    python3 -m http.server 8815

then open http://127.0.0.1:8815/.
