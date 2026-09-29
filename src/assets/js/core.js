/* Win to Win — core: theme, header & menus, glass optics, modals, search, reveals, small widgets. */
(function () {
  'use strict';
  var W = window.W2W = window.W2W || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var lang = (root.getAttribute('lang') || 'ru').slice(0, 2);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reduceT = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var animate = hasGsap && !reduce;
  if (animate) { root.classList.add('anim-ready'); window.gsap.registerPlugin(window.ScrollTrigger); } else { root.classList.remove('motion'); }

  var DICT = {
    ru: { open: 'Открыть меню', close: 'Закрыть меню', soon: 'Ссылка скоро появится', min2: 'Введите минимум 2 символа.', loading: 'Загружаем индекс…', nothing: 'Ничего не нашли. Попробуйте другое слово.', copied: 'Скопировано', dark: 'Тёмная тема', light: 'Светлая тема', locale: 'ru-RU' },
    uz: { open: 'Menyuni ochish', close: 'Menyuni yopish', soon: 'Havola tez orada paydo bo‘ladi', min2: 'Kamida 2 ta belgi kiriting.', loading: 'Indeks yuklanmoqda…', nothing: 'Hech narsa topilmadi. Boshqa so‘z bilan urinib ko‘ring.', copied: 'Nusxa olindi', dark: 'Tungi mavzu', light: 'Kunduzgi mavzu', locale: 'uz-Latn-UZ' },
    en: { open: 'Open menu', close: 'Close menu', soon: 'Link coming soon', min2: 'Type at least 2 characters.', loading: 'Loading the index…', nothing: 'Nothing found. Try another word.', copied: 'Copied', dark: 'Dark theme', light: 'Light theme', locale: 'en-GB' }
  };
  var T = DICT[lang] || DICT.ru;

  W.lang = lang; W.animate = animate; W.reduce = reduce; W.fine = fine;
  W.ready = window.W2WBootReady || Promise.resolve();
  W.sfx = function (n) { if (window.W2WSound) window.W2WSound.play(n); };
  W.pick = function (d) { return d[lang] || d.ru; };
  W.$ = $; W.$$ = $$;

  /* ---------- toast ---------- */
  var toastEl = $('[data-toast]'), toastT = 0;
  W.toast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.is-todo, a[data-todo]');
    if (a) { e.preventDefault(); W.toast(T.soon); }
  });

  /* ---------- theme ---------- */
  var metaTheme = $('meta[data-theme-color]');
  function applyTheme(t, silent) {
    root.setAttribute('data-theme', t);
    if (metaTheme) metaTheme.content = t === 'dark' ? '#08090B' : '#F2F3F5';
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(t === 'dark'));
      if (b.classList.contains('hd-theme')) b.setAttribute('aria-label', t === 'dark' ? T.light : T.dark);
    });
    if (!silent) document.dispatchEvent(new CustomEvent('w2w:theme', { detail: { theme: t } }));
    onScroll();
  }
  W.theme = function () { return root.getAttribute('data-theme') || 'light'; };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = W.theme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('w2w-theme', next); } catch (err) { /* ignore */ }
    var r = b.getBoundingClientRect();
    if (document.startViewTransition && !reduce) {
      root.style.setProperty('--vt-x', (r.left + r.width / 2) + 'px');
      root.style.setProperty('--vt-y', (r.top + r.height / 2) + 'px');
      root.classList.add('theme-vt');
      var vt = document.startViewTransition(function () { applyTheme(next); });
      vt.finished.then(function () { root.classList.remove('theme-vt'); }, function () { root.classList.remove('theme-vt'); });
    } else applyTheme(next);
  });
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var s = null; try { s = localStorage.getItem('w2w-theme'); } catch (err) { /* ignore */ }
      if (!s) applyTheme(e.matches ? 'dark' : 'light');
    });
  } catch (err) { /* old Safari */ }

  /* ---------- sound toggles ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sound-toggle]');
    if (b && window.W2WSound) window.W2WSound.toggle();
  });

  /* ---------- header ---------- */
  var hd = $('[data-header]');
  var zones = [];
  W.refreshZones = function () { zones = $$('.night, .is-dark, [data-dark-zone]'); onScroll(); };
  function onScroll() {
    if (!hd) return;
    hd.classList.toggle('is-compact', window.scrollY > 30);
    var probe = 38, dark = false;
    if (W.theme() !== 'dark') {
      for (var i = 0; i < zones.length; i++) { var r = zones[i].getBoundingClientRect(); if (r.top <= probe && r.bottom >= probe) { dark = true; break; } }
    }
    hd.classList.toggle('on-dark', dark);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var openItem = null, openT = 0, closeT = 0;
  function megaBtn(li) { return $('.hd-link', li); }
  function openMega(li) {
    if (openItem === li) return;
    if (openItem) closeMega(openItem);
    closeLang();
    li.classList.add('is-open'); megaBtn(li).setAttribute('aria-expanded', 'true'); openItem = li;
    W.sfx('pop');
  }
  function closeMega(li) {
    if (!li) return;
    li.classList.remove('is-open'); megaBtn(li).setAttribute('aria-expanded', 'false');
    if (openItem === li) openItem = null;
  }
  $$('[data-mega]').forEach(function (li) {
    var btn = megaBtn(li);
    btn.addEventListener('click', function () { if (li.classList.contains('is-open')) closeMega(li); else openMega(li); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); openMega(li); var f = $('.mega-link', li); if (f) f.focus(); }
    });
    li.addEventListener('keydown', function (e) {
      if (!['ArrowDown', 'ArrowUp'].includes(e.key) || !e.target.closest('.mega')) return;
      var links = $$('.mega-link, .mega-promo', li), i = links.indexOf(e.target.closest('a'));
      e.preventDefault();
      var n = links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]; if (n) n.focus();
    });
    li.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(closeT); clearTimeout(openT);
      openT = setTimeout(function () { openMega(li); }, openItem ? 0 : 110);
    });
    li.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(openT);
      closeT = setTimeout(function () { closeMega(li); }, 200);
    });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) closeMega(li); });
  });

  var langBox = $('[data-lang-menu]');
  function closeLang() {
    if (!langBox || !langBox.classList.contains('is-open')) return;
    langBox.classList.remove('is-open'); $('.hd-lang-btn', langBox).setAttribute('aria-expanded', 'false');
  }
  if (langBox) {
    var lb = $('.hd-lang-btn', langBox);
    lb.addEventListener('click', function () {
      var open = !langBox.classList.contains('is-open');
      if (open) { if (openItem) closeMega(openItem); langBox.classList.add('is-open'); lb.setAttribute('aria-expanded', 'true'); W.sfx('pop'); var cur = $('a[aria-current="true"]', langBox); if (cur && !fine) cur.focus(); }
      else closeLang();
    });
    langBox.addEventListener('focusout', function (e) { if (!langBox.contains(e.relatedTarget)) closeLang(); });
  }
  /* remember the language choice */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-lang-link]');
    if (a) { try { localStorage.setItem('w2w-lang', a.getAttribute('data-lang-link')); } catch (err) { /* ignore */ } }
  });

  var burger = $('.hd-burger'), mnav = $('#mnav');
  function setMenu(open) {
    if (!hd || !burger || !mnav) return;
    if (open === hd.classList.contains('menu-open')) return;
    hd.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? T.close : T.open);
    if (open) mnav.removeAttribute('inert'); else mnav.setAttribute('inert', '');
    document.body.classList.toggle('no-scroll', open);
    W.sfx(open ? 'whoosh' : 'tap');
  }
  W.setMenu = setMenu;
  if (burger) burger.addEventListener('click', function () { setMenu(!hd.classList.contains('menu-open')); });
  if (mnav) mnav.addEventListener('click', function (e) { if (e.target.closest('[data-mnav-close]') || e.target.closest('a[href]')) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1240) setMenu(false); });

  document.addEventListener('click', function (e) {
    if (openItem && !openItem.contains(e.target)) closeMega(openItem);
    if (langBox && !langBox.contains(e.target)) closeLang();
  });

  /* ---------- glass optics: specular follows the pointer ---------- */
  if (fine && !reduce) {
    var sRaf = 0, sEv = null, sLast = null;
    var SPEC = '.lg, .hd-bar, .btn-glass, .btn-outline, [data-spec]';
    var applySpec = function () {
      sRaf = 0;
      var e = sEv; if (!e || !e.target || !e.target.closest) return;
      var el = e.target.closest(SPEC);
      if (sLast && sLast !== el) { sLast.style.removeProperty('--mx'); sLast.style.removeProperty('--my'); }
      if (el) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        el.style.setProperty('--rim-a', (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 57.2958 + 90).toFixed(0) + 'deg');
      }
      sLast = el;
    };
    document.addEventListener('pointermove', function (e) { sEv = e; if (!sRaf) sRaf = requestAnimationFrame(applySpec); }, { passive: true });
  }

  /* ---------- Liquid Glass refraction (Chromium: SVG displacement inside backdrop-filter) ---------- */
  var chromium = !!(navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands.some(function (b) { return /Chromium/i.test(b.brand); }));
  var defs = null, fid = 0;
  function dispMap(w, h, rad, bezel) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    var hw = w / 2, hh = h / 2, r = Math.min(rad, hw, hh);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - hw, py = y + 0.5 - hh, ax = Math.abs(px), ay = Math.abs(py);
        var qx = ax - (hw - r), qy = ay - (hh - r), dist, nx, ny;
        if (qx > 0 && qy > 0) { var l = Math.hypot(qx, qy); dist = r - l; nx = qx / l; ny = qy / l; }
        else if (qx > qy) { dist = r - qx; nx = 1; ny = 0; } else { dist = r - qy; nx = 0; ny = 1; }
        nx *= px < 0 ? -1 : 1; ny *= py < 0 ? -1 : 1;
        var k = dist < bezel ? Math.pow(1 - Math.max(0, dist) / bezel, 2.2) : 0;
        var i = (y * w + x) * 4;
        d[i] = 128 - nx * k * 127; d[i + 1] = 128 - ny * k * 127; d[i + 2] = 128; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function refract(el, prop, opt) {
    if (!chromium || reduceT || !el) return;
    opt = opt || {};
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs.setAttribute('aria-hidden', 'true'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
      defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      document.body.appendChild(defs);
    }
    var id = 'lgf' + (++fid), last = '';
    var run = function () {
      var r = el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if (w < 8 || h < 8) return;
      var key = w + 'x' + h; if (key === last) return; last = key;
      var rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 20;
      var sw = Math.min(w, 640), sh = Math.round(h * sw / w);
      var url = dispMap(sw, sh, rad * sw / w, (opt.bezel || 14) * sw / w);
      var f = document.getElementById(id);
      if (!f) {
        f = document.createElementNS('http://www.w3.org/2000/svg', 'filter'); f.id = id;
        f.setAttribute('color-interpolation-filters', 'sRGB');
        f.innerHTML = '<feImage result="m" preserveAspectRatio="none"/><feDisplacementMap in="SourceGraphic" in2="m" xChannelSelector="R" yChannelSelector="G"/>';
        defs.appendChild(f);
      }
      f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', w); f.setAttribute('height', h); f.setAttribute('filterUnits', 'userSpaceOnUse');
      var im = f.firstChild; im.setAttribute('href', url); im.setAttribute('x', '0'); im.setAttribute('y', '0'); im.setAttribute('width', w); im.setAttribute('height', h);
      f.lastChild.setAttribute('scale', String(opt.scale || 26));
      el.style.setProperty(prop, 'url(#' + id + ')');
    };
    run();
    if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(el._rt); el._rt = setTimeout(run, 120); }).observe(el);
  }
  W.refract = refract;
  if (hd) refract($('.hd-bar', hd), '--hd-refract', { scale: 22, bezel: 16 });
  $$('[data-refract]').forEach(function (el) { if (!el.classList.contains('hd-bar')) refract(el, '--refract', { scale: +(el.getAttribute('data-refract') || 26) || 26 }); });

  /* ---------- modals ---------- */
  var lastFocus = null, openBg = null;
  function focusables(box) { return $$('a[href], button:not([disabled]), input:not([disabled]):not(.hp), select, textarea, [tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; }); }
  function openModal(id, opener) {
    var bg = document.getElementById('m-' + id);
    if (!bg) return false;
    setMenu(false); if (openItem) closeMega(openItem); closeLang();
    if (openBg && openBg !== bg) closeModals(true);
    lastFocus = opener || document.activeElement;
    bg.hidden = false; openBg = bg;
    requestAnimationFrame(function () { bg.classList.add('is-in'); });
    document.body.classList.add('no-scroll');
    var first = $('[data-autofocus]', bg) || focusables($('.modal', bg))[1] || $('.modal', bg);
    setTimeout(function () { if (first && first.focus) first.focus({ preventScroll: true }); }, 80);
    if (id === 'search') ensureSearchIndex();
    W.sfx('pop');
    document.dispatchEvent(new CustomEvent('w2w:modal-open', { detail: { id: id } }));
    return true;
  }
  function closeModals(keepFocus) {
    if (!openBg) return;
    var bg = openBg; openBg = null;
    bg.classList.remove('is-in');
    var id = bg.id.replace(/^m-/, '');
    setTimeout(function () { if (!bg.classList.contains('is-in')) bg.hidden = true; }, 260);
    document.body.classList.remove('no-scroll');
    if (!keepFocus && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('w2w:modal-close', { detail: { id: id } }));
  }
  W.openModal = openModal; W.closeModals = closeModals;
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal]');
    if (opener) { e.preventDefault(); openModal(opener.getAttribute('data-modal'), opener); return; }
    if (e.target.closest('[data-close]')) { closeModals(); return; }
    if (e.target.classList && e.target.classList.contains('modal-bg')) closeModals();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (openBg) { closeModals(); return; }
      if (openItem) { var b = megaBtn(openItem); closeMega(openItem); b.focus(); return; }
      if (langBox && langBox.classList.contains('is-open')) { closeLang(); $('.hd-lang-btn', langBox).focus(); return; }
      setMenu(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openModal('search'); }
    if (e.key === 'Tab' && openBg) {
      var f = focusables($('.modal', openBg)); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- no form endpoint yet: hand the prepared text to WhatsApp / e-mail ---------- */
  var L = ({
    ru: { req: 'Заявка с сайта Win to Win', vac: 'Отклик на вакансию', company: 'Компания', name: 'Имя', contact: 'Контакт', task: 'Задача', dirs: 'Направления', budget: 'Бюджет', cv: 'Резюме', page: 'Страница' },
    uz: { req: 'Win to Win saytidan ariza', vac: 'Vakansiyaga ariza', company: 'Kompaniya', name: 'Ism', contact: 'Kontakt', task: 'Vazifa', dirs: 'Yo‘nalishlar', budget: 'Byudjet', cv: 'Rezyume', page: 'Sahifa' },
    en: { req: 'Request from the Win to Win website', vac: 'Job application', company: 'Company', name: 'Name', contact: 'Contact', task: 'Task', dirs: 'Areas', budget: 'Budget', cv: 'CV', page: 'Page' }
  })[lang] || {};
  W.sendLinks = function (box, title, rows) {
    var text = title + '\n' + rows.filter(function (r) { return r[1]; }).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n' + L.page + ': ' + location.href;
    var wa = $('[data-send-wa]', box), mail = $('[data-send-mail]', box);
    if (wa) wa.href = wa.getAttribute('href').split('?')[0] + '?text=' + encodeURIComponent(text);
    if (mail) mail.href = mail.getAttribute('href').split('?')[0] + '?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(text);
  };
  W.sendLabels = L;

  /* ---------- simple forms (vacancies etc.) ---------- */
  $$('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('[data-error]', form);
      var name = ((form.elements.name && form.elements.name.value) || '').trim();
      var contact = ((form.elements.contact && form.elements.contact.value) || '').trim();
      if (!name || !contact) { if (err) err.hidden = false; (name ? form.elements.contact : form.elements.name).focus(); return; }
      if (err) err.hidden = true;
      if (form.elements.website && form.elements.website.value) return;
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.form = form.getAttribute('data-form'); data.page = location.href; data.lang = lang;
      form.classList.add('is-sending');
      var go = function () { location.href = W.thanks || '/thanks/'; };
      if (W.formEndpoint) {
        fetch(W.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error('send'); go(); })
          .catch(function () { form.classList.remove('is-sending'); if (err) { err.hidden = false; } });
      } else {
        form.classList.remove('is-sending');
        var box = $('[data-form-send]', form);
        if (!box) { go(); return; }
        var vt = $('h1') ? $('h1').textContent.trim() : '';
        W.sendLinks(box, L.vac + (vt ? ': ' + vt : ''), [[L.name, name], [L.contact, contact], [L.cv, (data.cv || '').trim()]]);
        box.hidden = false; box.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  });

  /* ---------- search ---------- */
  var searchIndex = null, searchLoading = null;
  function ensureSearchIndex() {
    if (searchIndex || searchLoading) return searchLoading;
    var prefix = lang === 'ru' ? '' : lang + '/';
    searchLoading = fetch((W.base || '/') + prefix + 'search-index.json').then(function (r) { return r.json(); })
      .then(function (j) { searchIndex = j; return j; })
      .catch(function () { searchIndex = []; });
    return searchLoading;
  }
  var searchInput = $('[data-search-input]'), searchOut = $('[data-search-out]');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  W.esc = esc;
  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (!searchOut) return;
    if (q.length < 2) { searchOut.innerHTML = '<p class="muted">' + esc(T.min2) + '</p>'; return; }
    if (!searchIndex) { searchOut.innerHTML = '<p class="muted">' + esc(T.loading) + '</p>'; ensureSearchIndex().then(function () { runSearch(q); }); return; }
    var res = [];
    searchIndex.forEach(function (p) {
      var t = p.text.toLowerCase(), i = t.indexOf(q), inTitle = p.title.toLowerCase().indexOf(q) >= 0;
      if (i < 0 && !inTitle) return;
      var at = i < 0 ? 0 : i;
      res.push({ p: p, snip: p.text.slice(Math.max(0, at - 50), at + 90).replace(/\s+/g, ' '), score: (inTitle ? 2 : 0) + (i >= 0 ? 1 : 0) });
    });
    res.sort(function (a, b) { return b.score - a.score; });
    if (!res.length) { searchOut.innerHTML = '<p class="muted">' + esc(T.nothing) + '</p>'; return; }
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    searchOut.innerHTML = res.slice(0, 10).map(function (x) {
      return '<a href="' + esc(x.p.url) + '"><b>' + esc(x.p.title) + '</b><span>…' + esc(x.snip).replace(re, '<mark>$1</mark>') + '…</span></a>';
    }).join('');
  }
  if (searchInput) searchInput.addEventListener('input', function () { runSearch(searchInput.value); });

  /* ---------- tables → labelled cards on phones ---------- */
  $$('.tbl').forEach(function (t) {
    var heads = $$('thead th', t).map(function (th) { return th.textContent.trim(); });
    if (!heads.length) return;
    $$('tbody tr', t).forEach(function (tr) { $$('td', tr).forEach(function (td, i) { td.setAttribute('data-label', heads[i] || ''); }); });
    t.classList.add('tbl-cards');
    if (t.parentElement.classList.contains('tbl-wrap')) t.parentElement.classList.add('is-cards');
  });

  /* ---------- segmented controls: sliding thumb ---------- */
  function placeThumb(seg, instant) {
    var thumb = $('.seg-thumb', seg), on = $('[aria-checked="true"], [aria-selected="true"], [aria-pressed="true"]', seg);
    if (!thumb || !on) return;
    if (instant) thumb.style.transition = 'none';
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.height = on.offsetHeight + 'px'; thumb.style.bottom = 'auto';
    thumb.style.transform = 'translate(' + (on.offsetLeft - 3) + 'px,' + (on.offsetTop - 3) + 'px)';
    if (instant) { void thumb.offsetWidth; thumb.style.transition = ''; }
  }
  W.placeThumb = placeThumb;
  var segs = $$('.segmented');
  segs.forEach(function (s) { placeThumb(s, true); });
  window.addEventListener('resize', function () { segs.forEach(function (s) { placeThumb(s, true); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { segs.forEach(function (s) { placeThumb(s, true); }); });

  /* ---------- clocks ---------- */
  var clocks = $$('[data-tz]');
  function tick() {
    var now = new Date();
    clocks.forEach(function (el) {
      try { el.textContent = new Intl.DateTimeFormat(T.locale, { hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-tz') }).format(now); } catch (err) { el.textContent = ''; }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 20000); }

  /* ---------- project filters ---------- */
  var pf = $('[data-project-filters]');
  if (pf) {
    var f = { dir: 'all', ind: 'all' }, cards = $$('[data-project]'), empty = $('[data-projects-empty]');
    pf.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip'); if (!chip) return;
      var g = chip.closest('[data-filter]').getAttribute('data-filter');
      f[g] = chip.getAttribute('data-value');
      $$('.chip', chip.closest('[data-filter]')).forEach(function (c) { var on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      var shown = [];
      cards.forEach(function (c) {
        var ok = (f.dir === 'all' || c.getAttribute('data-dir') === f.dir) && (f.ind === 'all' || c.getAttribute('data-ind') === f.ind);
        c.hidden = !ok; if (ok) shown.push(c);
      });
      if (empty) empty.hidden = shown.length > 0;
      if (animate && shown.length) window.gsap.fromTo(shown, { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out', overwrite: true });
      if (animate) window.ScrollTrigger.refresh();
    });
  }
  var vs = $('[data-vacancy-search]');
  if (vs) vs.addEventListener('input', function () {
    var q = vs.value.trim().toLowerCase();
    $$('[data-vacancy]').forEach(function (c) { c.hidden = q && c.textContent.toLowerCase().indexOf(q) < 0; });
  });

  /* ---------- copy buttons ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var txt = b.getAttribute('data-copy');
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { W.toast(T.copied); }, function () {});
  });

  /* ---------- tilt (desktop) ---------- */
  if (fine && animate) {
    $$('[data-tilt]').forEach(function (card) {
      var k = parseFloat(card.getAttribute('data-tilt')) || 5;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        window.gsap.to(card, { rotateY: x * k, rotateX: -y * k, transformPerspective: 1000, duration: 0.6, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', function () { window.gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' }); });
    });
  }

  /* ---------- device screenshots: slow auto-scroll while visible ---------- */
  $$('[data-autoscroll]').forEach(function (box) {
    if (reduce) return;
    var anims = [];
    var run = function () {
      anims.forEach(function (a) { a.cancel(); }); anims = [];
      $$('.sc-scroll', box).forEach(function (sc) {
        var img = $('img', sc); if (!img || !img.animate) return;
        var go = function () {
          var dist = img.offsetHeight - sc.clientHeight; if (dist <= 0) return;
          anims.push(img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: 0.1 }, { transform: 'translateY(' + (-dist) + 'px)', offset: 0.9 }, { transform: 'translateY(' + (-dist) + 'px)' }], { duration: 16000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
        };
        if (img.complete && img.naturalHeight) go(); else img.addEventListener('load', go, { once: true });
      });
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!anims.length) run(); else anims.forEach(function (a) { a.play(); }); }
      else anims.forEach(function (a) { a.pause(); });
    }, { threshold: 0.2 }).observe(box);
  });

  /* ---------- text splitting helper ---------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return $$('.w', el);
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \t\n]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
    el.dataset.splitDone = '1'; el.classList.add('is-split');
    return $$('.w', el);
  }
  W.splitWords = splitWords;

  /* ---------- reveals & intros ---------- */
  function initMotion() {
    if (!animate) { $$('[data-count]').forEach(function (el) { el.textContent = (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); }); return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.defaults({ ease: 'expo.out', duration: 1 });

    var pageHero = $('.hero-page');
    if (pageHero) {
      var h = $('.h1', pageHero);
      if (h) { var w = splitWords(h); gsap.set(w, { opacity: 0, y: '0.35em', filter: 'blur(10px)' }); gsap.to(w, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.05, stagger: 0.05, delay: 0.1 }); }
      gsap.to($$('.crumbs, .lead, .hero-cta, .hero-page-aside, .hero-page-side', pageHero), { opacity: 1, y: 0, duration: 1, stagger: 0.08, delay: 0.25 });
    }

    if ($$('[data-reveal]').length) ST.batch($$('[data-reveal]'), { start: 'top 88%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, overwrite: true }); } });

    var auto = $$('.tile, .pcard, .agent-card, .figures > div, .flow > div, .two-lists > div, .panel, .index, .list, .faq, .ledger, .stack, .tbl-wrap, .facts, .own, .contact-row, .dcard, .pcard-x')
      .filter(function (el) { return !el.closest('[data-reveal]') && !el.hasAttribute('data-reveal') && !el.closest('.modal-bg') && !el.closest('.hero-page') && !el.closest('[data-no-auto]'); });
    if (auto.length) {
      gsap.set(auto, { opacity: 0, y: 40 });
      ST.batch(auto, { start: 'top 92%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, overwrite: true, clearProps: 'transform' }); } });
    }

    $$('.section .h2').filter(function (hh) { return !hh.closest('[data-reveal]') && !hh.hasAttribute('data-reveal') && !hh.closest('[data-no-auto]'); }).forEach(function (hh) {
      var ws = splitWords(hh);
      gsap.set(ws, { opacity: 0, y: '0.3em', filter: 'blur(8px)' });
      gsap.to(ws, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.04, scrollTrigger: { trigger: hh, start: 'top 88%', once: true } });
    });

    $$('[data-count]').forEach(function (el) {
      var to = +el.getAttribute('data-count'), from = el.hasAttribute('data-from') ? +el.getAttribute('data-from') : 0;
      var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '', o = { v: from };
      var fmtN = function (v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '\u00a0'); };
      el.textContent = pre + fmtN(from) + suf;
      gsap.to(o, { v: to, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onUpdate: function () { el.textContent = pre + fmtN(o.v) + suf; } });
    });

    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }

  W.refreshZones();
  applyTheme(W.theme(), true);
  W.ready.then(initMotion);
})();
