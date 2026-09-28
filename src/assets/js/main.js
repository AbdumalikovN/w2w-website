/* Win to Win — интерактив и анимации сайта (GSAP + ScrollTrigger, если движение разрешено). */
(function () {
  'use strict';
  const W = window.W2W || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGsap && !reduceMotion;
  if (animate) { root.classList.add('anim-ready'); } else { root.classList.remove('motion'); }

  /* ---------- Header: compact capsule after scroll ---------- */
  const header = $('[data-header]');
  const darkZones = $$('.night, .hero-page.is-dark, .cta-card');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-compact', window.scrollY > 40);
    const probe = 40;
    header.classList.toggle('on-dark', darkZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; }));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation (glass sheet) ---------- */
  const burger = $('.burger');
  const mobileNav = $('#mobile-nav');
  function setMenu(open) {
    if (!burger || !mobileNav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    $$('a, button', mobileNav).forEach((el) => el.setAttribute('tabindex', open ? '0' : '-1'));
    document.body.classList.toggle('no-scroll', open);
  }
  if (burger) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    window.addEventListener('resize', () => { if (window.innerWidth > 1120) setMenu(false); });
  }

  /* ---------- Modals (sheets) ---------- */
  let lastFocus = null;
  function openModal(id) {
    const bg = $('#m-' + id);
    if (!bg) return;
    setMenu(false);
    lastFocus = document.activeElement;
    bg.hidden = false;
    document.body.classList.add('no-scroll');
    const first = $('input:not(.hp), select, textarea, button:not([data-close])', bg);
    if (first) setTimeout(() => first.focus(), 60);
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
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
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

  /* ---------- Tables: labels for the phone card layout ---------- */
  $$('.tbl').forEach((t) => {
    const heads = $$('thead th', t).map((th) => th.textContent.trim());
    if (!heads.length) return;
    $$('tbody tr', t).forEach((tr) => $$('td', tr).forEach((td, i) => td.setAttribute('data-label', heads[i] || '')));
    t.classList.add('tbl-cards');
    if (t.parentElement.classList.contains('tbl-wrap')) t.parentElement.classList.add('is-cards');
  });

  /* ---------- Segmented controls: sliding thumb ---------- */
  function placeThumb(seg, instant) {
    const thumb = $('.seg-thumb', seg);
    const on = $('[aria-checked="true"]', seg);
    if (!thumb || !on) return;
    if (instant) thumb.style.transition = 'none';
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + (on.offsetLeft - 3) + 'px)';
    if (instant) { thumb.offsetWidth; thumb.style.transition = ''; }
  }
  const segs = $$('.segmented');
  segs.forEach((s) => placeThumb(s, true));
  window.addEventListener('resize', () => segs.forEach((s) => placeThumb(s, true)));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => segs.forEach((s) => placeThumb(s, true)));

  /* ---------- Calculator ---------- */
  const C = W.calc;
  function calcRun(s) {
    const type = C.types.find((t) => t.id === s.type) || C.types[0];
    const dep = C.deploy.find((d) => d.id === s.deploy) || C.deploy[0];
    const urg = C.urgency.find((u) => u.id === s.urgency) || C.urgency[0];
    let extras = 0;
    s.extras.forEach((e) => { const x = C.extras.find((q) => q.id === e); if (x) extras += x.add; });
    const parts = [
      ['Агент: ' + type.label.toLowerCase(), 5000 * type.k, 1],
      ['Дополнительные каналы', Math.max(0, s.channels.length - 1) * 800, 2],
      ['Интеграции с системами', s.integrations * 1200, 3],
      ['Объём базы знаний', (C.knowledge.find((k) => k.id === s.knowledge) || C.knowledge[0]).add, 4],
      ['Дополнительные языки', Math.max(0, s.languages - 1) * 900, 5],
      ['SLA, контроль, интерфейс', extras, 6]
    ].filter((x) => x[1] > 0);
    let base = parts.reduce((a, x) => a + x[1], 0);
    const mult = [];
    if (dep.k !== 1) mult.push(dep.label + ' ×' + String(dep.k).replace('.', ','));
    if (urg.k !== 1) mult.push('срочный запуск ×' + String(urg.k).replace('.', ','));
    base *= dep.k * urg.k;
    const r500 = (n) => Math.round(n / 500) * 500;
    let lo = Math.max(C.minSetup || 5000, r500(base * 0.85));
    let hi = r500(base * 1.35);
    if (hi <= lo) hi = lo + 2500;
    const priv = s.deploy === 'private';
    const mLo = priv ? 1500 : 500, mHi = priv ? 5000 : 1500;
    let wLo = 4 + s.integrations, wHi = wLo + 4 + (priv ? 3 : 0) + (s.knowledge === 'l' ? 2 : 0);
    if (s.urgency === 'fast') { wLo = Math.max(3, Math.round(wLo * 0.8)); wHi = Math.max(wLo + 2, Math.round(wHi * 0.8)); }
    const pct = Math.min(1, hi / 60000);
    const people = 2 + (s.integrations >= 3 ? 1 : 0) + (priv ? 1 : 0) + (s.extras.includes('ui') ? 1 : 0);
    const sum = parts.reduce((a, x) => a + x[1], 0) || 1;
    return { lo, hi, mLo, mHi, wLo, wHi, pct, team: people + '–' + (people + 1) + ' специалиста и PM', parts: parts.map((x) => ({ label: x[0], share: x[1] / sum, c: x[2] })), mult };
  }
  const usd = (n) => '$' + Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ');
  const plural = (n, one, few, many) => { const m10 = n % 10, m100 = n % 100; return n + ' ' + ((m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? few : many); };
  function tweenRange(el, from, to) {
    const fmt = (a, b) => usd(Math.round(a / 500) * 500) + ' – ' + usd(Math.round(b / 500) * 500);
    if (!animate || !from) { el.textContent = fmt(to.lo, to.hi); return; }
    const o = { lo: from.lo, hi: from.hi };
    window.gsap.to(o, { lo: to.lo, hi: to.hi, duration: 0.6, ease: 'expo.out', overwrite: true, onUpdate: () => { el.textContent = fmt(o.lo, o.hi); } });
  }

  if (C) $$('[data-calc]').forEach((calcRoot) => {
    const state = JSON.parse(JSON.stringify(C.defaults));
    state.channels = state.channels.slice(); state.extras = state.extras.slice();
    const qsType = new URLSearchParams(location.search).get('type');
    if (qsType && C.types.some((t) => t.id === qsType)) state.type = qsType;
    let last = null;
    const out = (k) => $('[data-out="' + k + '"]', calcRoot);
    function syncControls() {
      $$('[data-group]', calcRoot).forEach((g) => {
        const name = g.getAttribute('data-group');
        const multi = g.hasAttribute('data-multi');
        $$('[data-value]', g).forEach((b) => {
          const v = b.getAttribute('data-value');
          const on = multi ? state[name].includes(v) : state[name] === v;
          b.setAttribute('aria-checked', String(on));
          b.classList.toggle('is-on', on);
        });
        if (g.classList.contains('segmented')) placeThumb(g);
      });
      $$('[data-toggle]', calcRoot).forEach((t) => t.setAttribute('aria-checked', String(state[t.getAttribute('data-toggle')] === t.getAttribute('data-on'))));
      $$('[data-stepper]', calcRoot).forEach((st) => {
        const k = st.getAttribute('data-stepper'), v = state[k];
        $('[data-step="-1"]', st).disabled = v <= +st.getAttribute('data-min');
        $('[data-step="1"]', st).disabled = v >= +st.getAttribute('data-max');
      });
    }
    function render() {
      const r = calcRun(state);
      const setup = out('setup'); if (setup) tweenRange(setup, last, r);
      const ring = out('ring'); if (ring) ring.style.strokeDashoffset = String(289 * (1 - Math.max(0.08, r.pct)));
      const m = out('monthly'); if (m) m.textContent = usd(r.mLo) + ' – ' + usd(r.mHi) + ' в месяц';
      const w = out('weeks'); if (w) w.textContent = r.wLo + '–' + r.wHi + ' недель';
      const t = out('team'); if (t) t.textContent = r.team;
      const oi = out('integrations'); if (oi) oi.textContent = plural(state.integrations, 'система', 'системы', 'систем');
      const ol = out('languages'); if (ol) ol.textContent = plural(state.languages, 'язык', 'языка', 'языков');
      $$('input[type="range"]', calcRoot).forEach((inp) => { const mn = +inp.min, mx = +inp.max; inp.value = state[inp.getAttribute('data-group')]; inp.style.setProperty('--fill', ((inp.value - mn) / (mx - mn) * 100).toFixed(1) + '%'); });
      const bar = out('stackbar');
      if (bar) {
        if (bar.children.length !== 6) bar.innerHTML = [1, 2, 3, 4, 5, 6].map((c) => '<i class="seg-c' + c + '"></i>').join('');
        const by = {}; r.parts.forEach((p) => { by[p.c] = p.share; });
        Array.from(bar.children).forEach((el, i) => { el.style.flexGrow = String(by[i + 1] || 0); el.style.display = by[i + 1] ? '' : 'none'; });
      }
      const parts = out('parts');
      if (parts) {
        parts.innerHTML = r.parts.map((p) => '<li><span class="ld seg-c' + p.c + '"></span><span></span><b>' + Math.round(p.share * 100) + '%</b></li>').join('');
        $$('li > span:nth-child(2)', parts).forEach((sp, i) => { sp.textContent = r.parts[i].label; });
      }
      const mu = out('mult');
      if (mu) { mu.hidden = !r.mult.length; mu.textContent = ''; if (r.mult.length) { mu.append('Коэффициенты: '); const b = document.createElement('b'); b.textContent = r.mult.join(', '); mu.append(b); } }
      const sm = out('summary');
      if (sm && last) sm.textContent = 'Оценка: внедрение ' + usd(r.lo) + ' – ' + usd(r.hi) + ', эксплуатация ' + usd(r.mLo) + ' – ' + usd(r.mHi) + ' в месяц, срок ' + r.wLo + '–' + r.wHi + ' недель.';
      syncControls();
      last = r;
    }
    calcRoot.addEventListener('click', (e) => {
      const tog = e.target.closest('[data-toggle]');
      if (tog) { const k = tog.getAttribute('data-toggle'); state[k] = state[k] === tog.getAttribute('data-on') ? tog.getAttribute('data-off') : tog.getAttribute('data-on'); render(); return; }
      const step = e.target.closest('[data-step]');
      if (step) {
        const st = step.closest('[data-stepper]'); const k = st.getAttribute('data-stepper');
        state[k] = Math.min(+st.getAttribute('data-max'), Math.max(+st.getAttribute('data-min'), state[k] + (+step.getAttribute('data-step'))));
        render(); return;
      }
      const opt = e.target.closest('[data-value]');
      if (!opt) return;
      const group = opt.closest('[data-group]');
      if (!group) return;
      const g = group.getAttribute('data-group');
      const v = opt.getAttribute('data-value');
      if (group.hasAttribute('data-multi')) {
        const arr = state[g];
        const i = arr.indexOf(v);
        if (i >= 0) { if (g === 'channels' && arr.length === 1) { if (animate) window.gsap.fromTo(opt, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); return; } arr.splice(i, 1); } else arr.push(v);
      } else state[g] = v;
      render();
    });
    calcRoot.addEventListener('keydown', (e) => {
      const opt = e.target.closest('[role="radio"]');
      if (!opt || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const opts = $$('[role="radio"]', opt.closest('[data-group]'));
      const i = opts.indexOf(opt) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
      const next = opts[(i + opts.length) % opts.length];
      e.preventDefault(); next.focus(); next.click();
    });
    calcRoot.addEventListener('input', (e) => {
      const inp = e.target.closest('input[type="range"][data-group]');
      if (!inp) return;
      state[inp.getAttribute('data-group')] = parseInt(inp.value, 10);
      render();
    });
    render();
  });

  /* ---------- Live clocks + phone lock screen ---------- */
  const clocks = $$('[data-tz]');
  const phoneClock = $('[data-phone-clock]');
  const phoneDate = $('[data-phone-date]');
  function tick() {
    const now = new Date();
    clocks.forEach((el) => {
      try { el.textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-tz') }).format(now); } catch (_) { el.textContent = ''; }
    });
    try {
      if (phoneClock) phoneClock.textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }).format(now);
      if (phoneDate) { const d = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Tashkent' }).format(now); phoneDate.textContent = d.charAt(0).toUpperCase() + d.slice(1); }
    } catch (_) { /* keep static */ }
  }
  if (clocks.length || phoneClock) { tick(); setInterval(tick, 20000); }

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
      const shown = [];
      cards.forEach((c) => {
        const ok = (f.dir === 'all' || c.getAttribute('data-dir') === f.dir) && (f.ind === 'all' || c.getAttribute('data-ind') === f.ind);
        c.hidden = !ok; if (ok) { n++; shown.push(c); }
      });
      if (empty) empty.hidden = n > 0;
      if (animate && shown.length) window.gsap.fromTo(shown, { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out', overwrite: true });
      if (animate) window.ScrollTrigger.refresh();
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

  /* ---------- Phone notifications stream ---------- */
  const notifBox = $('[data-notifs]');
  const NOTIFS = W.notifs || [];
  function notifHTML(n) {
    return '<span class="app-icon ic-' + n.tone + '"><svg><use href="#' + n.icon + '"/></svg></span><div><p class="notif-app"><span>' + esc(n.app) + '</span><span class="notif-time">сейчас</span></p><p class="notif-title">' + esc(n.title) + '</p><p class="notif-text">' + esc(n.text) + '</p></div>';
  }
  function startNotifs() {
    if (!notifBox || !NOTIFS.length) return;
    let idx = 4 % NOTIFS.length;
    setInterval(() => {
      if (document.hidden) return;
      const items = $$('.notif', notifBox);
      items.forEach((el, i) => { const t = $('.notif-time', el); if (t) t.textContent = (i + 1) * 3 + ' мин'; });
      const el = document.createElement('div');
      el.className = 'notif';
      el.innerHTML = notifHTML(NOTIFS[idx]);
      idx = (idx + 1) % NOTIFS.length;
      notifBox.prepend(el);
      const g = window.gsap;
      g.fromTo(el, { height: 0, opacity: 0, scale: 0.86, y: -18, paddingTop: 0, paddingBottom: 0, marginBottom: -8 }, { height: 'auto', opacity: 1, scale: 1, y: 0, paddingTop: 11, paddingBottom: 11, marginBottom: 0, duration: 0.75, ease: 'back.out(1.3)', clearProps: 'height,paddingTop,paddingBottom,marginBottom' });
      const extra = $$('.notif', notifBox).slice(4);
      extra.forEach((x) => g.to(x, { opacity: 0, scale: 0.9, duration: 0.35, onComplete: () => x.remove() }));
    }, 3200);
  }

  /* ================= ANIMATIONS ================= */
  if (!animate) {
    $$('.rings-svg .rf').forEach((c) => { c.style.strokeDashoffset = '0'; });
    return;
  }
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  gsap.defaults({ ease: 'expo.out', duration: 1 });

  /* Split headline words for blur-in reveal */
  function splitWords(el) {
    if (el.dataset.splitDone) return $$('.w', el);
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part) && !/ /.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    el.dataset.splitDone = '1';
    el.classList.add('is-split');
    return $$('.w', el);
  }

  /* ----- Home hero intro ----- */
  const hero = $('[data-hero]');
  if (hero) {
    const words = splitWords($('.display', hero));
    const tl = gsap.timeline({ delay: 0.1 });
    tl.to($('.live-pill', hero), { opacity: 1, y: 0, duration: 0.9 })
      .to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.07 }, 0.1)
      .to([$('.hero-lead', hero), $('.hero-cta', hero), $('.hero-meta', hero)], { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.55)
      .to($('.phone', hero), { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'expo.out' }, 0.5)
      .to($$('.float-w', hero), { opacity: 1, scale: 1, duration: 1.1, stagger: 0.12, ease: 'back.out(1.6)' }, 1.0)
      .add(startNotifs, 1.6);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      gsap.to('[data-hero-copy]', { y: -90, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '55% top', scrub: true } });
      gsap.to('[data-phone]', { y: -60, scale: 1.04, ease: 'none', scrollTrigger: { trigger: '[data-stage]', start: 'top 70%', end: 'bottom top', scrub: true } });
      $$('[data-float]', hero).forEach((el) => {
        const k = parseFloat(el.getAttribute('data-float'));
        gsap.to(el, { y: -220 * k, ease: 'none', scrollTrigger: { trigger: '[data-stage]', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
    $$('.float-w', hero).forEach((el, i) => gsap.to(el, { y: '+=10', duration: 3 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 + i * 0.3 }));
  }

  /* ----- Inner page hero intro ----- */
  const pageHero = $('.hero-page');
  if (pageHero) {
    const h = $('.h1', pageHero);
    if (h) { h.setAttribute('data-split-words', ''); const w = splitWords(h); gsap.set(w, { opacity: 0, y: '0.35em', filter: 'blur(10px)' }); gsap.to(w, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.05, stagger: 0.05, delay: 0.12 }); }
    gsap.to($$('.crumbs, .lead, .hero-cta, .hero-page-aside', pageHero), { opacity: 1, y: 0, duration: 1, stagger: 0.08, delay: 0.25 });
  }

  /* ----- Reveal on scroll ----- */
  const revealEls = $$('[data-reveal]').filter((el) => !el.closest('.hero-ios'));
  ST.batch(revealEls, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, overwrite: true })
  });
  // Cards and widgets across inner pages
  const autoCards = $$('.tile, .pcard, .person, .agent-grid > .agent-card, .figures > div, .flow > div, .two-lists > div, .panel, .index, .list, .faq, .ledger, .industries, .stack, .tbl-wrap, .facts, .own, .team-grid > *, .cases-2 > *, .contact-row').filter((el) => !el.closest('[data-reveal]') && !el.hasAttribute('data-reveal') && !el.closest('.hero-ios') && !el.closest('.modal-bg') && !el.closest('.hero-page'));
  gsap.set(autoCards, { opacity: 0, y: 40, scale: 0.985 });
  ST.batch(autoCards, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.07, overwrite: true, clearProps: 'transform' })
  });
  // Section headings on inner pages: blur-in words
  $$('.section .h2').filter((h) => !h.closest('[data-reveal]') && !h.hasAttribute('data-reveal') && !h.closest('.hero-ios')).forEach((h) => {
    const w = splitWords(h);
    gsap.set(w, { opacity: 0, y: '0.3em', filter: 'blur(8px)' });
    gsap.to(w, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.04, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  /* ----- Statement text scrub ----- */
  $$('[data-scrub-text]').forEach((p) => {
    const w = splitWords(p);
    gsap.set(w, { opacity: 0.14 });
    gsap.to(w, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 } });
  });

  /* ----- Counters ----- */
  $$('[data-count]').forEach((el) => {
    const to = +el.getAttribute('data-count');
    const from = el.hasAttribute('data-from') ? +el.getAttribute('data-from') : 0;
    const pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    const o = { v: from };
    el.textContent = pre + from + suf;
    gsap.to(o, { v: to, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; } });
  });

  /* ----- Agents: pinned horizontal rail ----- */
  const hs = $('[data-hscroll]');
  if (hs) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const track = $('[data-hs-track]', hs);
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: hs, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
    });
    gsap.fromTo($$('.agent-card', hs).slice(0, 4), { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 1.2, stagger: 0.08, clearProps: 'transform,opacity', scrollTrigger: { trigger: hs, start: 'top 75%', once: true } });
  }

  /* ----- Process rings: sticky rings, stages scroll past ----- */
  const rings = $('[data-rings]');
  if (rings) {
    const arcs = $$('.rf', rings);
    const stages = $$('.st-item', rings);
    const label = $('[data-rings-label]', rings), sub = $('[data-rings-sub]', rings);
    const names = stages.map((s) => $('h3', s).textContent);
    arcs.forEach((a) => { a.setAttribute('pathLength', '1'); a.style.strokeDasharray = '1 1'; a.style.strokeDashoffset = '1'; a.style.opacity = '0'; });
    const setActive = (i) => {
      stages.forEach((s, k) => s.classList.toggle('is-active', k === i));
      if (label) label.textContent = names[i] || '';
      if (sub) sub.textContent = 'этап ' + (i + 1) + ' из ' + stages.length;
    };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      rings.classList.add('is-live');
      const list = $('.stages', rings);
      const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 55%', end: 'bottom 55%', scrub: 0.6 } });
      arcs.forEach((a) => { tl.set(a, { opacity: 1 }); tl.to(a, { strokeDashoffset: 0.001, ease: 'none', duration: 1 }); });
      stages.forEach((st, i) => ST.create({ trigger: st, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setActive(i); } }));
      gsap.from(stages, { opacity: 0, y: 30, duration: 1, stagger: 0.1, scrollTrigger: { trigger: list, start: 'top 85%', once: true }, clearProps: 'opacity,transform' });
      return () => { rings.classList.remove('is-live'); };
    });
    mm.add('(max-width: 900px)', () => {
      gsap.set(arcs, { opacity: 1 });
      gsap.to(arcs, { strokeDashoffset: 0.001, duration: 1.6, stagger: 0.25, ease: 'power3.inOut', scrollTrigger: { trigger: rings, start: 'top 70%', once: true } });
    });
  }

  /* ----- TwinWin: typing query, skeleton, answer ----- */
  const twin = $('[data-twin]');
  if (twin) {
    const typer = $('[data-typer]', twin);
    const answer = $('[data-answer]', twin);
    const skel = $('[data-skel]', twin);
    const text = typer ? typer.textContent : '';
    if (typer) typer.textContent = '';
    gsap.set(answer, { opacity: 0, y: 16 });
    gsap.set($$('.src-chip, .cite', twin), { opacity: 0, scale: 0.8 });
    ST.create({
      trigger: $('.spot', twin), start: 'top 92%', once: true,
      onEnter: () => {
        let i = 0;
        const iv = setInterval(() => {
          i++; typer.textContent = text.slice(0, i);
          if (i >= text.length) {
            clearInterval(iv);
            gsap.timeline({ delay: 0.25 })
              .to(skel, { opacity: 0, duration: 0.3 })
              .to(answer, { opacity: 1, y: 0, duration: 0.8 }, 0.1)
              .to($$('.cite', twin), { opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2)' }, 0.35)
              .to($$('.src-chip', twin), { opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(1.6)' }, 0.45);
          }
        }, 22);
      }
    });
  }

  /* ----- Tiles: gentle 3D tilt on pointer (desktop) ----- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.agent-card, .tile, .pcard').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: x * 5, rotateX: -y * 5, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' }));
    });
  }

  window.addEventListener('load', () => ST.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
})();
