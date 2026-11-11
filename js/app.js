/* NGHTMRE: tour dates, the records and their previews, videos, merch, the dial. */
(function () {
  'use strict';

  var D = window.NGHT || { tour: [], album: { tracks: [] }, catalog: [], videos: [], merch: [] };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  // a hypnotic spiral: one arm; the dark between its turns is the other
  function spiral(turns) {
    var k = 100 / (turns * 2 * Math.PI), pts = [];
    for (var a = 0; a <= turns * 2 * Math.PI; a += 0.05) pts.push((k * a * Math.cos(a)).toFixed(2) + ',' + (k * a * Math.sin(a)).toFixed(2));
    return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="currentColor" stroke-width="' + (Math.PI * k).toFixed(2) + '"/>';
  }

  var SEATED = 'https://cdn.seated.com/api/tour/b3f93a40-bbae-46a6-9c9c-24f747b4b48c?include=tour-events';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  $('#year').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ tour */

  function day(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function range(a, b) {
    if (a.getTime() === b.getTime()) return MON[a.getMonth()] + ' ' + a.getDate();
    if (a.getMonth() === b.getMonth()) return MON[a.getMonth()] + ' ' + a.getDate() + '&ndash;' + b.getDate();
    return MON[a.getMonth()] + ' ' + a.getDate() + ' &ndash; ' + MON[b.getMonth()] + ' ' + b.getDate();
  }

  function renderTour(list) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var shows = list.filter(function (e) { return day(e.end || e.start) >= today; })
      .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    var box = $('#shows');
    if (!shows.length) {
      box.innerHTML = '<li class="shows-wait"><a href="https://laylo.com/nghtmre" target="_blank" rel="noopener">No dates on sale right now. Get told when the next ones land &nearr;</a></li>';
      $('#tour-count').textContent = '[ Dates soon ]';
      return;
    }
    var html = '', lastMonth = '';
    shows.forEach(function (e, i) {
      var a = day(e.start), b = day(e.end || e.start);
      var key = a.getFullYear() + '-' + a.getMonth();
      if (key !== lastMonth) {
        lastMonth = key;
        html += '<li class="month" aria-hidden="true">[ ' + MONTH[a.getMonth()] + ' ' + a.getFullYear() + ' ]</li>';
      }
      var parts = e.place.split(','), city = parts.shift().trim(), region = parts.join(',').trim();
      var sub = a.getTime() === b.getTime() ? DAY[a.getDay()] + ' &middot; ' + a.getFullYear() : a.getFullYear() + ' &middot; ' + (Math.round((b - a) / 864e5) + 1) + ' days';
      html += '<li class="show' + (i === 0 ? ' next-up' : '') + (e.soldOut ? ' sold' : '') + '">' +
        '<a href="https://link.seated.com/' + esc(e.id) + '" target="_blank" rel="noopener">' +
        '<span class="show-n">' + pad(i + 1) + '</span>' +
        '<span class="show-date"><b>' + range(a, b) + '</b><i>' + sub + '</i></span>' +
        '<span class="show-city">' + esc(city) + (region ? '<small>' + esc(region) + '</small>' : '') + '</span>' +
        '<span class="show-venue">' + esc(e.venue) + (e.note ? '<em>' + esc(e.note) + '</em>' : '') + '</span>' +
        '<span class="show-cta">' + (e.soldOut ? 'Sold out' : 'Tickets') + ' <span aria-hidden="true">&nearr;</span></span>' +
        '</a></li>';
    });
    box.innerHTML = html;

    var first = day(shows[0].start), last = day(shows[shows.length - 1].end || shows[shows.length - 1].start);
    $('#tour-count').textContent = '[ ' + shows.length + (shows.length === 1 ? ' date ]' : ' dates ]');
    var y1 = first.getFullYear(), y2 = last.getFullYear();
    $('#tour-span').innerHTML = '[ ' + MON[first.getMonth()] + ' ' + y1 + ' &mdash; ' + MON[last.getMonth()] + ' ' + y2 + ' ]';
  }

  renderTour(D.tour);

  // the dates as they stand right now
  if (window.fetch) {
    fetch(SEATED, { headers: { Accept: 'application/vnd.api+json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        var live = (j.included || []).filter(function (e) { return e.type === 'tour-events'; }).map(function (e) {
          var a = e.attributes;
          return {
            id: e.id, start: a['starts-at-date-local'], end: a['ends-at-date-local'] || a['starts-at-date-local'],
            venue: (a['venue-name'] || '').trim(), place: (a['formatted-address'] || '').trim(),
            note: (a.details || '').trim(), soldOut: !!a['is-sold-out']
          };
        }).filter(function (e) { return e.start; });
        if (live.length) renderTour(live);
      })
      .catch(function () { /* the list built into the page stays */ });
  }

  /* ------------------------------------------------------------ the landing, and its dream */

  (function landing() {
    var hero = $('.hero'), cut = $('.cut');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the seven letters of the logo: where each starts and ends, of logo.png's 1000
    var LETTERS = [[20, 157], [156, 287], [299, 423], [431, 546], [545, 745], [758, 884], [891, 979]];
    var seed = 11;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 * 2 - 1; };   // -1..1, the same every time
    var drift = LETTERS.map(function () { return [rnd() * 16, rnd() * 34, rnd() * 9, Math.abs(rnd()) * 0.14]; });
    var words = 'Mindfull Tour'.split(' ');
    var tdrift = words.join('').split('').map(function () { return [rnd() * 0.22, rnd() * 0.6, rnd() * 13, Math.abs(rnd()) * 0.14]; });

    // every copy of the lockup gets the same letters, so they move as one
    $$('.lk-logo').forEach(function (el) {
      el.innerHTML = '<b></b><span class="lt">' + LETTERS.map(function (r, i) {
        var f = (r[1] - r[0]) / 1000, size = (100 / f).toFixed(3) + '% 100%', at = (r[0] / 1000 / (1 - f) * 100).toFixed(3) + '% 0', d = drift[i];
        return '<i style="left:' + (r[0] / 10) + '%;width:' + (f * 100).toFixed(2) + '%;-webkit-mask-size:' + size + ';mask-size:' + size +
          ';-webkit-mask-position:' + at + ';mask-position:' + at + ';--dx:' + d[0].toFixed(1) + '%;--dy:' + d[1].toFixed(1) + '%;--dr:' + d[2].toFixed(1) + 'deg;--dl:' + d[3].toFixed(2) + 's"></i>';
      }).join('') + '</span>';
    });
    $$('.lk-title').forEach(function (el) {
      var n = 0;
      el.innerHTML = words.map(function (w) {
        return w.split('').map(function (ch) {
          var d = tdrift[n++];
          return '<span style="--dx:' + d[0].toFixed(2) + 'em;--dy:' + d[1].toFixed(2) + 'em;--dr:' + d[2].toFixed(1) + 'deg;--dl:' + d[3].toFixed(2) + 's">' + ch + '</span>';
        }).join('');
      }).join(' ');
    });

    // the portrait's five slices, as the thermal camera sees them (made once, the first time they are needed)
    var bands = null;
    function makeBands() {
      if (bands || !D.slices) return;
      bands = document.createElement('div');
      bands.className = 'cut-bands';
      bands.innerHTML = D.slices.map(function (poly) {
        var pts = poly.map(function (p) { return p[0] + '% ' + p[1] + '%'; }).join(',');
        return '<div class="band" style="-webkit-clip-path:polygon(' + pts + ');clip-path:polygon(' + pts + ')"><img src="img/hero-dream.webp" alt="" width="1200" height="1200" decoding="async"></div>';
      }).join('');
      cut.appendChild(bands);
    }
    window.addEventListener('load', function () { setTimeout(makeBands, 900); });

    var busy = false, dreaming = false, wake = 0, LEN = 4400;
    function blink(then) {
      busy = true;
      hero.classList.add('blink');
      setTimeout(function () {
        then();
        hero.classList.remove('blink');
        setTimeout(function () { busy = false; }, 380);
      }, still ? 0 : 210);
    }
    function dream(on) {
      dreaming = on;
      hero.classList.toggle('dreaming', on);
      $$('.dream-hit').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
    }
    function toggle() {
      if (busy) return;
      clearTimeout(wake);
      if (dreaming) { blink(function () { dream(false); }); return; }
      makeBands();
      blink(function () { dream(true); });
      wake = setTimeout(function () { if (dreaming && !busy) blink(function () { dream(false); }); }, LEN);
    }
    $$('.dream-hit').forEach(function (b) { b.addEventListener('click', toggle); });
  })();

  /* ------------------------------------------------------------ player */

  var audio = new Audio();
  audio.preload = 'none';
  var cur = null, retried = false, runOn = 'album', dreamSync = function () {};
  var dock = $('#dock'), dockText = $('.dock-text'), nowV = $('.dial-now-v');

  function mark() {
    $$('.is-playing').forEach(function (el) { el.classList.remove('is-playing'); });
    var on = cur && !audio.paused;
    document.body.classList.toggle('playing', !!on);
    if (cur) {
      $$('[data-key="' + cur.key + '"]').forEach(function (el) { if (on) el.classList.add('is-playing'); });
      dockText.textContent = cur.title;
      nowV.textContent = cur.title + ' / ' + cur.artists;
    }
    dreamSync();
    var lab = on ? 'Stop the preview' : 'Play a preview';
    $('.dock-play').setAttribute('aria-label', lab);
    $('.dial-play').setAttribute('aria-label', lab);
  }

  function start(item, from) {
    if (from) runOn = from;
    if (!item || !item.preview) { if (item && item.link) window.open(item.link, '_blank', 'noopener'); return; }
    if (cur && cur.key === item.key) {
      if (audio.paused) audio.play().catch(function () {}); else audio.pause();
      return;
    }
    cur = item; retried = false;
    stopVideo();
    audio.src = item.preview;
    audio.play().catch(function () {});
    mark();
  }

  // Apple moves preview files now and then: ask for the current address once
  audio.addEventListener('error', function () {
    if (!cur || retried || !cur.trackId) return;
    retried = true;
    var name = 'ngcb' + Date.now(), s = document.createElement('script'), item = cur;
    window[name] = function (j) {
      delete window[name]; s.remove();
      var r = j && j.results && j.results[0];
      if (r && r.previewUrl && cur === item) { item.preview = r.previewUrl; audio.src = r.previewUrl; audio.play().catch(function () {}); }
    };
    s.src = 'https://itunes.apple.com/lookup?id=' + item.trackId + '&callback=' + name;
    document.head.appendChild(s);
  });
  ['play', 'pause', 'ended'].forEach(function (ev) { audio.addEventListener(ev, mark); });
  audio.addEventListener('timeupdate', function () {
    dock.style.setProperty('--p', audio.duration ? (audio.currentTime / audio.duration).toFixed(4) : 0);
  });
  audio.addEventListener('ended', function () {
    dock.style.setProperty('--p', 0);
    // run on: the wheel turns to the next record, the album to its next track
    if (!cur) return;
    if (runOn === 'wheel' && cur.cat != null) dreamNext(cur.cat);
    else if (cur.album != null && albumItems[cur.album + 1]) start(albumItems[cur.album + 1]);
  });

  function toggleMain() { start(cur || albumItems[0] || catItems[0]); }
  $('.dock-play').addEventListener('click', toggleMain);
  $('.dial-play').addEventListener('click', toggleMain);

  /* ------------------------------------------------------------ music */

  var albumItems = D.album.tracks.map(function (t, i) {
    return { key: 't' + t.trackId, title: t.title, artists: t.artists, preview: t.preview, trackId: t.trackId, link: D.album.link, album: i };
  });
  var catItems = D.catalog.map(function (c, i) {
    // a record that is on the album shares its key with the album track, so both light up
    var same = albumItems.filter(function (a) { return a.trackId === c.trackId; })[0];
    var it = same || { key: 'c' + c.id, title: c.title, artists: c.artists, preview: c.preview, trackId: c.trackId, link: c.link };
    it.cat = i;
    return it;
  });
  var dreamNext = function () {};

  function mmss(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + pad(s % 60); }

  (function album() {
    var a = D.album;
    if (!a.tracks.length) return;
    var label = (a.copyright.match(/\d{4}\s+(.+?)(?:\s+under|,|$)/) || [])[1];
    $('#album-specs').innerHTML = [a.tracks.length + ' tracks', 'Out now', label].filter(Boolean)
      .map(function (s) { return '<li><span>' + esc(s) + '</span></li>'; }).join('');
    $('#album-link').href = a.link;
    $('#album-img').src = a.art;
    $('#tracks').innerHTML = a.tracks.map(function (t, i) {
      var who = t.artists.split(/\s*,\s*|\s+&\s+/).filter(function (n) { return n && n !== 'NGHTMRE'; }).join(', ');
      var sub = [who && 'with ' + who, t.feat && 'feat. ' + t.feat].filter(Boolean).join(' / ');
      return '<li class="track" data-key="t' + t.trackId + '"><button type="button" data-album="' + i + '">' +
        '<span class="track-n">' + pad(t.n) + '</span>' +
        '<span class="track-t">' + esc(t.title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' +
        '<span class="track-d">' + mmss(t.ms) + '</span><i class="track-i" aria-hidden="true"></i>' +
        '<span class="sr"> play a preview</span></button></li>';
    }).join('');
    $('#tracks').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) start(albumItems[+b.dataset.album], 'album');
    });
  })();

  var GRID = /[?&]records=grid\b/.test(location.search);

  (function catalog() {
    if (!GRID) return;
    $('#orbit').hidden = true;
    $('#grid-view').hidden = false;
    var FIRST = 12;
    $('#music-count').textContent = '[ ' + D.catalog.length + ' records ]';
    $('#cat').innerHTML = D.catalog.map(function (c, i) {
      var it = catItems[i];
      var meta = [c.date.slice(0, 4), c.kind !== 'Single' ? c.kind : '', c.artists !== 'NGHTMRE' ? c.artists : '', c.feat && 'feat. ' + c.feat].filter(Boolean).join(' / ');
      return '<li class="sleeve' + (i >= FIRST ? ' more' : '') + '" data-key="' + it.key + '">' +
        '<button class="sleeve-play" type="button" data-i="' + i + '" aria-label="Play a preview of ' + esc(c.title) + '">' +
        '<img src="' + esc(c.art) + '" alt="" width="520" height="520" loading="lazy" decoding="async">' +
        '<span class="sleeve-tag" aria-hidden="true">Preview</span></button>' +
        '<div class="sleeve-cap"><span class="sleeve-t">' + esc(c.title) + '</span>' +
        '<a class="sleeve-l" href="' + esc(c.link) + '" target="_blank" rel="noopener" aria-label="Listen to ' + esc(c.title) + ' in full">&nearr;</a>' +
        '<span class="sleeve-a">' + esc(meta) + '</span></div></li>';
    }).join('');
    $('#cat').addEventListener('click', function (e) {
      var b = e.target.closest('.sleeve-play');
      if (b) start(catItems[+b.dataset.i], 'grid');
    });
    var all = $('#cat-all');
    if (D.catalog.length <= FIRST) { all.hidden = true; return; }
    all.textContent = 'View all ' + D.catalog.length;
    all.addEventListener('click', function () {
      var open = $('#cat').classList.toggle('all');
      all.textContent = open ? 'Show fewer' : 'View all ' + D.catalog.length;
      if (!open) $('.cat-head').scrollIntoView({ block: 'start' });
    });
  })();

  /* ------------------------------------------------------------ the orb (every record) */

  (function orbit() {
    if (GRID || !D.catalog.length) return;
    var root = $('#orbit'), stage = $('#orbit-stage'), fan = $('#fan');
    var halo = $('.orb-halo', stage), ticksEl = $('.orb-ticks', stage), prog = $('#orb-prog');
    var N = D.catalog.length, COL = D.colors || {}, ENV = D.env || {};
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var year = function (c) { return c.date.slice(0, 4); };

    $('#music-count').textContent = '[ ' + N + ' records ]';

    fan.innerHTML = D.catalog.map(function (c, i) {
      return '<li class="rec" data-key="' + catItems[i].key + '"><button class="rec-b" type="button" tabindex="-1" data-i="' + i + '" aria-label="' + esc(c.title) + ', ' + year(c) + '">' +
        '<img alt="" width="520" height="520" decoding="async" draggable="false"><span class="rec-shade"></span></button></li>';
    }).join('');
    var els = $$('.rec', fan), shown = els.map(function () { return false; });
    var imgs = els.map(function (li) { return $('img', li); }), shades = els.map(function (li) { return $('.rec-shade', li); });

    // the years: a button for each, turning to its newest record
    var firstOf = {}, years = [];
    D.catalog.forEach(function (c, i) { if (!(year(c) in firstOf)) { firstOf[year(c)] = i; years.push(year(c)); } });
    $('#orbit-years').innerHTML = years.map(function (y) {
      return '<li><button type="button" data-i="' + firstOf[y] + '">' + y + '</button></li>';
    }).join('');
    var yearBtns = $$('#orbit-years button');

    // stars: two layers that twinkle out of step (seeded, so they stay put)
    (function () {
      var seed = 7;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      ['--stars-a', '--stars-b'].forEach(function (v) {
        var g = [];
        for (var n = 0; n < 30; n++) {
          var r = (0.6 + rnd() * 1.1).toFixed(1), a = (0.35 + rnd() * 0.65).toFixed(2);
          g.push('radial-gradient(' + r + 'px ' + r + 'px at ' + (rnd() * 100).toFixed(1) + '% ' + (rnd() * 70).toFixed(1) + '%, rgba(255,246,220,' + a + ') 99%, transparent 100%)');
        }
        stage.style.setProperty(v, g.join(','));
      });
    })();

    /* the shape: a ball of radius RB with its centre HUB down the stage; the
       covers, S wide, ride a circle of radius R just outside the glass */
    var S, RB, R, HUB, STEP, ARC, MAXA;
    function layout() {
      var W = stage.clientWidth, vh = window.innerHeight, narrow = W <= 820, TOP = narrow ? 54 : 72, GAP = narrow ? 14 : 22;
      if (narrow) { S = Math.round(Math.min(W * 0.46, 230)); RB = Math.round(Math.min(W * 0.47, 250)); }
      else { S = Math.round(Math.max(170, Math.min(W * 0.18, vh * 0.3, 290))); RB = Math.round(Math.max(250, Math.min(W * 0.25, vh * 0.45, 400))); }
      R = RB + GAP + S / 2;
      HUB = Math.round(TOP + S * 0.56 + R);       // the front cover, a little enlarged, tops out at TOP
      STEP = Math.min(0.62 * S / R, 0.44);        // radians from one record to the next
      ARC = R * STEP;                             // pixels a finger moves per record
      MAXA = narrow ? 1.95 : 1.78;
      stage.style.height = Math.round(HUB + (narrow ? 98 : RB * 0.3)) + 'px';
      stage.style.setProperty('--s', S + 'px');
      stage.style.setProperty('--rb', RB + 'px');
      stage.style.setProperty('--hub', HUB + 'px');
      stage.style.setProperty('--stepd', (STEP * 180 / Math.PI).toFixed(3) + 'deg');
      draw();
    }

    /* the wheel is endless, like a jog wheel: after the oldest record comes
       the newest again. pos runs on freely; distances wrap round N */
    var pos = 0, target = null, tau = 0.4, front = -1, raf = 0, last = 0;
    var mod = function (i) { return ((i % N) + N) % N; };
    var wrap = function (d) { d = mod(d); return d > N / 2 ? d - N : d; };

    function draw() {
      for (var i = 0; i < N; i++) {
        var d = wrap(i - pos), th = d * STEP, a = Math.abs(th), el = els[i];
        if (a > MAXA) { if (shown[i]) { el.style.visibility = ''; shown[i] = false; } continue; }
        if (!shown[i]) { el.style.visibility = 'visible'; shown[i] = true; if (!imgs[i].src) imgs[i].src = D.catalog[i].art; }
        var ad = Math.abs(d);
        var sc = 0.62 + 0.2 * (1 - Math.min(1, a / 1.6)) + 0.3 * Math.max(0, 1 - ad);
        el.style.transform = 'translate(' + (R * Math.sin(th)).toFixed(1) + 'px,' + (-R * Math.cos(th)).toFixed(1) + 'px) rotate(' + (th * 57.2958).toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        el.style.zIndex = 200 - Math.round(ad * 4);
        shades[i].style.opacity = Math.min(0.8, ad * 0.17 + Math.max(0, a - 1.25) * 0.9).toFixed(3);
      }
      ticksEl.style.transform = 'rotate(' + (-pos * STEP * 57.2958).toFixed(2) + 'deg)';
      var f = mod(Math.round(pos));
      if (f !== front) showFront(f);
    }

    var when = $('#vision-when'), title = $('#vision-title'), who = $('#vision-who'), link = $('#vision-link'), play = $('#vision-play');
    function showFront(f) {
      if (els[front]) els[front].classList.remove('front');
      front = f;
      els[f].classList.add('front');
      var c = D.catalog[f], cc = COL[c.art] || ['#fcc000', '#7a3cff'];
      stage.style.setProperty('--c1', cc[0]);
      stage.style.setProperty('--c2', cc[1]);
      when.textContent = [year(c), c.kind !== 'Single' ? c.kind : ''].filter(Boolean).join(' · ');
      title.textContent = c.title;
      var others = c.artists.split(/\s*,\s*|\s+&\s+/).filter(function (n) { return n && n !== 'NGHTMRE'; }).join(', ');
      who.textContent = [others && 'with ' + others, c.feat && 'feat. ' + c.feat].filter(Boolean).join(' / ');
      link.href = c.link;
      link.setAttribute('aria-label', 'Listen to ' + c.title + ' in full');
      yearBtns.forEach(function (b) { b.classList.toggle('on', b.textContent === year(c)); });
      dreamSync();
    }

    /* while a record from the wheel plays, the ball beats: with the track's
       own loudness where it was measured (D.env), else a steady pulse */
    var beatRaf = 0;
    function beat() {
      beatRaf = 0;
      var on = cur && !audio.paused && cur.cat != null, v = 0;
      if (on && !still) {
        var e = ENV[cur.trackId];
        if (e) {
          var x = audio.currentTime * 20, i0 = Math.floor(x), fr = x - i0;
          v = ((parseInt(e.charAt(i0), 36) || 0) * (1 - fr) + (parseInt(e.charAt(i0 + 1), 36) || 0) * fr) / 35;
        } else v = 0.5 + 0.5 * Math.sin(performance.now() / 230);
      }
      halo.style.opacity = (0.6 + v * 0.4).toFixed(3);
      halo.style.transform = 'scale(' + (1 + v * 0.09).toFixed(4) + ')';
      if (on) beatRaf = requestAnimationFrame(beat);
    }

    dreamSync = function () {
      var on = cur && !audio.paused, here = on && cur.key === catItems[front].key;
      play.classList.toggle('is-sounding', !!here);
      $('.dp-t', play).textContent = here ? 'Stop' : 'Preview';
      play.setAttribute('aria-label', (here ? 'Stop the preview of ' : 'Play a preview of ') + D.catalog[front].title);
      root.classList.toggle('sounding', !!(on && cur.cat != null));
      if (!beatRaf) beatRaf = requestAnimationFrame(beat);
    };
    function progress() {
      var p = cur && cur.cat != null && audio.duration ? audio.currentTime / audio.duration : 0;
      prog.style.strokeDasharray = (p * 50).toFixed(2) + ' 100';     // the rim fills over the top, horizon to horizon
    }
    audio.addEventListener('timeupdate', progress);
    audio.addEventListener('ended', function () { prog.style.strokeDasharray = '0 100'; });

    /* motion: wherever the wheel is sent it eases there. A flick is sent as far
       as its speed would carry it, to the nearest record, so it spins on and
       comes to rest by itself: no notches */
    function run() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function tick(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      if (target != null) {
        if (still) pos = target; else pos += (target - pos) * (1 - Math.exp(-dt / tau));
        if (Math.abs(target - pos) < 0.0015) { pos = target; target = null; }
      }
      draw();
      if (target != null) raf = requestAnimationFrame(tick);
    }
    function turned() { root.classList.add('turned'); }
    // turn to record i, the short way round
    function go(i) { var base = target != null ? target : Math.round(pos); target = base + wrap(i - base); tau = 0.2; run(); turned(); }
    function step(n) { target = (target != null ? target : Math.round(pos)) + n; tau = 0.17; run(); turned(); }
    dreamNext = function (i) {
      step(1);
      start(catItems[mod(i + 1)], 'wheel');
    };

    // dragging and swiping (up and down stays the page's)
    var down = null, dragging = false, moved = false, samples = [];
    stage.addEventListener('pointerdown', function (e) {
      if (e.button || e.target.closest('.vision a, .vision button, .orb-turn')) return;
      down = { x: e.clientX, y: e.clientY, pos: pos, id: e.pointerId };
      dragging = false; moved = false; samples = [];
    });
    stage.addEventListener('pointermove', function (e) {
      if (!down || e.pointerId !== down.id) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { down = null; return; }
        if (Math.abs(dx) < 6) return;
        dragging = moved = true;
        target = null;
        down.x = e.clientX; down.pos = pos; dx = 0;          // no jump as the drag takes hold
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        stage.classList.add('grabbing');
        turned();
      }
      pos = down.pos - dx / ARC;
      samples.push({ t: e.timeStamp, p: pos });
      while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
      draw();
    });
    function release(e) {
      if (!down || (e && e.pointerId !== down.id)) return;
      down = null;
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('grabbing');
      var v = 0;
      if (samples.length > 1) {
        var a = samples[0], b = samples[samples.length - 1];
        if (b.t > a.t) v = (b.p - a.p) / ((b.t - a.t) / 1000);
      }
      v = Math.max(-45, Math.min(45, v));
      tau = 0.4;
      target = Math.round(pos + v * tau);
      run();
    }
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    // a sideways trackpad swipe turns it; it settles once the fingers stop
    var settle = 0;
    stage.addEventListener('wheel', function (e) {
      var dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (!dx || Math.abs(dx) < Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      target = null;
      pos += dx * (e.deltaMode === 1 ? 16 : 1) / ARC;
      draw();
      turned();
      clearTimeout(settle);
      settle = setTimeout(function () { target = Math.round(pos); tau = 0.16; run(); }, 110);
    }, { passive: false });

    stage.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') step(-1);
      else if (k === 'ArrowRight') step(1);
      else if (k === 'Home') go(0);
      else if (k === 'End') go(N - 1);
      else if ((k === 'Enter' || k === ' ') && e.target === stage) start(catItems[front], 'wheel');
      else return;
      e.preventDefault();
    });

    // a tap on a cover: the front one plays, any other comes to the front
    fan.addEventListener('click', function (e) {
      var b = e.target.closest('.rec-b');
      if (!b || moved) { moved = false; return; }
      var i = +b.dataset.i;
      if (i === front && target == null) start(catItems[i], 'wheel'); else go(i);
    });
    play.addEventListener('click', function () { start(catItems[front], 'wheel'); });
    $('.orb-turn.back', stage).addEventListener('click', function () { step(-1); });
    $('.orb-turn.fwd', stage).addEventListener('click', function () { step(1); });
    $('#orbit-years').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) go(+b.dataset.i);
    });

    var rs = 0;
    window.addEventListener('resize', function () { cancelAnimationFrame(rs); rs = requestAnimationFrame(layout); });
    layout();

    // on arrival the wheel turns into place by itself, so it reads as a wheel
    if ('IntersectionObserver' in window && !still) {
      pos = -3.4; draw();
      var seen = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        seen.disconnect();
        if (!root.classList.contains('turned')) { target = 0; tau = 0.5; run(); }
      }, { threshold: 0.3 });
      seen.observe(stage);
    }
  })();

  // the strip: the newest titles, twice over so it loops
  (function strip() {
    var names = D.catalog.slice(0, 8).map(function (c) { return c.title; });
    var one = names.map(function (n, i) { return '<span>' + esc(n) + '</span><span>' + (i === 5 ? 'out now' : 'new') + '</span>'; }).join('');
    $('#strip-run').innerHTML = one + one;
  })();

  /* ------------------------------------------------------------ video */

  var vFrame = $('#vid-frame'), vList = $('#vid-list'), vMeta = $('#vid-meta'), vCur = -1, vLive = false;

  function showVideo(i, play) {
    var v = D.videos[i];
    if (!v) return;
    vCur = i; vLive = !!play;
    if (play) {
      audio.pause();
      vFrame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(v.id) + '?autoplay=1&rel=0&playsinline=1" title="' + esc(v.title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    } else {
      vFrame.innerHTML = '<button class="vid-poster" type="button" aria-label="Play ' + esc(v.title) + '"><img src="img/v-' + esc(v.id) + '.jpg" alt="" width="960" height="540"><span class="vid-go" aria-hidden="true"></span></button>';
    }
    vMeta.innerHTML = [v.kind, v.with].filter(Boolean).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
    $$('.vid-item', vList).forEach(function (li, n) {
      li.classList.toggle('on', n === i);
      $('button', li).setAttribute('aria-current', n === i ? 'true' : 'false');
    });
  }
  function stopVideo() { if (vLive) showVideo(vCur, false); stopClip(); }

  (function videos() {
    if (!D.videos.length) return;
    $('#video-count').textContent = '[ ' + D.videos.length + ' films ]';
    vList.innerHTML = D.videos.map(function (v, i) {
      return '<li class="vid-item"><button type="button" data-i="' + i + '">' +
        '<span class="vid-n">' + pad(i + 1) + '</span><span class="vid-t"><span>' + esc(v.title) + '</span></span>' +
        (v.with ? '<span class="vid-w">' + esc(v.with) + '</span>' : '') + '</button></li>';
    }).join('');
    vList.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      stopClip();
      showVideo(+b.dataset.i, true);
      if (window.matchMedia('(max-width: 820px)').matches) vFrame.scrollIntoView({ block: 'center' });
    });
    vList.addEventListener('mouseover', function (e) {
      var b = e.target.closest('button');
      if (b && !vLive) showVideo(+b.dataset.i, false);
    });
    vFrame.addEventListener('click', function (e) {
      if (e.target.closest('.vid-poster')) { stopClip(); showVideo(vCur, true); }
    });
    showVideo(0, false);
  })();

  /* ------------------------------------------------------------ clips */

  var clips = D.clips || [], cRun = $('#clips-run'), cOn = -1;

  function clipPoster(i) {
    return '<button class="vid-poster" type="button" aria-label="Play ' + esc(clips[i].title) + '">' +
      '<img src="img/s-' + esc(clips[i].id) + '.webp" alt="" width="360" height="640" loading="lazy" decoding="async"><span class="vid-go" aria-hidden="true"></span></button>';
  }
  function stopClip() {
    if (cOn < 0) return;
    var li = cRun.children[cOn];
    li.classList.remove('on');
    $('.clip-card', li).innerHTML = clipPoster(cOn);
    cOn = -1;
  }
  function playClip(i) {
    if (i === cOn) return;
    stopClip();
    audio.pause();
    if (vLive) showVideo(vCur, false);
    cOn = i;
    var li = cRun.children[i];
    li.classList.add('on');
    $('.clip-card', li).innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(clips[i].id) + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" title="' + esc(clips[i].title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
  }

  (function clipRun() {
    if (!clips.length) { $('#clips').hidden = true; return; }
    $('#clips-count').textContent = '[ ' + clips.length + ' clips ]';
    cRun.innerHTML = clips.map(function (c, i) {
      return '<li class="clip"><div class="torn tall"><div class="clip-card">' + clipPoster(i) + '</div></div>' +
        '<p class="clip-t"><span>' + esc(c.title) + '</span></p></li>';
    }).join('');
    cRun.addEventListener('click', function (e) {
      var b = e.target.closest('.vid-poster');
      if (b) playClip($$('.clip', cRun).indexOf(b.closest('.clip')));
    });
    $$('.clips-b').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = b.classList.contains('fwd') ? 1 : -1;
        cRun.scrollBy({ left: dir * cRun.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
  })();

  /* ------------------------------------------------------------ merch */

  /* The shop is NGHTMRE's Shopify store, nghtmreshop.com. Its public product
     feed gives the live price, sizes and stock; the bag keeps what is picked
     (in this browser only), and Check out opens the store's own checkout with
     those items in it (Shopify's cart link: /cart/<variant>:<qty>,...). If
     the feed cannot be reached the cards just link to the products, as before. */

  var STORE = 'https://nghtmreshop.com', live = {};
  var money = function (n) { return '$' + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n))); };

  $('#merch').innerHTML = D.merch.map(function (m, i) {
    return '<li data-h="' + esc(m.handle) + '"><a href="' + STORE + '/products/' + esc(m.handle) + '" target="_blank" rel="noopener">' +
      '<div class="torn sq"><div class="merch-card"><img src="img/m-' + i + '.webp" alt="" width="640" height="640" loading="lazy" decoding="async"></div></div>' +
      '<p class="merch-t"><span>' + esc(m.title) + '</span><span class="merch-p" aria-hidden="true">&nearr;</span></p></a>' +
      '<div class="merch-buy" hidden></div></li>';
  }).join('');

  var bag = [], bagEl = $('#bag'), bagBtn = $('#bag-btn');
  try { bag = JSON.parse(localStorage.getItem('nght-bag') || '[]') || []; } catch (e) { bag = []; }
  function saveBag() { try { localStorage.setItem('nght-bag', JSON.stringify(bag)); } catch (e) { /* private window */ } }

  function renderBag() {
    // drop anything the live feed says is gone or sold out
    if (Object.keys(live).length) bag = bag.filter(function (b) { var v = live[b.v]; return v && v.available; });
    var n = bag.reduce(function (s, b) { return s + b.q; }, 0);
    var sum = bag.reduce(function (s, b) { return s + b.q * (live[b.v] ? live[b.v].price : b.price); }, 0);
    bagBtn.hidden = !n;
    $('#bag-n').textContent = n;
    $('#bag-sum').textContent = money(sum);
    $('#bag-list').innerHTML = n ? bag.map(function (b, i) {
      return '<li><img src="' + esc(b.img) + '" alt="">' +
        '<span class="bag-t">' + esc(b.title) + (b.size ? '<small>Size ' + esc(b.size) + '</small>' : '') + '</span>' +
        '<span class="bag-p">' + money(b.q * (live[b.v] ? live[b.v].price : b.price)) + '</span>' +
        '<span class="bag-q"><button type="button" data-i="' + i + '" data-d="-1" aria-label="One fewer">&minus;</button><span>' + b.q + '</span>' +
        '<button type="button" data-i="' + i + '" data-d="1" aria-label="One more">+</button>' +
        '<button type="button" class="bag-rm" data-i="' + i + '" data-d="x">Remove</button></span></li>';
    }).join('') : '<li class="bag-empty">Nothing in the bag yet.</li>';
    var go = $('#bag-go');
    go.href = n ? STORE + '/cart/' + bag.map(function (b) { return b.v + ':' + b.q; }).join(',') : STORE;
    go.setAttribute('aria-disabled', String(!n));
    saveBag();
  }
  function openBag(open) {
    bagEl.hidden = !open;
    bagBtn.setAttribute('aria-expanded', String(open));
  }
  bagBtn.addEventListener('click', function () { openBag(bagEl.hidden); });
  $('.bag-x').addEventListener('click', function () { openBag(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openBag(false); });
  document.addEventListener('click', function (e) {
    if (!bagEl.hidden && !e.target.closest('#bag') && !e.target.closest('#bag-btn') && !e.target.closest('.merch-add')) openBag(false);
  });
  $('#bag-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]');
    if (!b) return;
    var it = bag[+b.dataset.i];
    if (b.dataset.d === 'x') bag.splice(+b.dataset.i, 1);
    else { it.q = Math.max(0, Math.min(10, it.q + +b.dataset.d)); if (!it.q) bag.splice(+b.dataset.i, 1); }
    renderBag();
  });
  renderBag();

  function wireItem(li, p) {
    var vs = p.variants.map(function (v) {
      return { id: v.id, size: p.options.length && p.options[0].name !== 'Title' ? v.option1 : '', price: parseFloat(v.price), available: !!v.available };
    });
    vs.forEach(function (v) { live[v.id] = v; });
    var any = vs.some(function (v) { return v.available; }), from = Math.min.apply(null, vs.map(function (v) { return v.price; }));
    var sized = vs.length > 1 || !!vs[0].size;
    $('.merch-p', li).textContent = any ? money(from) : 'Sold out';
    $('.merch-p', li).removeAttribute('aria-hidden');
    li.classList.toggle('sold', !any);
    var buy = $('.merch-buy', li), title = $('.merch-t span', li).textContent, img = $('img', li).getAttribute('src');
    buy.innerHTML = (sized ? '<div class="sizes" role="group" aria-label="Size">' + vs.map(function (v) {
      return '<button type="button" data-v="' + v.id + '" aria-pressed="false"' + (v.available ? '' : ' disabled') + '>' + esc(v.size || v.id) + '</button>';
    }).join('') + '</div>' : '') +
      '<button class="btn y merch-add" type="button"' + (any ? '' : ' disabled') + '>' + (any ? (sized ? 'Pick a size' : 'Add to bag') : 'Sold out') + '</button>';
    buy.hidden = false;
    var pick = sized ? null : vs[0], add = $('.merch-add', buy);
    if (sized) $('.sizes', buy).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', b.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      pick = vs.filter(function (v) { return String(v.id) === b.dataset.v; })[0];
      add.textContent = 'Add to bag';
    });
    add.addEventListener('click', function () {
      if (!pick) { add.textContent = 'Pick a size first'; return; }
      var have = bag.filter(function (b) { return b.v === pick.id; })[0];
      if (have) have.q = Math.min(10, have.q + 1);
      else bag.push({ v: pick.id, q: 1, title: title, size: pick.size, price: pick.price, img: img });
      renderBag();
      add.classList.add('added');
      add.textContent = 'In the bag';
      setTimeout(function () { add.classList.remove('added'); add.textContent = 'Add to bag'; }, 1400);
      bagBtn.classList.remove('bump'); void bagBtn.offsetWidth; bagBtn.classList.add('bump');
      openBag(true);
    });
  }

  if (window.fetch) {
    fetch(STORE + '/products.json?limit=250')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        var by = {};
        (j.products || []).forEach(function (p) { by[p.handle] = p; });
        $$('#merch > li').forEach(function (li) {
          var p = by[li.dataset.h];
          if (p) wireItem(li, p); else li.hidden = true;   // gone from the store
        });
        $('#shop-state').textContent = '[ Live from nghtmreshop.com ]';
        renderBag();
      })
      .catch(function () { /* the cards stay plain links to the store */ });
  }

  /* ------------------------------------------------------------ dial */

  var dial = $('#dial'), wheel = $('.dial-wheel'), spokes = $$('a', wheel), openers = [$('.dock-label'), $('.dock-more')];
  var step = 360 / spokes.length, rot = 0, section = 'top', lastFocus = null;
  spokes.forEach(function (a, i) { a.style.setProperty('--a', (i * step) + 'deg'); });

  function turnTo(sec) {
    var i = spokes.map(function (a) { return a.dataset.sec; }).indexOf(sec);
    if (i < 0) return;
    // the short way round
    var target = -i * step, diff = ((target - rot) % 360 + 540) % 360 - 180;
    rot += diff;
    wheel.style.setProperty('--rot', rot + 'deg');
    spokes.forEach(function (a, n) { a.classList.toggle('on', n === i); });
  }
  function openDial(open) {
    if (open === !dial.hidden) return;
    dial.hidden = !open;
    openers.forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    if (open) { lastFocus = document.activeElement; turnTo(section); $('.dial-x').focus({ preventScroll: true }); }
    else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  openers.forEach(function (b) { b.addEventListener('click', function () { openDial(dial.hidden); }); });
  $('.dial-x').addEventListener('click', function () { openDial(false); });
  spokes.forEach(function (a) {
    a.addEventListener('mouseenter', function () { turnTo(a.dataset.sec); });
    a.addEventListener('focus', function () { turnTo(a.dataset.sec); });
    a.addEventListener('click', function () { openDial(false); });
  });
  wheel.addEventListener('mouseleave', function () { turnTo(section); });
  $$('.dial-foot a').forEach(function (a) { a.addEventListener('click', function () { openDial(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openDial(false); });
  document.addEventListener('click', function (e) {
    if (!dial.hidden && !e.target.closest('#dial') && !e.target.closest('#dock')) openDial(false);
  });

  /* ------------------------------------------------------------ where we are */

  var corners = $$('#nav .corner');
  function setSection(sec) {
    if (sec === section) return;
    section = sec;
    corners.forEach(function (a) { a.classList.toggle('on', a.dataset.sec === sec); });
    if (!dial.hidden) turnTo(sec);
  }

  var secs = $$('[data-sec]').filter(function (el) { return el.tagName === 'SECTION'; });
  var hero = $('.hero'), heroImg = $('.hero-photo img'), scene = $('#scene'), tour = $('#tour'), ticking = false;
  var tixFloat = $('#tix-float'), tixOn = false;

  function onScroll() {
    ticking = false;
    var vh = window.innerHeight, mid = vh * 0.45, found = 'top';
    secs.forEach(function (s) { if (s.id !== 'top' && s.getBoundingClientRect().top <= mid) found = s.dataset.sec; });
    setSection(found);

    // how far the tour sheet has slid over the landing
    var t = tour.getBoundingClientRect().top, hp = Math.min(1, Math.max(0, 1 - t / vh));
    hero.style.setProperty('--hp', hp.toFixed(3));
    document.body.classList.toggle('past-hero', hp > 0.92);

    // tickets follow you down the page once the dates are behind you
    var tb = tour.getBoundingClientRect().bottom, on = hp > 0.92 && tb < vh * 0.5;
    if (on !== tixOn) { tixOn = on; document.body.classList.toggle('show-tix', on); tixFloat.setAttribute('aria-hidden', String(!on)); tixFloat.tabIndex = on ? 0 : -1; }

    // the crowd rises as the stage comes into view
    var r = scene.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) {
      var sp = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
      scene.style.setProperty('--sp', sp.toFixed(3));
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ------------------------------------------------------------ things rise into place */

  var rise = $$('.sec-head > *, .album-art, .album-body, .vid-stage, .connect-in > *, .tour-foot, .scene-copy');
  $$('.merch li').forEach(function (li, i) { li.style.setProperty('--d', (i % 4) * 0.06 + 's'); rise.push(li); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(function (el) { el.setAttribute('data-rise', ''); io.observe(el); });
  }
})();
