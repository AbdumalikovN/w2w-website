/* Win to Win — Company Brain implementation calculator (range only, min $5 000, not an offer). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var W = window.W2W || {};
  var lang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = {
    ru: {
      parts: ['Навыки', 'Каналы', 'Интеграции', 'База знаний', 'Языки', 'Доп. опции'],
      perMonth: 'в месяц', weeks: 'недель', team: ' специалиста и PM', coef: 'Коэффициенты: ', privK: 'ваш контур ×1,5', fastK: 'срочно ×1,25',
      sys: ['система', 'системы', 'систем'], lng: ['язык', 'языка', 'языков'], copied: 'Расчёт скопирован',
      summary: function (r, st) { return 'Company Brain — навыки: ' + st + '. Внедрение ' + r.setup + ', эксплуатация ' + r.monthly + ', срок ' + r.weeks + '.'; },
      task: 'Расчёт из калькулятора: '
    },
    uz: {
      parts: ['Ko‘nikmalar', 'Kanallar', 'Integratsiyalar', 'Bilimlar bazasi', 'Tillar', 'Qo‘shimcha'],
      perMonth: 'oyiga', weeks: 'hafta', team: ' mutaxassis va PM', coef: 'Koeffitsiyentlar: ', privK: 'sizning konturingiz ×1,5', fastK: 'shoshilinch ×1,25',
      sys: ['tizim', 'tizim', 'tizim'], lng: ['til', 'til', 'til'], copied: 'Hisob-kitob nusxalandi',
      summary: function (r, st) { return 'Company Brain — ko‘nikmalar: ' + st + '. Joriy etish ' + r.setup + ', ekspluatatsiya ' + r.monthly + ', muddat ' + r.weeks + '.'; },
      task: 'Kalkulyatordan hisob-kitob: '
    },
    en: {
      parts: ['Skills', 'Channels', 'Integrations', 'Knowledge base', 'Languages', 'Extras'],
      perMonth: 'per month', weeks: 'weeks', team: ' specialists + PM', coef: 'Multipliers: ', privK: 'your perimeter ×1.5', fastK: 'rush ×1.25',
      sys: ['system', 'systems', 'systems'], lng: ['language', 'languages', 'languages'], copied: 'Estimate copied',
      summary: function (r, st) { return 'Company Brain — skills: ' + st + '. Implementation ' + r.setup + ', running costs ' + r.monthly + ', timeline ' + r.weeks + '.'; },
      task: 'Calculator estimate: '
    }
  };
  var T = D[lang] || D.ru;
  var plural = function (n, f) {
    if (lang !== 'ru') return n + ' ' + (n === 1 ? f[0] : f[1]);
    var m10 = n % 10, m100 = n % 100;
    return n + ' ' + ((m10 === 1 && m100 !== 11) ? f[0] : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? f[1] : f[2]);
  };
  var usd = function (n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' '); };
  var r500 = function (n) { return Math.round(n / 500) * 500; };

  function run(C, s) {
    var skills = C.skills.filter(function (x) { return s.skills.indexOf(x.id) >= 0; });
    var kSorted = skills.map(function (x) { return x.k; }).sort(function (a, b) { return b - a; });
    var skillCost = kSorted.reduce(function (a, k, i) { return a + (i === 0 ? 5000 * k : 2500 * k); }, 0);
    var dep = C.deploy.find(function (d) { return d.id === s.deploy; }) || C.deploy[0];
    var urg = C.urgency.find(function (u) { return u.id === s.urgency; }) || C.urgency[0];
    var know = C.knowledge.find(function (k) { return k.id === s.knowledge; }) || C.knowledge[0];
    var extras = s.extras.reduce(function (a, e) { var x = C.extras.find(function (q) { return q.id === e; }); return a + (x ? x.add : 0); }, 0);
    var parts = [
      [T.parts[0], skillCost, 1], [T.parts[1], Math.max(0, s.channels.length - 1) * 800, 2], [T.parts[2], s.integrations * 1200, 3],
      [T.parts[3], know.add, 4], [T.parts[4], Math.max(0, s.languages - 1) * 900, 5], [T.parts[5], extras, 6]
    ].filter(function (x) { return x[1] > 0; });
    var base = parts.reduce(function (a, x) { return a + x[1]; }, 0);
    var mult = [];
    if (dep.k !== 1) mult.push(T.privK);
    if (urg.k !== 1) mult.push(T.fastK);
    base *= dep.k * urg.k;
    var lo = Math.max(C.minSetup || 5000, r500(base * 0.85)), hi = r500(base * 1.35);
    if (hi <= lo) hi = lo + 2500;
    var priv = s.deploy === 'private', n = Math.max(1, skills.length);
    var mLo = priv ? 1500 : 500, mHi = priv ? 5000 : 1500;
    mLo = Math.min(priv ? 3500 : 1000, mLo + (n - 1) * (priv ? 400 : 150));
    var wLo = 4 + s.integrations + (n - 1), wHi = wLo + 4 + (priv ? 3 : 0) + (s.knowledge === 'l' ? 2 : 0);
    if (s.urgency === 'fast') { wLo = Math.max(3, Math.round(wLo * 0.8)); wHi = Math.max(wLo + 2, Math.round(wHi * 0.8)); }
    var people = 2 + (s.integrations >= 3 ? 1 : 0) + (priv ? 1 : 0) + (s.extras.indexOf('ui') >= 0 ? 1 : 0) + (n >= 3 ? 1 : 0);
    var sum = parts.reduce(function (a, x) { return a + x[1]; }, 0) || 1;
    return {
      lo: lo, hi: hi, mLo: mLo, mHi: mHi, wLo: wLo, wHi: wHi, pct: Math.min(1, hi / 60000),
      setup: usd(lo) + ' – ' + usd(hi), monthly: usd(mLo) + ' – ' + usd(mHi) + ' ' + T.perMonth, weeks: wLo + '–' + wHi + ' ' + T.weeks,
      team: people + '–' + (people + 1) + T.team, mult: mult,
      parts: parts.map(function (x) { return { label: x[0], share: x[1] / sum, c: x[2] }; }),
      skillNames: skills.map(function (x) { return x.label; }).join(', ')
    };
  }

  function init(root) {
    var dataEl = $('[data-calc-data]', root);
    if (!dataEl) return;
    var C = JSON.parse(dataEl.textContent);
    var state = JSON.parse(JSON.stringify(C.defaults));
    var qs = new URLSearchParams(location.search).get('type') || new URLSearchParams(location.search).get('skill');
    if (qs && C.skills.some(function (x) { return x.id === qs; })) state.skills = [qs];
    var last = null, out = function (k) { return $('[data-out="' + k + '"]', root); };
    var card = $('[data-cx-card]', root);

    function tweenRange(els, from, to) {
      var fmt = function (a, b) { return usd(r500(a)) + ' – ' + usd(r500(b)); };
      if (reduce || !from || !window.gsap) { els.forEach(function (el) { el.textContent = fmt(to.lo, to.hi); }); return; }
      var o = { lo: from.lo, hi: from.hi };
      window.gsap.to(o, { lo: to.lo, hi: to.hi, duration: 0.7, ease: 'expo.out', overwrite: true, onUpdate: function () { els.forEach(function (el) { el.textContent = fmt(o.lo, o.hi); }); } });
    }
    function sync() {
      $$('[data-group]', root).forEach(function (g) {
        var name = g.getAttribute('data-group'), multi = g.hasAttribute('data-multi');
        $$('[data-value]', g).forEach(function (b) {
          var v = b.getAttribute('data-value'), on = multi ? state[name].indexOf(v) >= 0 : state[name] === v;
          b.setAttribute('aria-checked', String(on)); b.classList.toggle('is-on', on);
        });
        if (g.classList.contains('segmented') && W.placeThumb) W.placeThumb(g);
      });
      $$('[data-toggle]', root).forEach(function (t) { t.setAttribute('aria-checked', String(state[t.getAttribute('data-toggle')] === t.getAttribute('data-on'))); });
      $$('[data-stepper]', root).forEach(function (st) {
        var k = st.getAttribute('data-stepper'), v = state[k];
        $('[data-step="-1"]', st).disabled = v <= +st.getAttribute('data-min');
        $('[data-step="1"]', st).disabled = v >= +st.getAttribute('data-max');
      });
      $$('[data-preset]', root).forEach(function (b) {
        var p = C.presets.find(function (x) { return x.id === b.getAttribute('data-preset'); });
        var same = p && JSON.stringify(normalize(p.set)) === JSON.stringify(normalize(state));
        b.setAttribute('aria-pressed', String(!!same));
      });
    }
    function normalize(s) { return { skills: s.skills.slice().sort(), channels: s.channels.slice().sort(), integrations: s.integrations, knowledge: s.knowledge, languages: s.languages, deploy: s.deploy, extras: s.extras.slice().sort(), urgency: s.urgency }; }
    function render() {
      var r = run(C, state);
      tweenRange([out('setup'), out('setup2')].filter(Boolean), last, r);
      var meter = out('meter'); if (meter) meter.style.transform = 'scaleX(' + Math.max(0.06, r.pct).toFixed(3) + ')';
      var m = out('monthly'); if (m) m.textContent = r.monthly;
      var w = out('weeks'); if (w) w.textContent = r.weeks;
      var t = out('team'); if (t) t.textContent = r.team;
      var oi = out('integrations'); if (oi) oi.textContent = plural(state.integrations, T.sys);
      var ol = out('languages'); if (ol) ol.textContent = plural(state.languages, T.lng);
      $$('input[type="range"][data-group]', root).forEach(function (inp) {
        inp.value = state[inp.getAttribute('data-group')];
        inp.style.setProperty('--fill', ((inp.value - inp.min) / (inp.max - inp.min) * 100).toFixed(1) + '%');
      });
      var bar = out('stackbar');
      if (bar) {
        if (bar.children.length !== 6) bar.innerHTML = [1, 2, 3, 4, 5, 6].map(function (c) { return '<i class="cx-c' + c + '"></i>'; }).join('');
        var by = {}; r.parts.forEach(function (p) { by[p.c] = p.share; });
        Array.prototype.forEach.call(bar.children, function (el, i) { el.style.flexGrow = String(by[i + 1] || 0); el.style.display = by[i + 1] ? '' : 'none'; });
      }
      var parts = out('parts');
      if (parts) {
        parts.innerHTML = r.parts.map(function (p) { return '<li><i class="cx-c' + p.c + '"></i><span></span><b>' + Math.round(p.share * 100) + '%</b></li>'; }).join('');
        $$('li > span', parts).forEach(function (sp, i) { sp.textContent = r.parts[i].label; });
      }
      var mu = out('mult');
      if (mu) { mu.hidden = !r.mult.length; mu.textContent = r.mult.length ? T.coef + r.mult.join(', ') : ''; }
      var sm = out('summary'); if (sm && last) sm.textContent = T.summary(r, r.skillNames);
      if (card && last && !reduce) { card.classList.remove('is-bump'); void card.offsetWidth; card.classList.add('is-bump'); }
      sync();
      last = r;
    }
    root.addEventListener('click', function (e) {
      var pre = e.target.closest('[data-preset]');
      if (pre) {
        var p = C.presets.find(function (x) { return x.id === pre.getAttribute('data-preset'); });
        if (p) { state = JSON.parse(JSON.stringify(p.set)); render(); }
        return;
      }
      var tog = e.target.closest('[data-toggle]');
      if (tog) { var k = tog.getAttribute('data-toggle'); state[k] = state[k] === tog.getAttribute('data-on') ? tog.getAttribute('data-off') : tog.getAttribute('data-on'); render(); return; }
      var step = e.target.closest('[data-step]');
      if (step) {
        var st = step.closest('[data-stepper]'), key = st.getAttribute('data-stepper');
        state[key] = Math.min(+st.getAttribute('data-max'), Math.max(+st.getAttribute('data-min'), state[key] + (+step.getAttribute('data-step'))));
        render(); return;
      }
      if (e.target.closest('[data-cx-request]')) {
        var r = run(C, state);
        if (W.openModal) W.openModal('request', e.target.closest('button'));
        document.dispatchEvent(new CustomEvent('w2w:prefill', { detail: { task: T.task + T.summary(r, r.skillNames), dirs: ['Company Brain'], lo: r.lo, hi: r.hi } }));
        return;
      }
      if (e.target.closest('[data-cx-copy]')) {
        var r2 = run(C, state), txt = T.summary(r2, r2.skillNames);
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { if (W.toast) W.toast(T.copied); }, function () {});
        return;
      }
      var opt = e.target.closest('[data-value]'); if (!opt) return;
      var group = opt.closest('[data-group]'); if (!group) return;
      var g = group.getAttribute('data-group'), v = opt.getAttribute('data-value');
      if (group.hasAttribute('data-multi')) {
        var arr = state[g], i = arr.indexOf(v);
        if (i >= 0) {
          if ((g === 'channels' || g === 'skills') && arr.length === 1) { opt.classList.remove('is-nope'); void opt.offsetWidth; opt.classList.add('is-nope'); return; }
          arr.splice(i, 1);
        } else arr.push(v);
      } else state[g] = v;
      render();
    });
    root.addEventListener('keydown', function (e) {
      var opt = e.target.closest('[role="radio"]');
      if (!opt || ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
      var opts = $$('[role="radio"]', opt.closest('[data-group]'));
      var i = opts.indexOf(opt) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
      var next = opts[(i + opts.length) % opts.length];
      e.preventDefault(); next.focus(); next.click();
    });
    root.addEventListener('input', function (e) {
      var inp = e.target.closest('input[type="range"][data-group]'); if (!inp) return;
      state[inp.getAttribute('data-group')] = parseInt(inp.value, 10);
      render();
    });
    /* mobile bar: visible while the calculator is on screen but the summary card is not */
    var bar = $('[data-cx-bar]', root);
    if (bar && 'IntersectionObserver' in window) {
      var inCalc = false, cardVis = false;
      var upd = function () { bar.classList.toggle('is-on', inCalc && !cardVis); };
      new IntersectionObserver(function (en) { inCalc = en[0].isIntersecting; upd(); }, { threshold: 0.05 }).observe(root);
      new IntersectionObserver(function (en) { cardVis = en[0].isIntersecting; upd(); }, { threshold: 0.25 }).observe(card);
    }
    render();
  }
  $$('[data-calc]').forEach(init);
})();
