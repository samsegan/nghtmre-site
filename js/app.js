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
    $('#hero-span').innerHTML = y1 === y2 ? String(y1) : y1 + ' &mdash; ' + y2;

    // the next show, on the landing
    var n = shows[0], d0 = day(n.start), left = Math.round((d0 - today) / 864e5);
    var when = left <= 0 ? 'On now' : left === 1 ? 'Tomorrow' : 'In ' + left + ' days';
    var next = $('#hero-next');
    next.href = 'https://link.seated.com/' + n.id;
    next.target = '_blank'; next.rel = 'noopener';
    $('.next-k', next).innerHTML = 'Next show &middot; ' + when;
    $('.next-v', next).innerHTML = range(d0, day(n.end || n.start)) + ' &mdash; ' + esc(n.place.split(',')[0]);
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
    $('#dream').hidden = true;
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

  /* ------------------------------------------------------------ the dream wheel */

  (function dream() {
    if (GRID || !D.catalog.length) return;
    var root = $('#dream'), stage = $('#dream-stage'), wheel = $('#dream-wheel'), rim = $('#dream-rim');
    var swirl = $('#dream-swirl'), arm = $('#dream-arm'), N = D.catalog.length;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var year = function (c) { return c.date.slice(0, 4); };

    $('#music-count').textContent = '[ ' + N + ' records ]';

    wheel.innerHTML = D.catalog.map(function (c, i) {
      return '<li class="dr" data-key="' + catItems[i].key + '"><button class="dr-b" type="button" tabindex="-1" data-i="' + i + '" aria-label="' + esc(c.title) + ', ' + year(c) + '">' +
        '<img alt="" width="520" height="520" decoding="async" draggable="false"></button></li>';
    }).join('');
    var els = $$('.dr', wheel), imgs = els.map(function (li) { return $('img', li); }), shown = els.map(function () { return false; });

    // the years: on the rim where each one starts, and as buttons under the wheel
    var firstOf = {}, years = [];
    D.catalog.forEach(function (c, i) { if (!(year(c) in firstOf)) { firstOf[year(c)] = i; years.push(year(c)); } });
    rim.innerHTML = '<span class="rim-ring"></span>' + D.catalog.map(function (c, i) {
      var first = firstOf[year(c)] === i;
      return '<span class="rim-t' + (first ? ' y' : '') + '" style="--i:' + i + '">' + (first ? '<b>' + year(c) + '</b>' : '') + '</span>';
    }).join('');
    $('#dream-years').innerHTML = years.map(function (y) {
      return '<li><button type="button" data-i="' + firstOf[y] + '">' + y + '</button></li>';
    }).join('');
    var yearBtns = $$('#dream-years button');

    // the hypnotic spiral: one arm; the dark between its turns is the other
    (function () {
      var turns = 4.5, k = 100 / (turns * 2 * Math.PI), pts = [];
      for (var a = 0; a <= turns * 2 * Math.PI; a += 0.05) pts.push((k * a * Math.cos(a)).toFixed(2) + ',' + (k * a * Math.sin(a)).toFixed(2));
      arm.innerHTML = '<polyline points="' + pts.join(' ') + '" fill="none" stroke="currentColor" stroke-width="' + (Math.PI * k).toFixed(2) + '"/>';
    })();

    // stars: two layers that twinkle out of step (seeded, so they stay put)
    (function () {
      var seed = 7;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      ['--stars-a', '--stars-b'].forEach(function (v) {
        var g = [];
        for (var n = 0; n < 34; n++) {
          var r = (0.6 + rnd() * 1.1).toFixed(1), a = (0.35 + rnd() * 0.65).toFixed(2);
          g.push('radial-gradient(' + r + 'px ' + r + 'px at ' + (rnd() * 100).toFixed(1) + '% ' + (rnd() * 62).toFixed(1) + '%, rgba(255,246,220,' + a + ') 99%, transparent 100%)');
        }
        stage.style.setProperty(v, g.join(','));
      });
    })();

    /* the shape: covers S wide on a circle of radius R round a hub near the
       bottom; the front cover's top sits TOP below the stage's top */
    var S, R, TOP, HUB, STEP, ARC;
    function layout() {
      var W = stage.clientWidth, narrow = window.matchMedia('(max-width: 820px)').matches;
      if (narrow) {
        S = Math.round(Math.min(W * 0.5, 250));
        R = Math.round(W * 0.95);
        TOP = 58;
        HUB = TOP + S / 2 + R;
        stage.style.height = Math.round(HUB + 96) + 'px';   // room under the words for the ball
      } else {
        stage.style.height = '';
        var H = stage.clientHeight;
        TOP = 78;
        S = Math.round(Math.max(170, Math.min(W * 0.19, H * 0.33, 310)));
        R = Math.round(Math.max(S * 1.5, Math.min(W * 0.4, H - TOP - S / 2 - 6)));
        HUB = TOP + S / 2 + R;
      }
      STEP = Math.min(0.6 * S / R, 0.42);       // radians from one record to the next
      ARC = R * STEP;                           // pixels a finger moves per record
      var rr = R + S * 0.6 + 8;
      stage.style.setProperty('--s', S + 'px');
      stage.style.setProperty('--top', TOP + 'px');
      stage.style.setProperty('--hub', HUB + 'px');
      stage.style.setProperty('--rr', rr + 'px');
      stage.style.setProperty('--b', Math.round(narrow ? 118 : Math.max(96, Math.min(R * 0.36, 210))) + 'px');
      stage.style.setProperty('--stepd', (STEP * 180 / Math.PI) + 'deg');
      draw();
    }

    /* the wheel is endless, like a jog wheel: after the oldest record comes
       the newest again. pos runs on freely; distances wrap round N */
    var pos = 0, vel = 0, target = null, front = -1, raf = 0, last = 0;
    var mod = function (i) { return ((i % N) + N) % N; };
    var wrap = function (d) { d = mod(d); return d > N / 2 ? d - N : d; };
    var ticks = $$('.rim-t', rim), ring = $('.rim-ring', rim), tickOn = ticks.map(function () { return false; });

    function draw() {
      for (var i = 0; i < N; i++) {
        var d = wrap(i - pos), th = d * STEP, a = Math.abs(th), el = els[i];
        if (a > 1.72) { if (shown[i]) { el.style.visibility = ''; shown[i] = false; } continue; }
        if (!shown[i]) { el.style.visibility = 'visible'; shown[i] = true; }
        if (!imgs[i].src) imgs[i].src = D.catalog[i].art;
        var ad = Math.abs(d), sink = Math.min(1, a / 1.6);
        var sc = (1 - 0.44 * sink) * (1 + 0.08 * Math.max(0, 1 - ad));
        el.style.transform = 'translate(' + (R * Math.sin(th)).toFixed(1) + 'px,' + (-R * Math.cos(th)).toFixed(1) + 'px) rotate(' + (th * 57.2958).toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        el.style.zIndex = 200 - Math.round(ad * 4);
        el.style.setProperty('--dim', Math.min(0.78, ad * 0.2).toFixed(3));
        el.style.setProperty('--bl', (Math.round(Math.max(0, ad - 0.55) * 3) / 2) + 'px');
      }
      // the rim: a tick per record, the year where each year starts
      var rr = R + S * 0.6 + 8;
      for (var t = 0; t < N; t++) {
        var tt = wrap(t - pos) * STEP, on = Math.abs(tt) < 1.62;
        if (on !== tickOn[t]) { ticks[t].style.visibility = on ? 'visible' : ''; tickOn[t] = on; }
        if (on) ticks[t].style.transform = 'rotate(' + (tt * 57.2958).toFixed(2) + 'deg) translateY(' + (-rr - (ticks[t].classList.contains('y') ? 19 : 12)) + 'px)';
      }
      var deg = -pos * STEP * 57.2958;
      ring.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
      swirl.style.transform = 'rotate(' + (deg * 1.6).toFixed(2) + 'deg)';
      var f = mod(Math.round(pos));
      if (f !== front) showFront(f);
    }

    var when = $('#dream-when'), title = $('#dream-title'), who = $('#dream-who'), link = $('#dream-link'), play = $('#dream-play');
    var back = $('.dream-turn.back', stage), fwd = $('.dream-turn.fwd', stage);
    function showFront(f) {
      if (els[front]) els[front].classList.remove('front');
      front = f;
      els[f].classList.add('front');
      var c = D.catalog[f];
      when.textContent = [year(c), c.kind !== 'Single' ? c.kind : ''].filter(Boolean).join(' · ');
      title.textContent = c.title;
      var others = c.artists.split(/\s*,\s*|\s+&\s+/).filter(function (n) { return n && n !== 'NGHTMRE'; }).join(', ');
      who.textContent = [others && 'with ' + others, c.feat && 'feat. ' + c.feat].filter(Boolean).join(' / ');
      link.href = c.link;
      link.setAttribute('aria-label', 'Listen to ' + c.title + ' in full');
      yearBtns.forEach(function (b) { b.classList.toggle('on', b.textContent === year(c)); });
      dreamSync();
    }

    dreamSync = function () {
      var on = cur && !audio.paused && cur.key === catItems[front].key;
      play.classList.toggle('dream-playing', !!on);
      $('.dp-t', play).textContent = on ? 'Stop' : 'Preview';
      play.setAttribute('aria-label', (on ? 'Stop the preview of ' : 'Play a preview of ') + D.catalog[front].title);
    };

    /* motion: a spring pulls the wheel onto a record; a flick carries on
       with the speed it was given and comes to rest on the nearest one */
    function run() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function tick(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      if (target != null) {
        if (still) { pos = target; vel = 0; }
        else {
          var k = 70, c = 2 * Math.sqrt(k) * 0.95;
          vel += (k * (target - pos) - c * vel) * dt;
          pos += vel * dt;
        }
        if (Math.abs(target - pos) < 0.0015 && Math.abs(vel) < 0.02) { pos = target; vel = 0; target = null; }
      }
      draw();
      if (target != null) raf = requestAnimationFrame(tick);
    }
    // turn to record i, the short way round
    function go(i) { var base = target != null ? target : Math.round(pos); target = base + wrap(i - base); run(); turned(); }
    function step(n) { target = (target != null ? target : Math.round(pos)) + n; run(); turned(); }
    dreamNext = function (i) {
      step(1);
      start(catItems[mod(i + 1)], 'wheel');
    };

    function turned() { root.classList.add('turned'); }

    // dragging and swiping (up and down stays the page's)
    var down = null, dragging = false, moved = false, samples = [];
    stage.addEventListener('pointerdown', function (e) {
      if (e.button || e.target.closest('.dream-now a, .dream-now button, .dream-turn')) return;
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
        target = null; vel = 0;
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        stage.classList.add('grabbing');
        turned();
      }
      var p = down.pos - dx / ARC;
      pos = p;
      samples.push({ t: e.timeStamp, p: p });
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
      v = Math.max(-40, Math.min(40, v));
      vel = v;
      target = Math.round(pos + v * 0.32);
      run();
    }
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    // a sideways trackpad swipe turns it; settles once the fingers stop
    var settle = 0;
    stage.addEventListener('wheel', function (e) {
      var dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (!dx || Math.abs(dx) < Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      target = null; vel = 0;
      pos += dx * (e.deltaMode === 1 ? 16 : 1) / ARC;
      draw();
      turned();
      clearTimeout(settle);
      settle = setTimeout(function () { target = Math.round(pos); run(); }, 110);
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
    wheel.addEventListener('click', function (e) {
      var b = e.target.closest('.dr-b');
      if (!b || moved) { moved = false; return; }
      var i = +b.dataset.i;
      if (i === front && target == null) start(catItems[i], 'wheel'); else go(i);
    });
    play.addEventListener('click', function () { start(catItems[front], 'wheel'); });
    back.addEventListener('click', function () { step(-1); });
    fwd.addEventListener('click', function () { step(1); });
    $('#dream-years').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) go(+b.dataset.i);
    });

    var rs = 0;
    window.addEventListener('resize', function () { cancelAnimationFrame(rs); rs = requestAnimationFrame(layout); });
    layout();

    // on arrival the wheel turns into place by itself, so it reads as a wheel
    if ('IntersectionObserver' in window && !still) {
      pos = -3.6; draw();
      var seen = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        seen.disconnect();
        if (!root.classList.contains('turned')) { target = 0; run(); }
      }, { threshold: 0.35 });
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

  function onScroll() {
    ticking = false;
    var vh = window.innerHeight, mid = vh * 0.45, found = 'top';
    secs.forEach(function (s) { if (s.id !== 'top' && s.getBoundingClientRect().top <= mid) found = s.dataset.sec; });
    setSection(found);

    // how far the tour sheet has slid over the landing
    var t = tour.getBoundingClientRect().top, hp = Math.min(1, Math.max(0, 1 - t / vh));
    heroImg.style.setProperty('--hp', hp.toFixed(3));
    document.body.classList.toggle('past-hero', hp > 0.92);

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
