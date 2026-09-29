/* Win to Win — multi-step request form (.rq): contacts → task (optional) → done, with live % progress. */
(function () {
  'use strict';
  var W = window.W2W || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var lang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var D = {
    ru: { unknown: 'Пока не знаю', err1: 'Заполните три поля, чтобы мы могли связаться с вами.', errPhone: 'Проверьте номер телефона или ник в Telegram.', sending: 'Отправляем…', locale: 'ru-RU' },
    uz: { unknown: 'Hozircha bilmayman', err1: 'Siz bilan bog‘lanishimiz uchun uchta maydonni to‘ldiring.', errPhone: 'Telefon raqami yoki Telegram nikini tekshiring.', sending: 'Yuborilmoqda…', locale: 'ru-RU' },
    en: { unknown: 'Not sure yet', err1: 'Fill in all three fields so we can reach you.', errPhone: 'Check the phone number or Telegram handle.', sending: 'Sending…', locale: 'en-US' }
  };
  var T = D[lang] || D.ru;
  var BUD = [5000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000, 150000, 200000];
  var money = function (n) { return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' '); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sfx = function (n) { if (window.W2WSound) window.W2WSound.play(n); };

  function init(form) {
    var stage = $('[data-rq-stage]', form);
    var steps = $$('.rq-step', form);
    var fill = $('[data-rq-fill]', form), pctEl = $('[data-rq-pct]', form), meter = $('.rq-meter', form);
    var dots = $$('.rq-steps li', form);
    var lo = $('[data-rq-lo]', form), hi = $('[data-rq-hi]', form), sel = $('[data-rq-sel]', form), budOut = $('[data-rq-budget]', form);
    var range = $('[data-rq-range]', form);
    var count = $('[data-rq-count]', form), task = form.elements.task;
    var state = { step: 1, dirs: [], budget: null, pct: 0, shown: 0 };

    /* ---------- progress ---------- */
    function calc() {
      var p = 0;
      ['company', 'name', 'phone'].forEach(function (n) { if (valid(n)) p += 20; });
      if (task && task.value.trim().length > 3) p += 15;
      if (state.dirs.length) p += 10;
      if (state.budget) p += 15;
      if (state.step === 3) p = 100;
      return p;
    }
    function paint() {
      var p = calc();
      state.pct = p;
      if (fill) fill.style.transform = 'scaleX(' + (p / 100) + ')';
      if (meter) meter.setAttribute('aria-valuenow', String(p));
      form.style.setProperty('--rq-p', String(p / 100));
      var from = state.shown, t0 = performance.now();
      var run = function (now) {
        var k = Math.min(1, (now - t0) / 450); k = 1 - Math.pow(1 - k, 3);
        var v = Math.round(from + (p - from) * k);
        if (pctEl) pctEl.textContent = v + '%';
        if (k < 1) requestAnimationFrame(run); else state.shown = p;
      };
      if (reduce) { if (pctEl) pctEl.textContent = p + '%'; state.shown = p; } else requestAnimationFrame(run);
    }

    /* ---------- validation ---------- */
    function valid(n) {
      var el = form.elements[n]; if (!el) return false;
      var v = el.value.trim();
      if (n === 'phone') return /^@?[a-z0-9_]{5,}$/i.test(v) || v.replace(/\D/g, '').length >= 7;
      return v.length >= 2;
    }
    ['company', 'name', 'phone'].forEach(function (n) {
      var el = form.elements[n]; if (!el) return;
      el.addEventListener('input', function () {
        var ok = valid(n);
        el.closest('.rq-field').classList.toggle('is-ok', ok);
        if (ok) el.closest('.rq-field').classList.remove('is-invalid');
        paint();
      });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); next(); } });
    });
    if (task) task.addEventListener('input', function () { if (count) count.textContent = task.value.length + ' / 600'; paint(); });

    /* ---------- step switching ---------- */
    function show(n, dir) {
      var cur = steps[state.step - 1], nxt = steps[n - 1];
      state.step = n;
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i < n); d.classList.toggle('is-cur', i === n - 1); });
      form.classList.toggle('is-done', n === 3);
      paint();
      if (cur === nxt) return;
      var h0 = stage.offsetHeight;
      if (reduce || !window.gsap) {
        cur.hidden = true; nxt.hidden = false;
        focusStep(nxt); return;
      }
      var g = window.gsap;
      g.to(cur, { x: -40 * dir, opacity: 0, filter: 'blur(8px)', duration: 0.28, ease: 'power2.in', onComplete: function () {
        cur.hidden = true; g.set(cur, { clearProps: 'all' });
        nxt.hidden = false;
        var h1 = nxt.offsetHeight;
        g.fromTo(stage, { height: h0 }, { height: h1, duration: 0.45, ease: 'expo.out', clearProps: 'height' });
        g.fromTo(nxt, { x: 40 * dir, opacity: 0, filter: 'blur(8px)' }, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'expo.out', clearProps: 'all' });
        g.fromTo($$('.rq-field, .rq-group, .rq-actions, .rq-check, .rq-done-title, .rq-done-text', nxt), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out', delay: 0.05, clearProps: 'all' });
        focusStep(nxt);
      } });
    }
    function focusStep(el) {
      var f = el.getAttribute('tabindex') === '-1' ? el : $('input:not(.hp), textarea, button', el);
      if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
    }
    function shake(el) {
      el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake');
    }
    function next() {
      var bad = ['company', 'name', 'phone'].filter(function (n) { return !valid(n); });
      var err = $('[data-rq-error]', form);
      if (bad.length) {
        bad.forEach(function (n) { var f = form.elements[n].closest('.rq-field'); f.classList.add('is-invalid'); shake(f); });
        if (err) { err.textContent = bad.length === 1 && bad[0] === 'phone' && form.elements.phone.value.trim() ? T.errPhone : T.err1; err.hidden = false; }
        form.elements[bad[0]].focus();
        sfx('error');
        return;
      }
      if (err) err.hidden = true;
      sfx('whoosh');
      show(2, 1);
    }
    $('[data-rq-next]', form).addEventListener('click', next);
    var back = $('[data-rq-back]', form); if (back) back.addEventListener('click', function () { show(1, -1); });
    var skip = $('[data-rq-skip]', form); if (skip) skip.addEventListener('click', function () { submit(true); });
    var again = $('[data-rq-again]', form); if (again) again.addEventListener('click', function () { form.reset(); state.dirs = []; state.budget = null; $$('.chip', form).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); c.classList.remove('is-on'); }); $$('.rq-field', form).forEach(function (f) { f.classList.remove('is-ok', 'is-invalid'); }); syncRange(1, 4, true); state.budget = null; show(1, -1); });

    /* ---------- directions ---------- */
    $$('[data-rq-dirs] .chip', form).forEach(function (c) {
      c.addEventListener('click', function () {
        var v = c.getAttribute('data-v'), i = state.dirs.indexOf(v);
        if (i >= 0) state.dirs.splice(i, 1); else state.dirs.push(v);
        c.setAttribute('aria-pressed', String(i < 0));
        paint();
      });
    });

    /* ---------- budget: dual range ---------- */
    function syncRange(a, b, silent) {
      a = +a; b = +b;
      if (a > b) { var t = a; a = b; b = t; }
      lo.value = a; hi.value = b;
      var L = a / 10 * 100, R = b / 10 * 100;
      if (sel) { sel.style.left = L + '%'; sel.style.right = (100 - R) + '%'; }
      range.style.setProperty('--lo', L + '%'); range.style.setProperty('--hi', R + '%');
      var txt = b === 10 ? (a === 10 ? money(BUD[10]) + '+' : money(BUD[a]) + ' – ' + money(BUD[10]) + '+') : (a === b ? money(BUD[a]) : money(BUD[a]) + ' – ' + money(BUD[b]));
      if (budOut) budOut.textContent = txt;
      if (!silent) {
        state.budget = { lo: BUD[a], hi: b === 10 ? null : BUD[b], text: txt };
        form.classList.remove('bud-unknown');
        var u = $('[data-bud="unknown"]', form); if (u) u.setAttribute('aria-pressed', 'false');
      }
      $$('[data-bud]', form).forEach(function (c) { var v = c.getAttribute('data-bud'); if (v !== 'unknown') c.classList.toggle('is-on', !silent && v === a + ',' + b); });
      paint();
    }
    if (lo && hi) {
      [lo, hi].forEach(function (inp) {
        inp.addEventListener('input', function () {
          var a = +lo.value, b = +hi.value;
          if (a > b) { if (inp === lo) lo.value = b; else hi.value = a; }
          syncRange(lo.value, hi.value);
          sfx('tick');
        });
      });
      /* pick the thumb nearest to the pointer so either can be dragged */
      range.addEventListener('pointerdown', function (e) {
        var r = range.getBoundingClientRect(), v = (e.clientX - r.left) / r.width * 10;
        var near = Math.abs(v - lo.value) <= Math.abs(v - hi.value) ? lo : hi;
        if (+lo.value === +hi.value) near = v < +lo.value ? lo : hi;
        lo.style.zIndex = near === lo ? 3 : 2; hi.style.zIndex = near === hi ? 3 : 2;
      });
      syncRange(1, 4, true);
    }
    $$('[data-bud]', form).forEach(function (c) {
      c.addEventListener('click', function () {
        var v = c.getAttribute('data-bud');
        if (v === 'unknown') {
          var on = c.getAttribute('aria-pressed') !== 'true';
          c.setAttribute('aria-pressed', String(on));
          form.classList.toggle('bud-unknown', on);
          state.budget = on ? { unknown: true, text: T.unknown } : null;
          if (budOut) budOut.textContent = on ? T.unknown : budOut.textContent;
          $$('[data-bud]', form).forEach(function (x) { if (x !== c) x.classList.remove('is-on'); });
          paint(); return;
        }
        var p = v.split(','); syncRange(p[0], p[1]);
      });
    });

    /* ---------- submit ---------- */
    function confetti() {
      if (reduce) return;
      var box = $('.rq-check', form); if (!box) return;
      for (var i = 0; i < 22; i++) {
        var s = document.createElement('i'); s.className = 'rq-spark';
        var a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
        s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px'); s.style.setProperty('--dy', (Math.sin(a) * d).toFixed(0) + 'px');
        s.style.setProperty('--c', ['#0abcf3', '#07e7b7', '#7fe0ff', '#ffffff'][i % 4]);
        s.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
        box.appendChild(s);
        setTimeout(function (el) { return function () { el.remove(); }; }(s), 1400);
      }
    }
    function submit(skipped) {
      if (form.classList.contains('is-sending')) return;
      if (form.elements.website && form.elements.website.value) return;
      var data = {
        form: 'request', company: form.elements.company.value.trim(), name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(),
        task: skipped ? '' : (task ? task.value.trim() : ''), directions: skipped ? [] : state.dirs.slice(),
        budget: skipped || !state.budget ? '' : state.budget.text, skippedStep2: !!skipped,
        page: location.href, lang: lang
      };
      var err2 = $('[data-rq-error2]', form);
      form.classList.add('is-sending');
      var done = function (viaApp) {
        form.classList.remove('is-sending');
        if (err2) err2.hidden = true;
        $$('[data-rq-ok]', form).forEach(function (el) { el.hidden = !!viaApp; });
        $$('[data-rq-fb]', form).forEach(function (el) { el.hidden = !viaApp; });
        if (viaApp && W.sendLinks) {
          var S = W.sendLabels || {};
          W.sendLinks(form, S.req, [[S.company, data.company], [S.name, data.name], [S.contact, data.phone], [S.task, data.task], [S.dirs, data.directions.join(', ')], [S.budget, data.budget]]);
        }
        show(3, 1); sfx('success'); if (!viaApp) setTimeout(confetti, 380);
        if (!viaApp) document.dispatchEvent(new CustomEvent('w2w:request-sent', { detail: data }));
      };
      if (W.formEndpoint) {
        fetch(W.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error('send'); done(); })
          .catch(function () { form.classList.remove('is-sending'); if (err2) err2.hidden = false; sfx('error'); });
      } else setTimeout(function () { done(true); }, 450);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); if (state.step === 1) next(); else submit(false); });
    /* prefill from the calculator (modal form only) */
    if (form.getAttribute('data-rq') === 'm') {
      document.addEventListener('w2w:prefill', function (e) {
        var d = e.detail || {};
        if (task && d.task) { task.value = d.task.slice(0, 600); task.dispatchEvent(new Event('input')); }
        (d.dirs || []).forEach(function (v) {
          var c = $('[data-rq-dirs] .chip[data-v="' + v + '"]', form);
          if (c && state.dirs.indexOf(v) < 0) { state.dirs.push(v); c.setAttribute('aria-pressed', 'true'); }
        });
        if (d.lo && lo && hi) {
          var near = function (x) { var bi = 0; BUD.forEach(function (b, i) { if (Math.abs(b - x) < Math.abs(BUD[bi] - x)) bi = i; }); return bi; };
          syncRange(near(d.lo), Math.max(near(d.lo), near(d.hi)));
        }
        paint();
      });
    }
    paint();
  }

  $$('form[data-rq]').forEach(init);
})();
