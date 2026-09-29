/* Win to Win — home hero: Company Brain scene.
   Canvas: neural "brain" inside a glass orb + data streams from orbiting sources.
   DOM: orbiting source icons, answer cards feed, live document counter, intro timeline. */
(function () {
  'use strict';
  var W2W = window.W2W || {};
  var stage = document.querySelector('[data-hh-stage]');
  if (!stage) return;
  var hero = stage.closest('[data-hh]');
  var cv = stage.querySelector('[data-hh-cv]');
  var ctx = cv.getContext('2d');
  var orb = stage.querySelector('.hh-orb');
  var srcEls = Array.prototype.slice.call(stage.querySelectorAll('.hh-src li'));
  var feed = stage.querySelector('[data-hh-feed]');
  var qa = Array.prototype.slice.call(stage.querySelectorAll('.hh-qa li'));
  var docsEl = stage.querySelector('[data-hh-docs]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 700;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var S = 0, CW = 0, OFF = 0, cx = 0, cy = 0, orbR = 0;
  var COLORS = ['#f2a007', '#1f6fe0', '#1b8ed9', '#0797c4', '#13874f', '#d6303a', '#8e8e93', '#05b58f'];
  var dark = function () { return document.documentElement.getAttribute('data-theme') === 'dark'; };

  /* ---------- geometry ---------- */
  var N = small ? 300 : 560, PTS = [], LINKS = [];
  (function build() {
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var fold = 1 + 0.08 * Math.sin(x * 9 + y * 5) * Math.cos(z * 7 - y * 3);
      x *= 1.12 * fold; y *= 0.92 * fold; z *= fold;
      if (Math.abs(x) < 0.07) x = (x < 0 ? -1 : 1) * 0.07;
      PTS.push({ b: [x, y, z], x: 0, y: 0, z: 0, c: i % 4 === 0 ? 1 : 0 });
    }
    var seen = {};
    for (i = 0; i < N; i++) {
      var bi = PTS[i].b, b1 = 1e9, b2 = 1e9, j1 = -1, j2 = -1;
      for (var k = 0; k < N; k++) {
        if (k === i) continue;
        var bk = PTS[k].b, dx = bi[0] - bk[0], dy = bi[1] - bk[1], dz = bi[2] - bk[2], d = dx * dx + dy * dy + dz * dz;
        if (d < b1) { b2 = b1; j2 = j1; b1 = d; j1 = k; } else if (d < b2) { b2 = d; j2 = k; }
      }
      [j1, j2].forEach(function (j) { if (j < 0) return; var key = i < j ? i + '_' + j : j + '_' + i; if (!seen[key]) { seen[key] = 1; LINKS.push([i, j]); } });
    }
  })();

  /* two tilted orbits for the sources */
  var ORB = srcEls.map(function (el, i) {
    var ring = i % 2;
    return { el: el, ring: ring, a0: (i / srcEls.length) * Math.PI * 2 + 0.3, x: 0, y: 0, z: 0, col: COLORS[i % COLORS.length] };
  });
  var STREAMS = [];
  ORB.forEach(function (o, i) { for (var k = 0; k < (small ? 3 : 5); k++) STREAMS.push({ s: i, t: Math.random(), v: 0.18 + Math.random() * 0.22, bend: (Math.random() - 0.5) * 0.6 }); });
  var waves = [];

  function layout() {
    S = stage.clientWidth;
    CW = S * 1.24; OFF = S * 0.12;
    cv.width = Math.round(CW * DPR); cv.height = Math.round(CW * DPR);
    cx = OFF + S / 2; cy = OFF + S * 0.48;
    orbR = orb ? orb.offsetWidth / 2 : S * 0.21;
  }

  /* ---------- frame ---------- */
  var t0 = performance.now(), last = t0, running = false, inView = true, raf = 0, par = { x: 0, y: 0, tx: 0, ty: 0 };
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var t = (now - t0) / 1000;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, CW, CW);
    var dk = dark();

    /* orbit guide */
    var rx = S * (window.innerWidth < 560 ? 0.39 : 0.47), ry = S * 0.17, tilt = -0.12; /* phones: keep icons and labels inside the screen */
    ctx.lineWidth = 1;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
    ctx.strokeStyle = dk ? 'rgba(127,224,255,0.16)' : 'rgba(10,120,170,0.16)';
    ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    /* sources evenly spaced on one tilted orbit */
    var ct = Math.cos(tilt), stt = Math.sin(tilt);
    ORB.forEach(function (o) {
      var a = o.a0 + t * 0.12;
      var ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      var x = ex * ct - ey * stt, y = ex * stt + ey * ct;
      o.z = Math.sin(a); o.x = x; o.y = y;
      var sc = 0.72 + 0.36 * (o.z + 1) / 2;
      o.el.style.transform = 'translate3d(' + (x + par.x * 10 * sc).toFixed(1) + 'px,' + (y + par.y * 10 * sc).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
      o.el.style.opacity = (0.45 + 0.55 * (o.z + 1) / 2).toFixed(3);
      var back = o.z < -0.2;
      if (back !== o.back) { o.back = back; o.el.classList.toggle('is-back', back); }
    });

    ctx.globalCompositeOperation = dk ? 'lighter' : 'source-over';

    /* data streams: source → orb */
    STREAMS.forEach(function (st) {
      var o = ORB[st.s];
      st.t += dt * st.v; if (st.t > 1) st.t -= 1;
      var sx = cx + o.x, sy = cy + o.y, ex = cx, ey = cy;
      var mx = (sx + ex) / 2 + (ey - sy) * st.bend, my = (sy + ey) / 2 - (ex - sx) * st.bend;
      var u = st.t, iu = 1 - u;
      var px = iu * iu * sx + 2 * iu * u * mx + u * u * ex, py = iu * iu * sy + 2 * iu * u * my + u * u * ey;
      var dd = Math.hypot(px - cx, py - cy);
      if (dd < orbR * 0.95) return;
      var fade = Math.sin(u * Math.PI) * (o.z < -0.15 ? 0.35 : 1);
      ctx.globalAlpha = fade * 0.9;
      ctx.fillStyle = o.col;
      ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = fade * 0.25;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.2832); ctx.fill();
    });
    ctx.globalAlpha = 1;

    /* brain inside the orb */
    var R = orbR * 0.62, rotY = t * 0.45, rotX = 0.3 + Math.sin(t * 0.4) * 0.12;
    var cY = Math.cos(rotY), sY = Math.sin(rotY), cX = Math.cos(rotX), sX = Math.sin(rotX), fov = R * 3.4;
    var bcx = cx + par.x * 4, bcy = cy + par.y * 4;
    for (var i = 0; i < N; i++) {
      var p = PTS[i], b = p.b, x0 = b[0] * R, y0 = b[1] * R, z0 = b[2] * R;
      var x1 = x0 * cY + z0 * sY, z1 = -x0 * sY + z0 * cY, y1 = y0 * cX - z1 * sX, z2 = y0 * sX + z1 * cX, ps = fov / (fov - z2);
      p.x = bcx + x1 * ps; p.y = bcy + y1 * ps; p.z = (z2 / R + 1) / 2;
    }
    ctx.lineWidth = 0.7;
    for (var bucket = 0; bucket < 2; bucket++) {
      ctx.beginPath();
      for (var l = 0; l < LINKS.length; l++) {
        var A = PTS[LINKS[l][0]], B = PTS[LINKS[l][1]], z = Math.min(A.z, B.z);
        if ((bucket === 0 && z >= 0.5) || (bucket === 1 && z < 0.5)) continue;
        ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
      }
      ctx.strokeStyle = dk ? (bucket ? 'rgba(90,210,255,0.38)' : 'rgba(90,210,255,0.12)') : (bucket ? 'rgba(4,110,160,0.42)' : 'rgba(4,110,160,0.12)');
      ctx.stroke();
    }
    for (var pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? (dk ? '#3ff2cc' : '#05b58f') : (dk ? '#4fd8ff' : '#0797c4');
      for (i = 0; i < N; i++) {
        var q = PTS[i]; if (q.c !== pass) continue;
        ctx.globalAlpha = 0.2 + q.z * 0.8;
        var s = 0.7 + q.z * 1.5;
        ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;

    /* answer waves from the orb */
    waves = waves.filter(function (w) { return t - w < 1.4; });
    waves.forEach(function (w) {
      var k = (t - w) / 1.4;
      ctx.strokeStyle = 'rgba(10,188,243,' + (0.5 * (1 - k)).toFixed(3) + ')';
      ctx.lineWidth = 2 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, orbR * (1 + k * 0.9), 0, 6.2832); ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';

    /* parallax easing */
    par.x += (par.tx - par.x) * 0.06; par.y += (par.ty - par.y) * 0.06;
    if (orb) orb.style.transform = 'translate3d(' + (par.x * 6).toFixed(2) + 'px,' + (par.y * 6).toFixed(2) + 'px,0)';

    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduce) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function sync() { if (inView && !document.hidden) start(); else stop(); }

  /* ---------- answer feed ---------- */
  var qi = 0, feedT = 0;
  function pushCard() {
    if (!feed || !qa.length) return;
    var src = qa[qi % qa.length]; qi++;
    var card = document.createElement('div');
    card.className = 'hh-card';
    var ic = document.createElement('span'); ic.className = 'app-icon ic-5';
    ic.innerHTML = '<svg><use href="#' + (src.getAttribute('data-ic') || 'i-sparkle') + '"/></svg>';
    card.appendChild(ic);
    ['b', 'span', 'small'].forEach(function (tag) {
      var from = src.querySelector(tag); if (!from) return;
      var el = document.createElement(tag); el.textContent = from.textContent; card.appendChild(el);
    });
    feed.appendChild(card);
    var cards = feed.querySelectorAll('.hh-card:not(.is-out)');
    if (cards.length > 2) {
      var old = cards[0]; old.classList.add('is-out');
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 460);
    }
    waves.push((performance.now() - t0) / 1000);
    if (W2W.sfx && inView) W2W.sfx('pop');
  }
  function feedLoop() {
    clearTimeout(feedT);
    if (inView && !document.hidden) pushCard();
    feedT = setTimeout(feedLoop, 3400);
  }

  /* ---------- live counter ---------- */
  var docs = 12480;
  setInterval(function () {
    if (!inView || document.hidden || !docsEl) return;
    docs += 1 + Math.floor(Math.random() * 3);
    docsEl.textContent = docs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, document.documentElement.lang === 'en' ? ',' : '\u00a0');
  }, 2200);

  /* ---------- pointer parallax ---------- */
  if (hero && W2W.fine && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    hero.addEventListener('pointerleave', function () { par.tx = 0; par.ty = 0; });
  }

  layout();
  if (window.ResizeObserver) new ResizeObserver(function () { layout(); if (!running) frame(performance.now()); }).observe(stage);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(stage);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('w2w:theme', function () { if (!running) frame(performance.now()); });

  /* ---------- intro ---------- */
  var ready = W2W.ready || Promise.resolve();
  ready.then(function () {
    var g = window.gsap;
    if (!g || reduce || !W2W.animate) {
      frame(performance.now()); sync(); feedLoop();
      return;
    }
    var copy = hero.querySelector('[data-hh-copy]');
    var title = copy.querySelector('.hh-title');
    var words = W2W.splitWords ? W2W.splitWords(title) : [title];
    g.set(words, { opacity: 0, y: '0.4em', filter: 'blur(12px)' });
    var tl = g.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(copy.querySelector('.hh-pill'), { opacity: 1, y: 0, duration: 0.9 }, 0)
      .to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.08 }, 0.1)
      .to([copy.querySelector('.hh-lead'), copy.querySelector('.hh-cta'), copy.querySelector('.hh-meta')], { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.45)
      .fromTo(stage, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.6 }, 0.25)
      .fromTo(srcEls, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.08 }, 0.9)
      .add(function () { feedLoop(); }, 1.3);
    g.set([copy.querySelector('.hh-pill'), copy.querySelector('.hh-lead'), copy.querySelector('.hh-cta'), copy.querySelector('.hh-meta')], { y: 18 });
    frame(performance.now()); sync();
    /* scroll: copy drifts up, scene zooms slightly */
    if (window.ScrollTrigger && window.innerWidth > 1000) {
      g.to(copy, { y: -80, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      g.to(stage, { y: 60, scale: 1.04, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
  });
})();
