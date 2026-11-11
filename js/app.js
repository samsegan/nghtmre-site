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
  var cur = null, retried = false;
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
    var lab = on ? 'Stop the preview' : 'Play a preview';
    $('.dock-play').setAttribute('aria-label', lab);
    $('.dial-play').setAttribute('aria-label', lab);
  }

  function start(item) {
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
    // run on through the album
    if (cur && cur.album != null && albumItems[cur.album + 1]) start(albumItems[cur.album + 1]);
  });

  function toggleMain() { start(cur || albumItems[0] || catItems[0]); }
  $('.dock-play').addEventListener('click', toggleMain);
  $('.dial-play').addEventListener('click', toggleMain);

  /* ------------------------------------------------------------ music */

  var albumItems = D.album.tracks.map(function (t, i) {
    return { key: 't' + t.trackId, title: t.title, artists: t.artists, preview: t.preview, trackId: t.trackId, link: D.album.link, album: i };
  });
  var catItems = D.catalog.map(function (c) {
    // a record that is on the album shares its key with the album track, so both light up
    var same = albumItems.filter(function (a) { return a.trackId === c.trackId; })[0];
    return same || { key: 'c' + c.id, title: c.title, artists: c.artists, preview: c.preview, trackId: c.trackId, link: c.link };
  });

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
      if (b) start(albumItems[+b.dataset.album]);
    });
  })();

  (function catalog() {
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
      if (b) start(catItems[+b.dataset.i]);
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
  function stopVideo() { if (vLive) showVideo(vCur, false); }

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
      showVideo(+b.dataset.i, true);
      if (window.matchMedia('(max-width: 820px)').matches) vFrame.scrollIntoView({ block: 'center' });
    });
    vList.addEventListener('mouseover', function (e) {
      var b = e.target.closest('button');
      if (b && !vLive) showVideo(+b.dataset.i, false);
    });
    vFrame.addEventListener('click', function (e) {
      if (e.target.closest('.vid-poster')) showVideo(vCur, true);
    });
    showVideo(0, false);
  })();

  /* ------------------------------------------------------------ merch */

  $('#merch').innerHTML = D.merch.map(function (m, i) {
    return '<li><a href="https://nghtmreshop.com/products/' + esc(m.handle) + '" target="_blank" rel="noopener">' +
      '<div class="torn sq"><div class="merch-card"><img src="img/m-' + i + '.webp" alt="" width="640" height="640" loading="lazy" decoding="async"></div></div>' +
      '<p class="merch-t"><span>' + esc(m.title) + '</span><span aria-hidden="true">&nearr;</span></p></a></li>';
  }).join('');

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
