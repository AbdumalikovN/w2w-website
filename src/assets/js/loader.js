/* Win to Win — boot loader: «Company Brain boot sequence».
   Once per browser session (sessionStorage 'w2w-boot'), ≈5 s, 0–100 %.
   Data streams in from the edges → spells «AI» → assembles a rotating neural "brain" → morphs into the W mark → portal reveal. */
(function () {
  'use strict';
  var h = document.documentElement;
  var el = document.getElementById('boot');
  var resolveBoot;
  window.W2WBootReady = new Promise(function (r) { resolveBoot = r; });
  function bootDone() { if (resolveBoot) { resolveBoot(); resolveBoot = null; } }
  if (!el) { bootDone(); return; }
  if (!h.classList.contains('boot')) { el.parentNode.removeChild(el); bootDone(); return; }
  try { sessionStorage.setItem('w2w-boot', '1'); } catch (e) { /* private mode */ }

  var lang = (h.getAttribute('lang') || 'ru').slice(0, 2);
  var DICT = {
    ru: ['Инициализация ядра W2W', 'Загружаем AI-модели и подключаем источники: 1С · amoCRM · Telegram · почта', 'Индексируем документы', 'Строим граф знаний: люди · клиенты · проекты', 'Проверяем права доступа', 'Калибруем ответы по источникам', 'Company Brain готов'],
    uz: ['W2W yadrosi ishga tushmoqda', 'AI modellari yuklanmoqda, manbalar ulanmoqda: 1C · amoCRM · Telegram · pochta', 'Hujjatlar indekslanmoqda', 'Bilimlar grafi qurilmoqda: odamlar · mijozlar · loyihalar', 'Kirish huquqlari tekshirilmoqda', 'Javoblar manbalar bo‘yicha sozlanmoqda', 'Company Brain tayyor'],
    en: ['Initialising the W2W core', 'Loading AI models, connecting sources: 1C · amoCRM · Telegram · email', 'Indexing documents', 'Building the knowledge graph: people · clients · projects', 'Checking access rights', 'Calibrating answers against sources', 'Company Brain is ready']
  };
  var LOG = DICT[lang] || DICT.ru;
  var LOG_AT = [0, 10, 26, 45, 62, 78, 97];

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = el.querySelector('canvas');
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var numEl = el.querySelector('[data-boot-num]');
  var barEl = el.querySelector('[data-boot-bar]');
  var logEl = el.querySelector('[data-boot-log]');
  var stat = {};
  Array.prototype.forEach.call(el.querySelectorAll('[data-boot-stat]'), function (s) { stat[s.getAttribute('data-boot-stat')] = s; });
  var skipBtn = el.querySelector('[data-boot-skip]');

  var W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
  var small = Math.min(window.innerWidth, window.innerHeight) < 640;
  var N = small ? 620 : 1250;
  var P = [], LINKS = [], PULSES = [];
  var t0 = performance.now(), prog = 0, logged = 0, exiting = false, exitStart = 0, finished = false, skip = false;
  var fmt = function (n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, (document.documentElement.lang || 'ru').slice(0, 2) === 'en' ? ',' : '\u2009'); };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var eOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eIO = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* progress keyframes: [seconds, percent] — plateaus make it feel like real work */
  var KF = [[0, 0], [0.35, 4], [0.9, 17], [1.35, 24], [1.75, 38], [2.25, 49], [2.7, 57], [3.2, 70], [3.6, 79], [4.05, 90], [4.4, 96], [4.7, 100]];
  function timeline(t) {
    if (t >= KF[KF.length - 1][0]) return 100;
    for (var i = 1; i < KF.length; i++) {
      if (t < KF[i][0]) {
        var a = KF[i - 1], b = KF[i], k = (t - a[0]) / (b[0] - a[0]);
        k = k * k * (3 - 2 * k);
        return a[1] + (b[1] - a[1]) * k;
      }
    }
    return 100;
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    if (!cv) return;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }

  /* ---------- geometry ---------- */
  var P1 = 'M475.92,558.01l18.53-17.94s18.25,106.28,62.54,123.07c44.29,16.79,54.72-110.94,54.72-110.94l7.23-136.7,141.05-141.05s-28.68,508.29-151.48,530.89c0,0-64.87,12.17-106.6-148.28l-26.08-99.05h.08Z';
  var P2 = 'M344.75,612.26l14.46-14.03s14.26,83.01,48.83,96.13c34.61,13.12,42.75-86.6,42.75-86.6l5.65-106.75,110.15-110.15s-22.4,396.91-118.29,414.53c0,0-50.65,9.48-83.21-115.8l-20.35-77.36v.04Z';
  /* particles first spell "AI": sample the word from an offscreen canvas (normalized: x in [-0.5, 0.5]) */
  function sampleAI() {
    var pts = [];
    try {
      var oc = document.createElement('canvas'), o = oc.getContext('2d'), fnt = '800 220px Onest, "SF Pro Display", Inter, system-ui, sans-serif';
      oc.width = 560; oc.height = 260;
      o.font = fnt; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
      o.fillText('AI', oc.width / 2, oc.height / 2 + 8);
      var d = o.getImageData(0, 0, oc.width, oc.height).data, minX = oc.width, maxX = 0;
      for (var y = 0; y < oc.height; y += 3) for (var x = 0; x < oc.width; x += 3) {
        if (d[(y * oc.width + x) * 4 + 3] > 120) { pts.push([x, y]); if (x < minX) minX = x; if (x > maxX) maxX = x; }
      }
      var tw = Math.max(1, maxX - minX), mx = (minX + maxX) / 2;
      pts = pts.map(function (q) { return [(q[0] - mx) / tw, (q[1] - oc.height / 2) / tw]; });
    } catch (e) { /* no canvas text: fall back to a line */ }
    if (!pts.length) for (var i = 0; i < 300; i++) pts.push([i / 300 - 0.5, 0]);
    return pts;
  }
  function sampleW() {
    var pts = [];
    try {
      var k = 0.5, oc = document.createElement('canvas'), o;
      oc.width = Math.ceil(445 * k); oc.height = Math.ceil(555 * k);
      o = oc.getContext('2d');
      o.setTransform(k, 0, 0, k, -335 * k, -262 * k);
      o.fill(new Path2D(P1)); o.fill(new Path2D(P2));
      var d = o.getImageData(0, 0, oc.width, oc.height).data;
      for (var y = 0; y < oc.height; y += 2) for (var x = 0; x < oc.width; x += 2) {
        if (d[(y * oc.width + x) * 4 + 3] > 140) pts.push([x / oc.width - 0.5, (y / oc.height - 0.5) * 1.247]);
      }
    } catch (e) { /* Path2D unsupported: fall back to a ring */ }
    if (!pts.length) for (var i = 0; i < 400; i++) { var a = i / 400 * Math.PI * 2; pts.push([Math.cos(a) * 0.4, Math.sin(a) * 0.4]); }
    return pts;
  }

  function build() {
    var wp = sampleW(), ap = sampleAI();
    for (var i = wp.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = wp[i]; wp[i] = wp[j]; wp[j] = tmp; }
    for (i = ap.length - 1; i > 0; i--) { var j2 = Math.floor(Math.random() * (i + 1)); var tmp2 = ap[i]; ap[i] = ap[j2]; ap[j2] = tmp2; }
    var diag = Math.hypot(W, H);
    for (i = 0; i < N; i++) {
      /* organic "brain": fibonacci sphere → ellipsoid with a central fissure and folds */
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var fold = 1 + 0.07 * Math.sin(x * 9 + y * 5) * Math.cos(z * 7 - y * 3);
      x *= 1.16 * fold; y *= 0.9 * fold; z *= 1.02 * fold;
      if (Math.abs(x) < 0.07) x = (x < 0 ? -1 : 1) * 0.07;
      var ang = Math.random() * Math.PI * 2, dist = diag * (0.55 + Math.random() * 0.25);
      var w = wp[i % wp.length], ai = ap[i % ap.length];
      P.push({
        b: [x, y, z],
        a: [ai[0] + (Math.random() - 0.5) * 0.01, ai[1] + (Math.random() - 0.5) * 0.01],
        sx: Math.cos(ang) * dist, sy: Math.sin(ang) * dist,
        d: Math.random() * 0.55,
        md: Math.random() * 0.35,
        w: [w[0] + (Math.random() - 0.5) * 0.012, w[1] + (Math.random() - 0.5) * 0.012],
        c: i % 5 === 0 ? 1 : 0,
        x: 0, y: 0, z: 0
      });
    }
    /* neural links: 2 nearest neighbours per node */
    var seen = {};
    for (i = 0; i < N; i++) {
      var bi = P[i].b, best = [1e9, 1e9], bj = [-1, -1];
      for (var k2 = 0; k2 < N; k2++) {
        if (k2 === i) continue;
        var bk = P[k2].b, dx = bi[0] - bk[0], dy = bi[1] - bk[1], dz = bi[2] - bk[2], dd = dx * dx + dy * dy + dz * dz;
        if (dd < best[0]) { best[1] = best[0]; bj[1] = bj[0]; best[0] = dd; bj[0] = k2; }
        else if (dd < best[1]) { best[1] = dd; bj[1] = k2; }
      }
      for (var q = 0; q < 2; q++) {
        var jj = bj[q]; if (jj < 0) continue;
        var key = i < jj ? i + '_' + jj : jj + '_' + i;
        if (!seen[key]) { seen[key] = 1; LINKS.push([i, jj]); }
      }
    }
    for (i = 0; i < (small ? 14 : 26); i++) PULSES.push({ l: Math.floor(Math.random() * LINKS.length), t: Math.random(), s: 0.8 + Math.random() * 1.4 });
  }

  /* ---------- HUD ---------- */
  function addLog(i, t) {
    if (!logEl) return;
    var prev = logEl.lastElementChild;
    if (prev) prev.classList.add('is-ok');
    var li = document.createElement('li');
    var ts = document.createElement('span'); ts.className = 'bl-t'; ts.textContent = '[' + t.toFixed(2).padStart(5, '0') + ']';
    var m = document.createElement('span'); m.className = 'bl-m'; m.textContent = LOG[i];
    var ok = document.createElement('span'); ok.className = 'bl-s'; ok.textContent = 'OK';
    li.appendChild(ts); li.appendChild(m); li.appendChild(ok);
    logEl.appendChild(li);
    while (logEl.children.length > 4) logEl.removeChild(logEl.firstElementChild);
    if (i === LOG.length - 1) li.classList.add('is-ok');
  }
  function hud(p, t) {
    if (numEl) numEl.textContent = Math.floor(p);
    if (barEl) barEl.style.transform = 'scaleX(' + (p / 100).toFixed(4) + ')';
    if (stat.nodes) stat.nodes.textContent = fmt(p / 100 * 12480);
    if (stat.links) stat.links.textContent = fmt(Math.pow(p / 100, 1.6) * 48902);
    if (stat.src) stat.src.textContent = Math.min(9, Math.floor(p / 11));
    while (logged < LOG.length && p >= LOG_AT[logged]) { addLog(logged, t); logged++; }
  }

  /* ---------- render ---------- */
  function draw(t, p) {
    if (!ctx) return;
    var cx = W / 2, cy = H * (small ? 0.42 : 0.46), R = Math.min(W * 0.21, H * 0.2, 250);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    /* фазы заставки: точки слетаются в надпись «AI» (a) → перетекают в мозг (bm) → в знак W2W (m) */
    var a = clamp(p / 0.26), bm = clamp((p - 0.4) / 0.2), m = clamp((p - 0.74) / 0.24), lk = clamp((p - 0.56) / 0.12) * (1 - clamp(m * 1.6));
    var rotY = t * 0.75, rotX = 0.32 + Math.sin(t * 0.5) * 0.12;
    var cY = Math.cos(rotY), sY = Math.sin(rotY), cX = Math.cos(rotX), sX = Math.sin(rotX);
    var Wsz = R * 2.35, Asz = R * 2.7, fov = R * 3.2;

    /* soft core glow */
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
    var gi = 0.1 + 0.12 * a + 0.12 * bm + 0.35 * m;
    g.addColorStop(0, 'rgba(10,188,243,' + (gi * 0.55).toFixed(3) + ')');
    g.addColorStop(0.45, 'rgba(7,231,183,' + (gi * 0.16).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(10,188,243,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);

    for (var i = 0; i < N; i++) {
      var o = P[i], b = o.b;
      var x = b[0] * R, y = b[1] * R, z = b[2] * R;
      var x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
      var y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      var ps = fov / (fov - z2);
      var bx = cx + x1 * ps, by = cy + y1 * ps;
      var ta = eOut(clamp((a * 1.55 - o.d) / 1));
      var ax = cx + o.a[0] * Asz, ay = cy + o.a[1] * Asz;
      var px = lerp(cx + o.sx, ax, ta), py = lerp(cy + o.sy, ay, ta);          /* fly-in → "AI" */
      var tb = eIO(clamp(bm * 1.4 - o.md));
      px = lerp(px, bx, tb); py = lerp(py, by, tb);                              /* "AI" → brain */
      var tm = eIO(clamp(m * 1.4 - o.md));
      o.x = lerp(px, cx + o.w[0] * Wsz, tm);                                     /* brain → W */
      o.y = lerp(py, cy + o.w[1] * Wsz * 0.8, tm);
      o.z = lerp(lerp(0.9, (z2 / R + 1) / 2, tb), 1, tm);
      o.tm = Math.max(tm, 1 - tb);                                              /* плоские фазы (AI и W) рисуем ровными точками */
    }

    /* links */
    if (lk > 0.01) {
      ctx.lineWidth = 0.7;
      for (var bucket = 0; bucket < 3; bucket++) {
        ctx.beginPath();
        var lo = bucket / 3, hi = (bucket + 1) / 3;
        for (var l = 0; l < LINKS.length; l++) {
          var A = P[LINKS[l][0]], B = P[LINKS[l][1]];
          var dz = Math.min(A.z, B.z);
          if (dz < lo || dz >= hi) continue;
          ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
        }
        ctx.strokeStyle = 'rgba(64,200,255,' + (lk * (0.05 + hi * hi * 0.22)).toFixed(3) + ')';
        ctx.stroke();
      }
      /* synapse pulses */
      for (var s = 0; s < PULSES.length; s++) {
        var pu = PULSES[s];
        pu.t += 0.016 * pu.s;
        if (pu.t > 1) { pu.t = 0; pu.l = Math.floor(Math.random() * LINKS.length); }
        var L = LINKS[pu.l], A2 = P[L[0]], B2 = P[L[1]];
        var zz = Math.min(A2.z, B2.z); if (zz < 0.45) continue;
        var qx = lerp(A2.x, B2.x, pu.t), qy = lerp(A2.y, B2.y, pu.t);
        ctx.globalAlpha = lk * zz;
        ctx.fillStyle = '#b8f4ff';
        ctx.beginPath(); ctx.arc(qx, qy, 1.8, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* particles */
    for (var pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? '#28f0c6' : '#3fd0ff';
      for (i = 0; i < N; i++) {
        var q2 = P[i]; if (q2.c !== pass) continue;
        var depth = q2.z;
        var alpha = (0.18 + depth * 0.82) * (0.35 + 0.65 * Math.min(1, a * 1.4));
        var size = (0.55 + depth * 1.35) * (1 - q2.tm) + 1.25 * q2.tm;
        ctx.globalAlpha = alpha;
        if (size < 1.1) ctx.fillRect(q2.x - size / 2, q2.y - size / 2, size, size);
        else { ctx.beginPath(); ctx.arc(q2.x, q2.y, size * 0.75, 0, 6.2832); ctx.fill(); }
      }
    }
    ctx.globalAlpha = 1;

    /* progress arc + orbit */
    var ringR = R * 1.62;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, 6.2832); ctx.stroke();
    var endA = -Math.PI / 2 + p * Math.PI * 2;
    var grad = ctx.createLinearGradient(cx - ringR, cy - ringR, cx + ringR, cy + ringR);
    grad.addColorStop(0, '#0abcf3'); grad.addColorStop(1, '#07e7b7');
    ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, ringR, -Math.PI / 2, endA); ctx.stroke();
    var hx = cx + Math.cos(endA) * ringR, hy = cy + Math.sin(endA) * ringR;
    var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 16);
    hg.addColorStop(0, 'rgba(160,240,255,0.95)'); hg.addColorStop(1, 'rgba(10,188,243,0)');
    ctx.fillStyle = hg; ctx.fillRect(hx - 16, hy - 16, 32, 32);
    /* tick marks */
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var tk = 0; tk < 60; tk++) {
      var ang = tk / 60 * Math.PI * 2 + t * 0.05, r1 = ringR + 10, r2 = ringR + (tk % 5 === 0 ? 18 : 14);
      ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
    }
    ctx.stroke();

    /* final flash on the W */
    if (m > 0.75) {
      var f = clamp((m - 0.75) / 0.25);
      var fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      fg.addColorStop(0, 'rgba(120,230,255,' + (0.28 * f).toFixed(3) + ')'); fg.addColorStop(1, 'rgba(10,188,243,0)');
      ctx.fillStyle = fg; ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3);
    }
  }

  function exitFrame(now) {
    var e = clamp((now - exitStart) / 950), k = eIO(e);
    var r = k * Math.hypot(W, H) * 0.75;
    var cy = small ? 42 : 46;
    var mask = 'radial-gradient(circle at 50% ' + cy + '%, transparent ' + r.toFixed(1) + 'px, #000 ' + (r + 90).toFixed(1) + 'px)';
    el.style.webkitMaskImage = mask; el.style.maskImage = mask;
    if (cv) cv.style.transform = 'scale(' + (1 + k * 0.35).toFixed(4) + ')';
    if (e >= 1) finish();
  }

  function startExit(now) {
    if (exiting) return;
    exiting = true; exitStart = now;
    el.classList.add('is-exit');
    h.classList.add('boot-exit');
    document.dispatchEvent(new CustomEvent('w2w:boot-exit'));
    bootDone();
  }

  function finish() {
    if (finished) return;
    finished = true;
    h.classList.remove('boot', 'boot-exit');
    if (el.parentNode) el.parentNode.removeChild(el);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', onKey);
    bootDone();
    document.dispatchEvent(new CustomEvent('w2w:boot-done'));
  }

  function onKey(e) { if (e.key === 'Escape') skip = true; }
  if (skipBtn) skipBtn.addEventListener('click', function () { skip = true; });
  document.addEventListener('keydown', onKey);

  /* failsafe: never block the site */
  setTimeout(function () { if (!finished) finish(); }, 9000);

  if (reduce || !ctx) {
    /* calm version: counter only, then fade */
    var tr0 = performance.now();
    (function tick(now) {
      var p = Math.min(100, (now - tr0) / 12);
      hud(p, (now - tr0) / 1000);
      if (p < 100 && !skip) { requestAnimationFrame(tick); return; }
      el.classList.add('is-fade');
      h.classList.add('boot-exit');
      bootDone();
      setTimeout(finish, 350);
    })(tr0);
    return;
  }

  resize();
  window.addEventListener('resize', resize);
  build();

  function frame(now) {
    if (finished) return;
    var t = (now - t0) / 1000;
    var target = skip ? 100 : timeline(t);
    prog += (target - prog) * (skip ? 0.35 : 0.22);
    if (target >= 100 && prog > 99.6) prog = 100;
    draw(t, prog / 100);
    hud(prog, t);
    if (prog >= 100 && !exiting) {
      if (!el._holdAt) el._holdAt = now;
      if (skip || now - el._holdAt > 320) startExit(now);
    }
    if (exiting) exitFrame(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
