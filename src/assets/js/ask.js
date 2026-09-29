/* Win to Win — "Ask Company Brain" role demo: typed question → thinking over sources → rich answer. */
(function () {
  'use strict';
  var W2W = window.W2W || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var T = ({
    ru: { search: 'Ищу: ', done: 'Готово — в демо-режиме действие не выполняется' },
    uz: { search: 'Qidiryapman: ', done: 'Tayyor — demo rejimida amal bajarilmaydi' },
    en: { search: 'Searching: ', done: 'Done — actions are simulated in the demo' }
  })[lang] || { search: 'Ищу: ', done: 'Готово' };

  $$('[data-ask]').forEach(function (root) {
    var tabs = $$('[data-ask-role]', root), panels = $$('[data-ask-panel]', root);
    var qEl = $('[data-ask-q]', root), think = $('[data-ask-think]', root), win = $('[data-ask-win]', root);
    var cur = -1, token = 0, auto = true, inView = false, nextT = 0, READ = 9000;

    function wait(ms, tk) { return new Promise(function (res, rej) { setTimeout(function () { if (tk !== token) rej('stale'); else res(); }, ms); }); }
    function typeQ(text, tk) {
      if (reduce) { qEl.textContent = text; return Promise.resolve(); }
      return new Promise(function (res, rej) {
        var i = 0; qEl.textContent = '';
        (function step() {
          if (tk !== token) { rej('stale'); return; }
          i += 1 + (Math.random() < 0.3 ? 1 : 0);
          qEl.textContent = text.slice(0, i);
          if (i < text.length) setTimeout(step, 22 + Math.random() * 26); else res();
        })();
      });
    }
    function select(i, user) {
      if (user) { auto = false; }
      if (i === cur && !user) return;
      cur = i; token++;
      var tk = token;
      clearTimeout(nextT);
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', String(on)); t.setAttribute('tabindex', on ? '0' : '-1');
        t.classList.remove('is-timing');
      });
      var panel = panels[i];
      panels.forEach(function (p, k) { p.hidden = k !== i; p.classList.remove('is-in'); });
      panel.classList.add('is-wait');
      $$('.ask-btn', panel).forEach(function (b) { b.classList.remove('is-done'); });
      var q = ($('.sr-only', panel) || {}).textContent || '';
      var steps = $$('.ask-steps li', panel).map(function (li) { return li.textContent; });
      think.innerHTML = ''; think.classList.remove('is-done');
      if (W2W.sfx && user) W2W.sfx('tap');
      typeQ(q, tk)
        .then(function () { return wait(reduce ? 0 : 250, tk); })
        .then(function () {
          if (reduce) return;
          var chain = Promise.resolve();
          steps.forEach(function (s) {
            chain = chain.then(function () {
              var li = document.createElement('li'); li.textContent = T.search + s; think.appendChild(li);
              if (W2W.sfx && inView) W2W.sfx('tick');
              return wait(420, tk).then(function () { li.classList.add('is-ok'); });
            });
          });
          return chain.then(function () { return wait(250, tk); });
        })
        .then(function () {
          think.classList.add('is-done');
          panel.classList.remove('is-wait');
          void panel.offsetWidth; panel.classList.add('is-in');
          if (W2W.sfx && inView) W2W.sfx('pop');
          if (auto && inView) {
            var t = tabs[i]; t.style.setProperty('--ask-dur', READ + 'ms'); void t.offsetWidth; t.classList.add('is-timing');
            nextT = setTimeout(function () { if (auto && inView) select((cur + 1) % tabs.length); }, READ);
          }
        })
        .catch(function () { /* superseded */ });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, true); });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
        e.preventDefault(); var n = (i + d + tabs.length) % tabs.length; tabs[n].focus(); select(n, true);
      });
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ask-act]'); if (!b) return;
      b.classList.add('is-done');
      if (W2W.toast) W2W.toast(T.done);
      if (W2W.sfx) W2W.sfx('success');
    });
    if (win) win.addEventListener('pointerenter', function () { /* hovering pauses autoplay timer visually */ });
    var started = false;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView && !started) { started = true; select(0); }
      else if (inView && auto && !tabs[cur].classList.contains('is-timing')) { var c = cur; cur = -1; select(c); }
      if (!inView) { clearTimeout(nextT); tabs.forEach(function (t) { t.classList.remove('is-timing'); }); }
    }, { threshold: 0.3 }) : null;
    var begin = function () { if (io) io.observe(root); else { inView = true; select(0); } };
    (W2W.ready || Promise.resolve()).then(begin);
  });
})();
