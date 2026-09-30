/* Win to Win — home page sections: statement, skills rail, pipeline, industries, showcase, wallet, partner simulator. */
(function () {
  'use strict';
  var W2W = window.W2W || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var ready = W2W.ready || Promise.resolve();
  var sfx = function (n) { if (W2W.sfx) W2W.sfx(n); };
  var onView = function (el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); cb(); } }, opts || { threshold: 0.25 });
    io.observe(el);
  };

  /* keyboard support for tablists */
  function tablist(list, onSelect) {
    var tabs = $$('[role="tab"]', list);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { onSelect(i, true); });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length; tabs[n].focus(); onSelect(n, true);
      });
    });
    return tabs;
  }
  function selectTab(tabs, i) {
    tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.setAttribute('tabindex', on ? '0' : '-1'); });
  }

  ready.then(function () {
    var g = window.gsap, ST = window.ScrollTrigger, anim = !!(g && ST && W2W.animate);
    var desktop = window.matchMedia('(min-width: 1001px)');

    /* ---------- statement: chaos → one brain ---------- */
    var st = $('[data-st]');
    if (st) {
      var cards = $$('.st-card', st), brain = $('.st-brain', st), nEl = $('[data-st-n]', st);
      if (anim) {
        cards.forEach(function (c) {
          var cs = getComputedStyle(c);
          g.set(c, { xPercent: -50, yPercent: -50, x: parseFloat(cs.getPropertyValue('--x')) || 0, y: parseFloat(cs.getPropertyValue('--y')) || 0, rotation: parseFloat(cs.getPropertyValue('--r')) || 0 });
        });
        g.set(brain, { opacity: 0, scale: 0.55, filter: 'blur(10px)' });
        var build = function (tl) {
          tl.to(cards, { x: function (i) { return '+=' + ((i % 2 ? -1 : 1) * 18); }, y: function (i) { return '+=' + ((i % 3 - 1) * 12); }, rotation: function (i) { return '+=' + (i % 2 ? 5 : -5); }, duration: 0.3, ease: 'sine.inOut' }, 0)
            .to(cards, { x: 0, y: 0, rotation: 0, scale: 0.35, opacity: 0, filter: 'blur(6px)', duration: 0.45, stagger: 0.035, ease: 'power3.in' }, 0.3)
            .to(brain, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'back.out(1.4)' }, 0.72)
            .fromTo({ n: 0 }, { n: 0 }, { n: 8, duration: 0.45, ease: 'none', onUpdate: function () { if (nEl) nEl.textContent = Math.round(this.targets()[0].n); } }, 0.3);
          return tl;
        };
        var mm = g.matchMedia();
        mm.add('(min-width: 1001px)', function () {
          var stPin = $('[data-st-pin]', st);
          build(g.timeline({ scrollTrigger: { trigger: stPin, start: function () { return stPin.offsetHeight > window.innerHeight ? 'top top' : 'center center'; }, end: '+=110%', pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true } }));
        });
        mm.add('(max-width: 1000px)', function () {
          var tl = build(g.timeline({ paused: true, defaults: { ease: 'power2.inOut' } }));
          tl.timeScale(0.45);
          ScrollTriggerOnce($('.st-scene', st), function () { tl.play(); });
        });
      } else if (nEl) nEl.textContent = '8';
    }
    function ScrollTriggerOnce(el, cb) { ST.create({ trigger: el, start: 'top 70%', once: true, onEnter: cb }); }

    /* ---------- skills rail ---------- */
    var sk = $('[data-sk]');
    if (sk && anim) {
      var track = $('[data-sk-track]', sk), bar = $('[data-sk-bar]', sk);
      var mm2 = g.matchMedia();
      mm2.add('(min-width: 901px)', function () {
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        g.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: $('[data-sk-pin]', sk), start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (self) { if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')'; } }
        });
      });
      g.from($$('.sk-card', sk).slice(0, 4), { opacity: 0, x: 90, duration: 1.2, stagger: 0.08, ease: 'expo.out', clearProps: 'opacity,transform', scrollTrigger: { trigger: sk, start: 'top 75%', once: true } });
    }

    /* ---------- pipeline ---------- */
    var pl = $('[data-pl]');
    if (pl) {
      var nodes = $$('[data-pl-node]', pl), lines = $$('[data-pl-line]', pl), stateEl = $('[data-pl-state]', pl), trackEl = $('[data-pl-track]', pl);
      var LBL = { ru: ['queued', 'running', 'passed'], uz: ['queued', 'running', 'passed'], en: ['queued', 'running', 'passed'] }[lang] || ['queued', 'running', 'passed'];
      var lastDone = -2;
      var setP = function (p) {
        var n = nodes.length, idx = Math.min(n, Math.floor(p * n + 0.0001));
        nodes.forEach(function (node, i) { node.classList.toggle('is-done', i < idx); node.classList.toggle('is-run', i === idx && p > 0 && p < 1); });
        lines.forEach(function (ln, i) { ln.classList.toggle('is-on', i < idx || (i === n && p >= 1)); });
        trackEl.style.setProperty('--pl-p', Math.min(1, p).toFixed(3));
        if (stateEl) {
          var s = p >= 1 ? 2 : p > 0 ? 1 : 0;
          stateEl.textContent = LBL[s]; stateEl.classList.toggle('is-run', s === 1); stateEl.classList.toggle('is-ok', s === 2);
        }
        if (idx !== lastDone) { if (idx > lastDone && lastDone >= -1 && idx > 0) sfx('tick'); lastDone = idx; }
      };
      if (anim) {
        var mm3 = g.matchMedia();
        mm3.add('(min-width: 1001px)', function () {
          ST.create({ trigger: $('[data-pl-pin]', pl), start: 'top top', end: '+=130%', pin: true, scrub: true, anticipatePin: 1, onUpdate: function (self) { setP(self.progress * 1.02); } });
        });
        mm3.add('(max-width: 1000px)', function () {
          ST.create({ trigger: trackEl, start: 'top 70%', end: 'bottom 45%', scrub: true, onUpdate: function (self) { setP(self.progress * 1.02); } });
        });
      } else setP(1);
    }

    /* ---------- industries ---------- */
    var ind = $('[data-ind]');
    if (ind) {
      var panels = $$('[data-ind-panel]', ind);
      var drawTrend = function (panel) {
        var box = $('.ind-trend', panel), svg = $('.ind-chart', panel);
        if (!box || !svg || svg.childNodes.length) return;
        var vals = box.getAttribute('data-trend').split(',').map(Number);
        var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), decreasing = vals[0] > vals[vals.length - 1];
        var lo = decreasing ? min * 0.8 : 0, span = (max - lo) || 1, w = Math.max(280, Math.round(svg.getBoundingClientRect().width)) || 600, h = 130, pad = 12;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.removeAttribute('preserveAspectRatio');
        var pts = vals.map(function (v, i) { return [pad + i * (w - pad * 2) / (vals.length - 1), h - pad - (v - lo) / span * (h - pad * 2)]; });
        var d = pts.map(function (p, i) {
          if (!i) return 'M' + p[0] + ',' + p[1];
          var pr = pts[i - 1], mx = (pr[0] + p[0]) / 2;
          return 'C' + mx + ',' + pr[1] + ' ' + mx + ',' + p[1] + ' ' + p[0] + ',' + p[1];
        }).join(' ');
        var id = 'ig' + Math.random().toString(36).slice(2, 7);
        var fmt = function (v) { return v >= 1000 ? (v / 1000).toFixed(1).replace('.', lang === 'en' ? '.' : ',') + (lang === 'en' ? 'k' : lang === 'uz' ? '\u00a0ming' : '\u00a0тыс.') : String(v); };
        svg.innerHTML = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0abcf3" stop-opacity=".32"/><stop offset="1" stop-color="#0abcf3" stop-opacity="0"/></linearGradient></defs>' +
          [0.25, 0.5, 0.75].map(function (k) { return '<line class="ic-grid" x1="0" x2="' + w + '" y1="' + (h * k) + '" y2="' + (h * k) + '"/>'; }).join('') +
          '<path class="ic-area" fill="url(#' + id + ')" d="' + d + ' L' + pts[pts.length - 1][0] + ',' + h + ' L' + pts[0][0] + ',' + h + ' Z"/>' +
          '<path class="ic-line" d="' + d + '"/>' +
          '<circle class="ic-dot" r="5" cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '"/>';
        var label = document.createElement('span');
        label.className = 'ind-last'; label.textContent = fmt(vals[vals.length - 1]);
        box.querySelector('.ind-trend-l').appendChild(label);
        var line = $('.ic-line', svg);
        if (line && line.getTotalLength && !reduce) {
          var L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
          line.getBoundingClientRect();
          line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)'; line.style.strokeDashoffset = '0';
        }
      };
      var showInd = function (i) {
        panels.forEach(function (p, k) { p.hidden = k !== i; p.classList.remove('is-in'); });
        var p = panels[i]; void p.offsetWidth; p.classList.add('is-in'); drawTrend(p);
      };
      var itabs = tablist($('[data-ind-tabs]', ind), function (i) { selectTab(itabs, i); showInd(i); sfx('tick'); });
      onView(ind, function () { showInd(0); }, { threshold: 0.2 });
    }

    /* ---------- logos: a glass loupe follows the cursor and magnifies the logo under it ----------
       The loupe is the tile's ::before: the same logo file as a background, scaled by --zoom and positioned
       so that the point under the cursor stays in place (see .lg-tile::before in 09-home.css). */
    var lgRows = $('.lg-rows'), lgCur = null;
    if (lgRows && window.matchMedia('(hover: hover)').matches) {
      /* the loupe trails the cursor a little (lerp in rAF) so it feels like a heavy drop of glass, not a crosshair */
      var lgT = { x: 0, y: 0 }, lgP = { x: 0, y: 0 }, lgRaf = 0;
      var lgStep = function () {
        lgRaf = 0;
        if (!lgCur) return;
        var k = reduce ? 1 : 0.22;
        lgP.x += (lgT.x - lgP.x) * k; lgP.y += (lgT.y - lgP.y) * k;
        lgCur.style.setProperty('--mx', lgP.x.toFixed(1) + 'px');
        lgCur.style.setProperty('--my', lgP.y.toFixed(1) + 'px');
        if (Math.abs(lgT.x - lgP.x) > 0.3 || Math.abs(lgT.y - lgP.y) > 0.3) lgRaf = requestAnimationFrame(lgStep);
      };
      lgRows.addEventListener('pointermove', function (e) {
        var tile = e.target.closest('.lg-tile'); if (!tile) return;
        var r = tile.getBoundingClientRect();
        lgT.x = e.clientX - r.left; lgT.y = e.clientY - r.top;
        if (tile !== lgCur) {
          lgCur = tile;
          var im = $('img', tile), src = im && (im.currentSrc || im.src);
          if (src) tile.style.setProperty('--img', 'url("' + src + '")');
          tile.style.setProperty('--w', r.width.toFixed(1) + 'px');
          tile.style.setProperty('--h', r.height.toFixed(1) + 'px');
          tile.style.setProperty('--lens', Math.round(r.height * 0.9) + 'px');
          lgP.x = lgT.x; lgP.y = lgT.y; /* a new tile: the loupe appears right under the cursor */
        }
        if (!lgRaf) lgRaf = requestAnimationFrame(lgStep);
      });
      lgRows.addEventListener('pointerleave', function () { lgCur = null; });
    }

    /* ---------- showcase: devices ---------- */
    var sc = $('[data-sc]');
    if (sc) {
      var pages = $$('[data-sc-page]', sc), mpages = $$('[data-sc-mpage]', sc), caps = $$('.sc-cap', sc);
      var cur = -1, timer = 0, anims = [], scIn = false, DUR = 9000, frameTimer = 0;
      var cycleFrames = function (i) {
        clearInterval(frameTimer);
        var boxes = [pages[i], mpages[i]].map(function (p) { return p && $('[data-sc-frames]', p); }).filter(Boolean);
        if (!boxes.length) return;
        var n = $$('.sc-frame', boxes[0]).length, k = 0;
        boxes.forEach(function (b) { $$('.sc-frame', b).forEach(function (im, j) { im.classList.toggle('is-on', j === 0); }); });
        if (n < 2 || reduce) return;
        frameTimer = setInterval(function () {
          k = (k + 1) % n;
          boxes.forEach(function (b) { $$('.sc-frame', b).forEach(function (im, j) { im.classList.toggle('is-on', j === k); }); });
        }, Math.round(DUR / n));
      };
      var scrollImg = function (page, dur) {
        var box = $('.sc-scroll', page), img = box && $('img', box);
        if (!img || reduce || !img.animate) return null;
        var run = function () {
          var dist = img.offsetHeight - box.clientHeight;
          if (dist <= 0) return null;
          return img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: 0.08 }, { transform: 'translateY(' + (-dist) + 'px)', offset: 0.92 }, { transform: 'translateY(' + (-dist) + 'px)' }], { duration: dur, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
        };
        if (img.complete && img.naturalHeight) return run();
        img.addEventListener('load', function () { if (page.classList.contains('is-on')) anims.push(run()); }, { once: true });
        return null;
      };
      var show = function (i, user) {
        if (i === cur) return;
        cur = i;
        selectTab(stabs, i);
        pages.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
        mpages.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
        caps.forEach(function (c, k) { c.hidden = k !== i; });
        anims.forEach(function (a) { if (a) a.cancel(); }); anims = [];
        anims.push(scrollImg(pages[i], DUR), scrollImg(mpages[i], DUR));
        cycleFrames(i);
        stabs.forEach(function (t) { t.classList.remove('is-timing'); });
        clearTimeout(timer);
        if (!user && scIn) {
          void stabs[i].offsetWidth; stabs[i].classList.add('is-timing');
          timer = setTimeout(function () { show((cur + 1) % pages.length); }, DUR);
        }
      };
      var stabs = tablist($('[data-sc-tabs]', sc), function (i) { show(i, true); });
      stabs.forEach(function (t) { t.style.setProperty('--sc-dur', DUR + 'ms'); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          scIn = en[0].isIntersecting;
          if (scIn && cur < 0) show(0);
          else if (scIn && !timer) { var c = cur; cur = -1; show(c); }
          if (!scIn) { clearTimeout(timer); timer = 0; clearInterval(frameTimer); }
        }, { threshold: 0.3 }).observe(sc);
      } else show(0);
    }

    /* ---------- wallet passes ---------- */
    var wl = $('[data-wl]');
    if (wl) {
      var passes = $$('[data-wl-pass]', wl), idx = $$('[data-wl-go]', wl), open = 0;
      var stackEl = $('[data-wl-stack]', wl);
      var layoutW = function () {
        /* карман кошелька внизу; закрытые карты стоят в нём стопкой и видны «корешками» по strip px каждая */
        var ph = passes[0].offsetHeight, rest = passes.length - 1, strip = 46, gap = 26, pocketH = 124, tail = 30;
        var pocketTop = ph + gap + rest * strip + tail;
        stackEl.style.height = (pocketTop + pocketH) + 'px';
        stackEl.style.setProperty('--pocket-h', pocketH + 'px');
        var k = 0;
        passes.forEach(function (p, i) {
          if (i === open) { p.style.setProperty('--y0', '0px'); p.style.setProperty('--s', '1'); p.style.zIndex = 20; p.classList.add('is-open'); p.setAttribute('aria-expanded', 'true'); }
          else {
            var y = ph + gap + k * strip;
            p.style.setProperty('--y0', y + 'px'); p.style.setProperty('--s', (0.94 + k * 0.012).toFixed(3)); p.style.zIndex = 10 + k; p.classList.remove('is-open'); p.setAttribute('aria-expanded', 'false');
            k++;
          }
        });
        idx.forEach(function (b, i) { if (i === open) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      };
      var openPass = function (i) { if (i === open) return; open = i; layoutW(); sfx('whoosh'); };
      passes.forEach(function (p, i) { p.addEventListener('click', function () { openPass(i); }); });
      idx.forEach(function (b, i) { b.addEventListener('click', function () { openPass(i); }); });
      window.addEventListener('resize', layoutW);
      /* intro: passes deal in from below */
      passes.forEach(function (p) { p.style.setProperty('--y0', '720px'); p.style.opacity = '0'; });
      onView(wl, function () {
        passes.forEach(function (p, i) { setTimeout(function () { p.style.opacity = '1'; layoutW(); }, reduce ? 0 : 120 * i); });
        if (!reduce) {
          var auto = 0, loop = setInterval(function () {
            if (document.hidden) return;
            auto = (open + 1) % passes.length; openPass(auto);
          }, 4200);
          wl.addEventListener('pointerdown', function () { clearInterval(loop); }, { once: true });
          wl.addEventListener('focusin', function () { clearInterval(loop); }, { once: true });
        }
      }, { threshold: 0.3 });
    }

    /* ---------- partner simulator ---------- */
    var ps = $('[data-ps]');
    if (ps) {
      var sim = $('[data-ps-sim]', ps), range = $('[data-ps-budget]', ps), bOut = $('[data-ps-budget-out]', ps), types = $$('[data-ps-types] [role="radio"]', ps);
      var payEl = $('[data-ps-pay]', ps), rateEl = $('[data-ps-rate]', ps), tEls = $$('[data-ps-t]', ps);
      var money = function (n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' '); };
      var shown = 1800;
      var calc = function () {
        var budget = +range.value, cur = types.filter(function (t) { return t.getAttribute('aria-checked') === 'true'; })[0] || types[2];
        var rates = cur.getAttribute('data-rate').split(',').map(Number), rate = budget >= 20000 ? rates[1] : rates[0];
        var pay = budget * 0.3 * rate / 100;
        bOut.textContent = money(budget);
        rateEl.textContent = rate + '%';
        range.style.setProperty('--fill', ((budget - range.min) / (range.max - range.min) * 100).toFixed(1) + '%');
        tEls.forEach(function (t) { t.textContent = money(pay / 3); });
        var from = shown, t0 = performance.now();
        var tick = function (now) {
          var k = Math.min(1, (now - t0) / 500); k = 1 - Math.pow(1 - k, 3);
          payEl.textContent = money(from + (pay - from) * k);
          if (k < 1) requestAnimationFrame(tick); else shown = pay;
        };
        if (reduce) { payEl.textContent = money(pay); shown = pay; } else requestAnimationFrame(tick);
        sim.classList.remove('is-pulse'); void sim.offsetWidth; sim.classList.add('is-pulse');
      };
      range.addEventListener('input', calc);
      types.forEach(function (t, i) {
        t.addEventListener('click', function () { types.forEach(function (x) { x.setAttribute('aria-checked', String(x === t)); }); calc(); });
        t.addEventListener('keydown', function (e) {
          var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
          e.preventDefault(); var n = types[(i + d + types.length) % types.length]; n.focus(); n.click();
        });
      });
      calc();
    }
  });
})();
