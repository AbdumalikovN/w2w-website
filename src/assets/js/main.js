/* Win to Win — интерактив сайта. Без зависимостей. */
(function () {
  'use strict';
  const W = window.W2W || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation ---------- */
  const burger = $('.burger');
  const mobileNav = $('#mobile-nav');
  function setMenu(open) {
    if (!burger || !mobileNav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileNav.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
  }
  if (burger) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    window.addEventListener('resize', () => { if (window.innerWidth > 1180) setMenu(false); });
  }

  /* ---------- Modals ---------- */
  let lastFocus = null;
  function openModal(id) {
    const bg = $('#m-' + id);
    if (!bg) return;
    setMenu(false);
    lastFocus = document.activeElement;
    bg.hidden = false;
    document.body.classList.add('no-scroll');
    const first = $('input, select, textarea, button:not([data-close])', bg);
    if (first) setTimeout(() => first.focus(), 30);
    if (id === 'search') ensureSearchIndex();
  }
  function closeModals() {
    let wasOpen = false;
    $$('.modal-bg').forEach((bg) => { if (!bg.hidden) wasOpen = true; bg.hidden = true; });
    if (wasOpen) {
      document.body.classList.remove('no-scroll');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
  }
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-modal]');
    if (opener) { e.preventDefault(); openModal(opener.getAttribute('data-modal')); return; }
    if (e.target.closest('[data-close]')) { closeModals(); return; }
    if (e.target.classList && e.target.classList.contains('modal-bg')) closeModals();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModals(); setMenu(false); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openModal('search'); }
  });

  /* ---------- Forms → Telegram endpoint or thanks page ---------- */
  $$('form[data-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('[data-error]', form);
      const name = (form.elements.name && form.elements.name.value || '').trim();
      const contact = (form.elements.contact && form.elements.contact.value || '').trim();
      if (!name || !contact) { if (err) err.hidden = false; (name ? form.elements.contact : form.elements.name).focus(); return; }
      if (err) err.hidden = true;
      if (form.elements.website && form.elements.website.value) return; // honeypot
      const data = Object.fromEntries(new FormData(form).entries());
      data.form = form.getAttribute('data-form');
      data.page = location.href;
      form.classList.add('is-sending');
      try {
        if (W.formEndpoint) {
          const r = await fetch(W.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error('send failed');
        }
        location.href = W.thanks || '/thanks/';
      } catch (_) {
        form.classList.remove('is-sending');
        if (err) { err.textContent = 'Не удалось отправить. Напишите нам в Telegram или на почту info@w2w.uz.'; err.hidden = false; }
      }
    });
  });

  /* ---------- Search (⌘K) ---------- */
  let searchIndex = null;
  let searchLoading = null;
  function ensureSearchIndex() {
    if (searchIndex || searchLoading) return searchLoading;
    searchLoading = fetch((W.base || '/') + 'search-index.json').then((r) => r.json()).then((j) => { searchIndex = j; return j; }).catch(() => { searchIndex = []; });
    return searchLoading;
  }
  const searchInput = $('[data-search-input]');
  const searchOut = $('[data-search-out]');
  function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (!searchOut) return;
    if (q.length < 2) { searchOut.innerHTML = '<p class="muted">Введите минимум 2 символа.</p>'; return; }
    if (!searchIndex) { searchOut.innerHTML = '<p class="muted">Загружаем индекс…</p>'; ensureSearchIndex().then(() => runSearch(q)); return; }
    const res = [];
    for (const p of searchIndex) {
      const t = p.text.toLowerCase();
      const i = t.indexOf(q);
      const inTitle = p.title.toLowerCase().indexOf(q) >= 0;
      if (i < 0 && !inTitle) continue;
      const at = i < 0 ? 0 : i;
      const snip = p.text.slice(Math.max(0, at - 50), at + 90).replace(/\s+/g, ' ');
      res.push({ p, snip, score: (inTitle ? 2 : 0) + (i >= 0 ? 1 : 0) });
    }
    res.sort((a, b) => b.score - a.score);
    if (!res.length) { searchOut.innerHTML = '<p class="muted">Ничего не нашли. Попробуйте другое слово.</p>'; return; }
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    searchOut.innerHTML = res.slice(0, 10).map(({ p, snip }) =>
      '<a href="' + esc(p.url) + '"><b>' + esc(p.title) + '</b><span>…' + esc(snip).replace(re, '<mark>$1</mark>') + '…</span></a>'
    ).join('');
  }
  if (searchInput) searchInput.addEventListener('input', () => runSearch(searchInput.value));

  /* ---------- Calculator ---------- */
  const C = W.calc;
  function calcRun(s) {
    const type = C.types.find((t) => t.id === s.type) || C.types[0];
    const dep = C.deploy.find((d) => d.id === s.deploy) || C.deploy[0];
    const urg = C.urgency.find((u) => u.id === s.urgency) || C.urgency[0];
    let extras = 0;
    s.extras.forEach((e) => { const x = C.extras.find((q) => q.id === e); if (x) extras += x.add; });
    const parts = [
      ['Агент: ' + type.label.toLowerCase(), 5000 * type.k],
      ['Дополнительные каналы', Math.max(0, s.channels.length - 1) * 800],
      ['Интеграции с системами', s.integrations * 1200],
      ['Объём базы знаний', (C.knowledge.find((k) => k.id === s.knowledge) || C.knowledge[0]).add],
      ['Дополнительные языки', Math.max(0, s.languages - 1) * 900],
      ['Требования: SLA, контроль, UI', extras]
    ].filter((x) => x[1] > 0);
    let base = parts.reduce((a, x) => a + x[1], 0);
    const mult = [];
    if (dep.k !== 1) mult.push(dep.label + ' ×' + String(dep.k).replace('.', ','));
    if (urg.k !== 1) mult.push(urg.label.split(',')[0] + ' ×' + String(urg.k).replace('.', ','));
    base *= dep.k * urg.k;
    const r500 = (n) => Math.round(n / 500) * 500;
    let lo = Math.max(C.minSetup || 5000, r500(base * 0.85));
    let hi = r500(base * 1.35);
    if (hi <= lo) hi = lo + 2500;
    const priv = s.deploy === 'private';
    const mLo = priv ? 1500 : 500, mHi = priv ? 5000 : 1500;
    let wLo = 4 + s.integrations, wHi = wLo + 4 + (priv ? 3 : 0) + (s.knowledge === 'l' ? 2 : 0);
    if (s.urgency === 'fast') { wLo = Math.max(3, Math.round(wLo * 0.8)); wHi = Math.max(wLo + 2, Math.round(wHi * 0.8)); }
    const pct = Math.min(100, Math.round((hi / 60000) * 100));
    const people = 2 + (s.integrations >= 3 ? 1 : 0) + (priv ? 1 : 0) + (s.extras.includes('ui') ? 1 : 0);
    const sum = parts.reduce((a, x) => a + x[1], 0) || 1;
    return { lo, hi, mLo, mHi, wLo, wHi, pct, team: people + '–' + (people + 1) + ' специалиста и PM', parts: parts.map((x) => ({ label: x[0], share: x[1] / sum })), mult };
  }
  const usd = (n) => '$' + Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const plural = (n, one, few, many) => { const m10 = n % 10, m100 = n % 100; return n + ' ' + ((m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? few : many); };

  function tweenText(el, from, to, format, dur) {
    if (reduceMotion || from === null || Math.abs(from.lo - to.lo) + Math.abs(from.hi - to.hi) === 0) { el.textContent = format(to.lo, to.hi); return; }
    const t0 = performance.now();
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const k = ease(p);
      el.textContent = format(from.lo + (to.lo - from.lo) * k, from.hi + (to.hi - from.hi) * k);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const calcRoots = [];
  const qsType = new URLSearchParams(location.search).get('type');
  $$('[data-calc]').forEach((root) => {
    const state = JSON.parse(JSON.stringify(C.defaults));
    state.channels = state.channels.slice(); state.extras = state.extras.slice();
    const isFull = root.getAttribute('data-calc') === 'full';
    let last = null;
    const out = (k) => $('[data-out="' + k + '"]', root);
    function render() {
      const r = calcRun(state);
      const setup = out('setup');
      if (setup) tweenText(setup, last && { lo: last.lo, hi: last.hi }, { lo: r.lo, hi: r.hi }, (a, b) => usd(Math.round(a / 500) * 500) + ' – ' + usd(Math.round(b / 500) * 500), 420);
      const bar = out('bar'); if (bar) bar.style.setProperty('--pct', (r.pct / 100).toFixed(2));
      const m = out('monthly'); if (m) m.textContent = usd(r.mLo) + ' – ' + usd(r.mHi) + ' в месяц';
      const w = out('weeks'); if (w) w.textContent = r.wLo + '–' + r.wHi + ' недель';
      const t = out('team'); if (t) t.textContent = r.team;
      const oi = out('integrations'); if (oi) oi.textContent = plural(state.integrations, 'система', 'системы', 'систем');
      const ol = out('languages'); if (ol) ol.textContent = plural(state.languages, 'язык', 'языка', 'языков');
      $$('input[type="range"]', root).forEach((inp) => { const mn = +inp.min, mx = +inp.max; inp.style.setProperty('--fill', ((inp.value - mn) / (mx - mn) * 100).toFixed(1) + '%'); });
      const parts = out('parts');
      if (parts) {
        parts.innerHTML = r.parts.map((x) => '<li><span></span><b>' + Math.round(x.share * 100) + '%</b><i style="--share:' + x.share.toFixed(3) + '"></i></li>').join('');
        $$('li > span', parts).forEach((sp, i) => { sp.textContent = r.parts[i].label; });
      }
      const mu = out('mult');
      if (mu) { mu.hidden = !r.mult.length; mu.innerHTML = r.mult.length ? 'Коэффициенты: <b></b>' : ''; if (r.mult.length) $('b', mu).textContent = r.mult.join(', '); }
      const sm = out('summary');
      if (sm && last) sm.textContent = 'Оценка: внедрение ' + usd(r.lo) + ' – ' + usd(r.hi) + ', эксплуатация ' + usd(r.mLo) + ' – ' + usd(r.mHi) + ' в месяц, срок ' + r.wLo + '–' + r.wHi + ' недель.';
      last = r;
    }
    function setType(v) {
      if (!C.types.some((t) => t.id === v) || state.type === v) return;
      state.type = v;
      $$('[data-group="type"] .chip', root).forEach((c) => { const on = c.getAttribute('data-value') === v; c.classList.toggle('is-on', on); c.setAttribute('aria-checked', String(on)); });
      render();
    }
    if (isFull && qsType) { state.type = C.types.some((t) => t.id === qsType) ? qsType : state.type; $$('[data-group="type"] .chip', root).forEach((c) => { const on = c.getAttribute('data-value') === state.type; c.classList.toggle('is-on', on); c.setAttribute('aria-checked', String(on)); }); }
    calcRoots.push({ root, isFull, setType, state });
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const group = chip.closest('[data-group]');
      if (!group) return;
      const g = group.getAttribute('data-group');
      const v = chip.getAttribute('data-value');
      if (group.hasAttribute('data-multi')) {
        const arr = state[g];
        const i = arr.indexOf(v);
        if (i >= 0) { if (g === 'channels' && arr.length === 1) return; arr.splice(i, 1); } else arr.push(v);
        chip.classList.toggle('is-on', arr.includes(v));
        chip.setAttribute('aria-pressed', String(arr.includes(v)));
      } else {
        state[g] = v;
        $$('.chip', group).forEach((c) => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-checked', String(on)); });
        // the hero estimate hands its agent type to the full calculator on the same page
        if (g === 'type' && !isFull) calcRoots.forEach((c) => { if (c.isFull) c.setType(v); });
      }
      render();
    });
    root.addEventListener('input', (e) => {
      const inp = e.target.closest('input[type="range"][data-group]');
      if (!inp) return;
      state[inp.getAttribute('data-group')] = parseInt(inp.value, 10);
      render();
    });
    render();
  });

  /* ---------- Live clocks ---------- */
  const clocks = $$('[data-tz]');
  function tick() {
    const now = new Date();
    clocks.forEach((el) => {
      try { el.textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-tz') }).format(now); } catch (_) { el.textContent = ''; }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 20000); }

  /* ---------- Project filters ---------- */
  const pf = $('[data-project-filters]');
  if (pf) {
    const f = { dir: 'all', ind: 'all' };
    const cards = $$('[data-project]');
    const empty = $('[data-projects-empty]');
    pf.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const g = chip.closest('[data-filter]').getAttribute('data-filter');
      f[g] = chip.getAttribute('data-value');
      $$('.chip', chip.closest('[data-filter]')).forEach((c) => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      let n = 0;
      cards.forEach((c) => {
        const ok = (f.dir === 'all' || c.getAttribute('data-dir') === f.dir) && (f.ind === 'all' || c.getAttribute('data-ind') === f.ind);
        c.hidden = !ok; if (ok) n++;
      });
      if (empty) empty.hidden = n > 0;
    });
  }

  /* ---------- Vacancy filter ---------- */
  const vs = $('[data-vacancy-search]');
  if (vs) {
    vs.addEventListener('input', () => {
      const q = vs.value.trim().toLowerCase();
      $$('[data-vacancy]').forEach((c) => { c.hidden = q && !c.textContent.toLowerCase().includes(q); });
    });
  }

  /* ---------- Smooth in-page anchors offset ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });
})();
