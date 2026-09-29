/* Win to Win — partnership page: payout flow animation + yearly income simulator chart. */
(function () {
  'use strict';
  var W2W = window.W2W || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var money = function (n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' '); };
  var T = ({
    ru: { wait: 'Ждём первый платёж клиента', got: function (i) { return 'Платёж ' + i + ' из 3 получен — выплата отправлена'; }, done: 'Проект оплачен — вся доля у вас', per: function (v) { return '≈ ' + v + ' в месяц в среднем'; }, m: 'мес' },
    uz: { wait: 'Mijozning birinchi to‘lovini kutyapmiz', got: function (i) { return '3 ta to‘lovdan ' + i + '-si olindi — ulush yuborildi'; }, done: 'Loyiha to‘landi — butun ulush sizda', per: function (v) { return 'o‘rtacha oyiga ≈ ' + v; }, m: 'oy' },
    en: { wait: 'Waiting for the client’s first payment', got: function (i) { return 'Payment ' + i + ' of 3 received — your share sent'; }, done: 'Project paid — your full share is out', per: function (v) { return '≈ ' + v + ' per month on average'; }, m: 'mo' }
  })[lang];

  /* ---------- hero: money flow ---------- */
  var flow = $('[data-pt-flow]');
  if (flow) {
    var map = $('[data-pt-map]', flow) || flow, p1 = $('#pt-p1', flow), p2 = $('#pt-p2', flow), totalEl = $('[data-pt-total]', flow), bars = $$('[data-pt-bar]', flow), stepEl = $('[data-pt-step]', flow);
    var mkDot = function (cls, label) { var d = document.createElement('span'); d.className = 'pt-dot ' + cls; d.textContent = label; map.appendChild(d); return d; };
    var along = function (path, dot, dur) {
      return new Promise(function (res) {
        var L = path.getTotalLength(), t0 = performance.now();
        var box = map.getBoundingClientRect(), sx = box.width / 520, sy = box.height / 440;
        (function f(now) {
          var k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          var pt = path.getPointAtLength(L * e);
          dot.style.transform = 'translate(' + (pt.x * sx) + 'px,' + (pt.y * sy) + 'px) translate(-50%,-50%)';
          dot.style.opacity = k < 0.08 ? k / 0.08 : k > 0.92 ? (1 - k) / 0.08 : 1;
          if (k < 1) requestAnimationFrame(f); else res();
        })(t0);
      });
    };
    var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var running = false, visible = false;
    var cycle = function () {
      if (!visible || running) return;
      running = true;
      var total = 0;
      bars.forEach(function (b) { b.classList.remove('is-on'); });
      totalEl.textContent = money(0); stepEl.textContent = T.wait;
      var chain = sleep(600);
      [0, 1, 2].forEach(function (i) {
        chain = chain.then(function () {
          var d1 = mkDot('is-client', money(10000));
          return along(p1, d1, 1400).then(function () { d1.remove(); flow.classList.add('is-pulse'); setTimeout(function () { flow.classList.remove('is-pulse'); }, 500); });
        }).then(function () {
          var d2 = mkDot('is-you', '+' + money(600));
          return along(p2, d2, 1200).then(function () {
            d2.remove(); total += 600; totalEl.textContent = money(total); bars[i].classList.add('is-on'); stepEl.textContent = T.got(i + 1);
            if (W2W.sfx) W2W.sfx('tick');
          });
        }).then(function () { return sleep(700); });
      });
      chain.then(function () { stepEl.textContent = T.done; return sleep(2600); }).then(function () { running = false; cycle(); });
    };
    if (reduce) { totalEl.textContent = money(1800); bars.forEach(function (b) { b.classList.add('is-on'); }); stepEl.textContent = T.done; }
    else if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) (W2W.ready || Promise.resolve()).then(cycle); }, { threshold: 0.3 }).observe(flow);
  }

  /* ---------- simulator ---------- */
  var sim = $('[data-pt-sim]');
  if (sim) {
    var nIn = $('[data-pt-n]', sim), bIn = $('[data-pt-b]', sim), nOut = $('[data-pt-n-out]', sim), bOut = $('[data-pt-b-out]', sim);
    var seg = $('[data-pt-type]', sim), types = $$('[role="radio"]', seg), yearEl = $('[data-pt-year]', sim), perEl = $('[data-pt-per]', sim), svg = $('[data-pt-svg]', sim);
    var shownYear = 0;
    var draw = function (months) {
      var box = svg.getBoundingClientRect(), W = Math.max(300, box.width), H = Math.max(220, box.height), padL = 8, padB = 26, padT = 18;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var cum = [], s = 0; months.forEach(function (v) { s += v; cum.push(s); });
      var maxBar = Math.max.apply(null, months) || 1, maxCum = s || 1;
      var bw = (W - padL * 2) / 12, inner = H - padB - padT;
      var html = '<defs><linearGradient id="ptg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0abcf3"/><stop offset="1" stop-color="#07e7b7"/></linearGradient></defs>';
      [0.25, 0.5, 0.75, 1].forEach(function (k) { html += '<line class="pt-grid" x1="0" x2="' + W + '" y1="' + (padT + inner * (1 - k)) + '" y2="' + (padT + inner * (1 - k)) + '"/>'; });
      months.forEach(function (v, i) {
        var h = v / maxBar * inner * 0.62, x = padL + i * bw + bw * 0.18, w = bw * 0.64;
        html += '<rect class="pt-bar" x="' + x.toFixed(1) + '" y="' + (padT + inner - h).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="5" style="--d:' + (i * 40) + 'ms"/>';
        if (v > 0 && bw >= 30) html += '<text class="pt-val" x="' + (x + w / 2).toFixed(1) + '" y="' + (padT + inner - h - 6).toFixed(1) + '">' + (v >= 1000 ? (v / 1000).toFixed(1).replace('.0', '') + 'k' : Math.round(v)) + '</text>';
        html += '<text class="pt-m" x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 8) + '">' + (i + 1) + '</text>';
      });
      var pts = cum.map(function (v, i) { return [(padL + i * bw + bw / 2).toFixed(1), (padT + inner - v / maxCum * inner).toFixed(1)]; });
      html += '<polyline class="pt-cum" points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '"/>';
      html += '<circle class="pt-cum-dot" r="5" cx="' + pts[11][0] + '" cy="' + pts[11][1] + '"/>';
      html += '<text class="pt-cum-l" x="' + (pts[11][0] - 8) + '" y="' + (+pts[11][1] - 12) + '">' + money(s) + '</text>';
      svg.innerHTML = html;
    };
    var calc = function () {
      var n = +nIn.value, b = +bIn.value;
      var cur = types.filter(function (t) { return t.getAttribute('aria-checked') === 'true'; })[0] || types[2];
      var r = cur.getAttribute('data-rate').split(',').map(Number), rate = (b >= 20000 ? r[1] : r[0]) / 100;
      var tranche = b * 0.3 * rate / 3, months = new Array(12).fill(0);
      [0, 3, 6, 9].forEach(function (start) { [0, 2, 4].forEach(function (off) { var m = start + off; if (m < 12) months[m] += tranche * n; }); });
      var year = months.reduce(function (a, v) { return a + v; }, 0);
      nOut.textContent = n; bOut.textContent = money(b);
      [nIn, bIn].forEach(function (inp) { inp.style.setProperty('--fill', ((inp.value - inp.min) / (inp.max - inp.min) * 100).toFixed(1) + '%'); });
      var from = shownYear, t0 = performance.now();
      (function tick(now) {
        var k = reduce ? 1 : Math.min(1, (now - t0) / 500); k = 1 - Math.pow(1 - k, 3);
        yearEl.textContent = money(from + (year - from) * k);
        if (k < 1) requestAnimationFrame(tick); else shownYear = year;
      })(t0);
      perEl.textContent = T.per(money(year / 12));
      draw(months);
    };
    nIn.addEventListener('input', calc); bIn.addEventListener('input', calc);
    types.forEach(function (t, i) {
      t.addEventListener('click', function () { types.forEach(function (x) { x.setAttribute('aria-checked', String(x === t)); }); if (W2W.placeThumb) W2W.placeThumb(seg); calc(); });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
        e.preventDefault(); var nx = types[(i + d + types.length) % types.length]; nx.focus(); nx.click();
      });
    });
    window.addEventListener('resize', function () { clearTimeout(sim._rt); sim._rt = setTimeout(calc, 150); });
    calc();
  }
})();
