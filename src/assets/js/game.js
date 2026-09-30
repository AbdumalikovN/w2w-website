/* Win to Win — mini-game «Охота на баги» (Bug Hunter).
   Bugs crawl through the code towards production: tap them before they ship. Don't tap features.
   Company Brain orb = auto-fix. 60 s, 3 uptime lives, combo up to ×4. Works with touch, mouse and keys 1–5. */
(function () {
  'use strict';
  var root = document.querySelector('[data-game]');
  if (!root) return;
  var W2W = window.W2W || {};
  var lang = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sfx = function (n) { if (window.W2WSound) window.W2WSound.play(n); };
  var RECORD = +root.getAttribute('data-record') || 18470;
  var HOLDER = root.getAttribute('data-holder') || 'Nuriddin Abdumalikov';
  var HROLE = root.getAttribute('data-holder-role') || 'COO';
  var AVA = root.getAttribute('data-ava') || '';
  var KEY = 'w2w-bh-best';

  var D = {
    ru: {
      title: 'Охота на баги', kicker: 'Мини-игра W2W',
      intro: 'Баги ползут по коду к продакшену. Ловите их, пока они не сломали релиз. Зелёные фичи не трогайте — их надо выпустить.',
      offer: 'Мы ответим на вашу заявку раньше, чем вы побьёте рекорд нашего COO.',
      play: 'Играть', again: 'Ещё раз', close: 'Закрыть', request: 'Оставить заявку',
      board: 'Таблица рекордов', you: 'Вы', best: 'Ваш рекорд', none: 'ещё нет',
      teams: ['Команда QA', 'Backend-отдел', 'Дизайнеры', 'Стажёры'],
      legend: [['bug', 'Баг', '+100'], ['fast', 'Быстрый баг', '+150'], ['tank', 'Живучий баг, 2 касания', '+250'], ['feat', 'Фича — не трогать', '−200'], ['orb', 'Company Brain — чинит всё', 'бонус']],
      keys: 'Касайтесь багов или жмите клавиши 1–5 — по дорожкам',
      score: 'Очки', time: 'Время', uptime: 'Аптайм', combo: 'Комбо',
      over: 'Релиз завершён', crashed: 'Прод упал', finalScore: 'Ваш результат',
      newBest: 'Новый личный рекорд!', toRecord: function (n) { return 'До рекорда COO осталось ' + n + ' очков'; },
      beat: 'Вы побили рекорд COO! Похоже, вам место в нашей команде QA.', career: 'Смотреть вакансии',
      caught: 'Поймано багов', shipped: 'Выпущено фич', autofix: 'Company Brain починил всё!', penalty: 'Это была фича!',
      live: function (s) { return 'Игра окончена. Результат: ' + s + ' очков.'; }
    },
    uz: {
      title: 'Xatolar ovi', kicker: 'W2W mini-o‘yini',
      intro: 'Xatolar kod bo‘ylab prodakshenga o‘rmalamoqda. Reliz buzilmasidan oldin ularni tuting. Yashil funksiyalarga tegmang — ular chiqarilishi kerak.',
      offer: 'COO rekordini yangilashingizdan oldin arizangizga javob beramiz.',
      play: 'O‘ynash', again: 'Yana bir bor', close: 'Yopish', request: 'Ariza qoldirish',
      board: 'Rekordlar jadvali', you: 'Siz', best: 'Sizning rekordingiz', none: 'hali yo‘q',
      teams: ['QA jamoasi', 'Backend bo‘limi', 'Dizaynerlar', 'Stajyorlar'],
      legend: [['bug', 'Xato', '+100'], ['fast', 'Tez xato', '+150'], ['tank', 'Chidamli xato, 2 marta', '+250'], ['feat', 'Funksiya — tegmang', '−200'], ['orb', 'Company Brain — hammasini tuzatadi', 'bonus']],
      keys: 'Xatolarga teging yoki 1–5 tugmalarini bosing',
      score: 'Ochko', time: 'Vaqt', uptime: 'Aptaym', combo: 'Kombo',
      over: 'Reliz yakunlandi', crashed: 'Prod yiqildi', finalScore: 'Natijangiz',
      newBest: 'Yangi shaxsiy rekord!', toRecord: function (n) { return 'COO rekordigacha ' + n + ' ochko qoldi'; },
      beat: 'Siz COO rekordini yangiladingiz! QA jamoamizda sizga joy bor.', career: 'Vakansiyalar',
      caught: 'Tutilgan xatolar', shipped: 'Chiqarilgan funksiyalar', autofix: 'Company Brain hammasini tuzatdi!', penalty: 'Bu funksiya edi!',
      live: function (s) { return 'O‘yin tugadi. Natija: ' + s + ' ochko.'; }
    },
    en: {
      title: 'Bug Hunt', kicker: 'W2W mini-game',
      intro: 'Bugs are crawling through the code towards production. Squash them before they break the release. Leave the green features alone — they need to ship.',
      offer: 'We will reply to your request before you beat our COO’s record.',
      play: 'Play', again: 'Play again', close: 'Close', request: 'Send a request',
      board: 'Leaderboard', you: 'You', best: 'Your best', none: 'none yet',
      teams: ['QA team', 'Backend team', 'Designers', 'Interns'],
      legend: [['bug', 'Bug', '+100'], ['fast', 'Fast bug', '+150'], ['tank', 'Tough bug, 2 taps', '+250'], ['feat', 'Feature — don’t tap', '−200'], ['orb', 'Company Brain — fixes everything', 'bonus']],
      keys: 'Tap the bugs or press keys 1–5 for the lanes',
      score: 'Score', time: 'Time', uptime: 'Uptime', combo: 'Combo',
      over: 'Release complete', crashed: 'Production is down', finalScore: 'Your score',
      newBest: 'New personal best!', toRecord: function (n) { return n + ' points to beat the COO'; },
      beat: 'You beat the COO’s record! Looks like there’s a seat for you in our QA team.', career: 'See open roles',
      caught: 'Bugs squashed', shipped: 'Features shipped', autofix: 'Company Brain fixed everything!', penalty: 'That was a feature!',
      live: function (s) { return 'Game over. Score: ' + s + ' points.'; }
    }
  };
  var T = D[lang] || D.ru;
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' '); };
  var getBest = function () { try { return +(localStorage.getItem(KEY) || 0); } catch (e) { return 0; } };
  var setBest = function (v) { try { localStorage.setItem(KEY, String(v)); } catch (e) { /* ignore */ } };
  /* таблица рекордов — сотрудники компании (src/_data/site.json → game.board); COO всегда первый */
  var AVA_BASE = root.getAttribute('data-ava-base') || '';
  var BOARD = [];
  try { BOARD = JSON.parse(root.getAttribute('data-board') || '[]').map(function (r) { return [r.name + ' · ' + r.role, r.score, !!r.top, r.photo ? AVA_BASE + r.photo + '-sq.webp' : '']; }); } catch (e) { BOARD = []; }
  if (!BOARD.length) BOARD = [[HOLDER + ' · ' + HROLE, RECORD, true, AVA], [T.teams[0], 15240], [T.teams[1], 12860], [T.teams[2], 9930], [T.teams[3], 7310]];

  /* ---------- DOM ---------- */
  var careerHref = (W2W.base || '/') + (lang === 'ru' ? '' : lang + '/') + 'career/';
  root.innerHTML =
    '<div class="bh-screen bh-start" data-bh-start>' +
      '<div class="bh-hero"><span class="bh-logo" aria-hidden="true"><svg><use href="#i-bug"/></svg></span><div><p class="bh-kicker">' + T.kicker + '</p><h3 class="bh-title">' + T.title + '</h3></div></div>' +
      '<p class="bh-intro">' + T.intro + '</p>' +
      '<ul class="bh-legend">' + T.legend.map(function (l) { return '<li><i class="bh-ico bh-ico-' + l[0] + '" aria-hidden="true"></i><span>' + l[1] + '</span><b>' + l[2] + '</b></li>'; }).join('') + '</ul>' +
      '<div class="bh-board"><p class="bh-board-h"><svg class="i" aria-hidden="true"><use href="#i-trophy"/></svg>' + T.board + '</p><ol data-bh-board></ol></div>' +
      '<p class="bh-offer"><span class="dot-live" aria-hidden="true"></span>' + T.offer + '</p>' +
      '<div class="bh-actions"><button class="btn btn-brand btn-lg" type="button" data-bh-play><svg class="i" aria-hidden="true"><use href="#i-play"/></svg>' + T.play + '</button><span class="bh-keys">' + T.keys + '</span></div>' +
    '</div>' +
    '<div class="bh-screen bh-game" data-bh-game hidden>' +
      '<div class="bh-hud">' +
        '<div class="bh-stat"><small>' + T.score + '</small><b data-bh-score>0</b></div>' +
        '<div class="bh-stat bh-combo" data-bh-combo-box><small>' + T.combo + '</small><b data-bh-combo>×1</b></div>' +
        '<div class="bh-stat bh-lives"><small>' + T.uptime + '</small><span data-bh-lives><i></i><i></i><i></i></span></div>' +
        '<div class="bh-stat bh-time"><small>' + T.time + '</small><b data-bh-time>60</b><i class="bh-tbar"><i data-bh-tbar></i></i></div>' +
      '</div>' +
      '<div class="bh-field" data-bh-field><canvas data-bh-cv aria-label="' + T.title + '"></canvas><p class="bh-toast" data-bh-toast></p></div>' +
    '</div>' +
    '<div class="bh-screen bh-over" data-bh-over hidden>' +
      '<p class="bh-kicker" data-bh-over-k>' + T.over + '</p>' +
      '<p class="bh-final"><small>' + T.finalScore + '</small><b data-bh-final>0</b></p>' +
      '<p class="bh-verdict" data-bh-verdict></p>' +
      '<ul class="bh-sum"><li><small>' + T.caught + '</small><b data-bh-caught>0</b></li><li><small>' + T.shipped + '</small><b data-bh-shipped>0</b></li><li><small>' + T.best + '</small><b data-bh-best>0</b></li></ul>' +
      '<div class="bh-board"><ol data-bh-board2></ol></div>' +
      '<div class="bh-actions"><button class="btn btn-brand btn-lg" type="button" data-bh-play><svg class="i" aria-hidden="true"><use href="#i-refresh"/></svg>' + T.again + '</button><button class="btn btn-glass" type="button" data-bh-request>' + T.request + '</button><a class="btn btn-glass" data-bh-career hidden href="' + careerHref + '">' + T.career + '</a></div>' +
    '</div>' +
    '<p class="sr-only" aria-live="polite" data-bh-live></p>';

  var $ = function (s) { return root.querySelector(s); };
  var scrStart = $('[data-bh-start]'), scrGame = $('[data-bh-game]'), scrOver = $('[data-bh-over]');
  var cv = $('[data-bh-cv]'), ctx = cv.getContext('2d'), field = $('[data-bh-field]');
  var elScore = $('[data-bh-score]'), elCombo = $('[data-bh-combo]'), elComboBox = $('[data-bh-combo-box]'), elLives = $('[data-bh-lives]'), elTime = $('[data-bh-time]'), elTbar = $('[data-bh-tbar]'), elToast = $('[data-bh-toast]');

  function renderBoard(ol, you) {
    var rows = BOARD.map(function (r) { return { n: r[0], s: r[1], coo: !!r[2], ava: r[3] || '' }; });
    var best = getBest();
    var me = Math.max(best, you || 0);
    if (me > 0) rows.push({ n: T.you, s: me, me: true });
    rows.sort(function (a, b) { return b.s - a.s; });
    rows = rows.slice(0, 6);
    if (me > 0 && !rows.some(function (r) { return r.me; })) rows[5] = { n: T.you, s: me, me: true, rank: '…' };
    ol.innerHTML = rows.map(function (r, i) {
      return '<li class="' + (r.coo ? 'is-coo' : '') + (r.me ? ' is-me' : '') + '"><span class="bh-rank">' + (r.rank || i + 1) + '</span>' +
        (r.ava ? '<img src="' + r.ava + '" alt="" width="28" height="28" loading="lazy">' : '<i class="bh-ava" aria-hidden="true"></i>') +
        '<span class="bh-n"></span><b>' + fmt(r.s) + '</b></li>';
    }).join('');
    Array.prototype.forEach.call(ol.querySelectorAll('.bh-n'), function (el, i) { el.textContent = rows[i].n; });
  }
  renderBoard($('[data-bh-board]'));

  /* ---------- game state ---------- */
  var DPR = Math.min(2, window.devicePixelRatio || 1), FW = 0, FH = 0, LANES = 5, laneW = 0, prodY = 0;
  var G = null, raf = 0, lastT = 0, running = false, paused = false;
  var codeLines = [];

  function resize() {
    var r = field.getBoundingClientRect();
    FW = Math.max(280, r.width); FH = Math.max(320, r.height);
    cv.width = Math.round(FW * DPR); cv.height = Math.round(FH * DPR);
    cv.style.width = FW + 'px'; cv.style.height = FH + 'px';
    laneW = (FW - 36) / LANES; prodY = FH - 46;
    codeLines = [];
    for (var y = 12; y < FH + 40; y += 18) {
      var segs = [], x = 44, n = 1 + Math.floor(Math.random() * 4);
      if (Math.random() < 0.15) { codeLines.push({ y: y, segs: [] }); continue; }
      x += Math.floor(Math.random() * 3) * 16;
      for (var k = 0; k < n; k++) { var w = 20 + Math.random() * 90; segs.push([x, w, Math.floor(Math.random() * 5)]); x += w + 8; }
      codeLines.push({ y: y, segs: segs });
    }
  }
  var laneX = function (l) { return 36 + laneW * (l + 0.5); };

  function newGame() {
    G = { t: 0, dur: 60, score: 0, lives: 3, streak: 0, mult: 1, lastHit: -9, objs: [], spawnT: 0.6, caught: 0, shipped: 0, slow: 0, shake: 0, flash: 0, fx: [], over: false, scroll: 0, orbCd: 14 };
  }
  function spawn() {
    var p = G.t / G.dur;
    var lane = Math.floor(Math.random() * LANES);
    if (G.objs.some(function (o) { return o.lane === lane && o.y < 60; })) lane = (lane + 2) % LANES;
    var r = Math.random(), type;
    G.orbCd -= 1;
    if (G.orbCd <= 0 && Math.random() < 0.25) { type = 'orb'; G.orbCd = 16 + Math.floor(Math.random() * 8); }
    else if (r < 0.16 + p * 0.06) type = 'feat';
    else if (r < 0.34 + p * 0.12) type = 'fast';
    else if (r < 0.44 + p * 0.14) type = 'tank';
    else type = 'bug';
    var base = 62 + p * 78;
    var sp = { bug: 1, fast: 1.65, tank: 0.8, feat: 0.95, orb: 0.9 }[type] * base * (0.9 + Math.random() * 0.2);
    G.objs.push({ type: type, lane: lane, x: laneX(lane), y: -24, v: sp, hp: type === 'tank' ? 2 : 1, wob: Math.random() * 6.28, r: type === 'orb' ? 20 : type === 'feat' ? 18 : 17, hit: 0 });
  }
  function toast(msg, cls) {
    elToast.textContent = msg; elToast.className = 'bh-toast is-on ' + (cls || '');
    clearTimeout(elToast._t); elToast._t = setTimeout(function () { elToast.className = 'bh-toast'; }, 1200);
  }
  function addFx(x, y, txt, col) { G.fx.push({ x: x, y: y, t: 0, txt: txt, col: col }); }
  function comboUp() {
    if (G.t - G.lastHit < 1.4) G.streak++; else G.streak = 1;
    G.lastHit = G.t;
    var m = Math.min(4, 1 + Math.floor(G.streak / 4));
    if (m > G.mult) { sfx('combo'); elComboBox.classList.remove('is-pop'); void elComboBox.offsetWidth; elComboBox.classList.add('is-pop'); }
    G.mult = m;
  }
  function breakCombo() { G.streak = 0; G.mult = 1; }
  var PTS = { bug: 100, fast: 150, tank: 250 };
  function squash(o) {
    if (o.type === 'feat') {
      G.score = Math.max(0, G.score - 200); breakCombo(); G.flash = 0.25; G.shake = 0.25;
      addFx(o.x, o.y, '−200', '#ff6b7a'); toast(T.penalty, 'is-bad'); sfx('error');
      o.dead = true; return;
    }
    if (o.type === 'orb') {
      sfx('powerup'); toast(T.autofix, 'is-good');
      G.slow = 3; o.dead = true;
      G.fx.push({ wave: true, x: o.x, y: o.y, t: 0 });
      G.objs.forEach(function (b) {
        if (b.dead || b.type === 'feat' || b.type === 'orb') return;
        b.dead = true; G.caught++; comboUp();
        var pts = PTS[b.type] * G.mult; G.score += pts; addFx(b.x, b.y, '+' + pts, '#3ff2cc');
      });
      return;
    }
    o.hp--; o.hit = 0.15;
    if (o.hp > 0) { sfx('tick'); return; }
    o.dead = true; G.caught++; comboUp();
    var p = PTS[o.type] * G.mult; G.score += p;
    addFx(o.x, o.y, '+' + p, o.type === 'fast' ? '#ffb020' : o.type === 'tank' ? '#c77dff' : '#7fe0ff');
    sfx('hit');
    if (navigator.vibrate && !reduce) try { navigator.vibrate(12); } catch (e) { /* ignore */ }
  }
  function tapAt(x, y) {
    if (!G || G.over) return;
    var best = null, bd = 1e9, slop = window.matchMedia('(pointer: coarse)').matches ? 16 : 8;
    G.objs.forEach(function (o) {
      if (o.dead) return;
      var d = Math.hypot(o.x - x, o.y - y);
      if (d < o.r + slop && d < bd) { bd = d; best = o; }
    });
    if (best) squash(best);
    else { breakCombo(); addFx(x, y, '·', 'rgba(255,255,255,0.5)'); }
  }
  function laneKey(l) {
    if (!G || G.over) return;
    var cand = G.objs.filter(function (o) { return !o.dead && o.lane === l && o.y > 0; }).sort(function (a, b) { return b.y - a.y; })[0];
    if (cand) squash(cand); else breakCombo();
  }

  /* ---------- drawing ---------- */
  var SYN = ['#7fe0ff', '#c77dff', '#3ff2cc', '#ffb020', '#8e97a8'];
  function drawBug(o, t) {
    var x = o.x + Math.sin(t * 6 + o.wob) * 3, y = o.y;
    var col = o.type === 'fast' ? '#ffb020' : o.type === 'tank' ? '#c77dff' : '#ff5a6e';
    ctx.save(); ctx.translate(x, y);
    if (o.hit > 0) ctx.scale(1.18, 1.18);
    ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
    var leg = Math.sin(t * 18 + o.wob) * 3;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(-6, i * 5); ctx.lineTo(-14, i * 6 + (i ? leg : -leg)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, i * 5); ctx.lineTo(14, i * 6 - (i ? leg : -leg)); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(-6, 15); ctx.moveTo(3, 8); ctx.lineTo(6, 15); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, -1, 8, 10.5, 0, 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-0.8, -9, 1.6, 18);
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(-3, 7, 1.6, 0, 6.2832); ctx.arc(3, 7, 1.6, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
    if (o.type === 'tank') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -1, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (o.hp / 2)); ctx.stroke(); }
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawFeat(o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.shadowColor = '#07e7b7'; ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(7,231,183,0.18)'; ctx.strokeStyle = '#07e7b7'; ctx.lineWidth = 1.5;
    roundRect(-26, -13, 52, 26, 9); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = '#3ff2cc'; ctx.font = '700 11px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✓ feat', 0, 1);
    ctx.restore();
  }
  var LOGO = null;
  try { LOGO = [new Path2D('M475.92,558.01l18.53-17.94s18.25,106.28,62.54,123.07c44.29,16.79,54.72-110.94,54.72-110.94l7.23-136.7,141.05-141.05s-28.68,508.29-151.48,530.89c0,0-64.87,12.17-106.6-148.28l-26.08-99.05h.08Z'), new Path2D('M344.75,612.26l14.46-14.03s14.26,83.01,48.83,96.13c34.61,13.12,42.75-86.6,42.75-86.6l5.65-106.75,110.15-110.15s-22.4,396.91-118.29,414.53c0,0-50.65,9.48-83.21-115.8l-20.35-77.36v.04Z')]; } catch (e) { LOGO = null; }
  function drawOrb(o, t) {
    ctx.save(); ctx.translate(o.x, o.y);
    var g = ctx.createRadialGradient(-6, -6, 2, 0, 0, 24);
    g.addColorStop(0, '#e6fbff'); g.addColorStop(0.35, '#4fd8ff'); g.addColorStop(1, 'rgba(10,188,243,0.1)');
    ctx.shadowColor = '#0abcf3'; ctx.shadowBlur = 24 + Math.sin(t * 6) * 6;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 19, 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#063a4f';
    if (LOGO) { /* знак компании (symbol #i-w, viewBox 335 262 445 555) вписан в круг */
      var k = 22 / 555; ctx.save(); ctx.translate(-445 * k / 2, -555 * k / 2); ctx.scale(k, k); ctx.translate(-335, -262); ctx.fill(LOGO[0]); ctx.fill(LOGO[1]); ctx.restore();
    } else { ctx.font = '800 15px Onest, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('W', 0, 1); }
    ctx.strokeStyle = 'rgba(127,224,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 25 + Math.sin(t * 4) * 2, 0, 6.2832); ctx.stroke();
    ctx.restore();
  }
  function draw(dt) {
    var t = G.t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var sx = G.shake > 0 ? (Math.random() - 0.5) * 10 * G.shake : 0, sy = G.shake > 0 ? (Math.random() - 0.5) * 10 * G.shake : 0;
    ctx.translate(sx, sy);
    ctx.fillStyle = '#0a0c11'; ctx.fillRect(-10, -10, FW + 20, FH + 20);
    /* code editor backdrop */
    G.scroll = (G.scroll + dt * 14) % 18;
    ctx.font = '500 10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    codeLines.forEach(function (ln, i) {
      var y = ln.y - G.scroll;
      ctx.fillStyle = 'rgba(235,235,245,0.18)'; ctx.fillText(String(i + 1), 28, y);
      ln.segs.forEach(function (s) { ctx.fillStyle = SYN[s[2]]; ctx.globalAlpha = 0.13; roundRect(s[0], y - 3, s[1], 6, 3); ctx.fill(); });
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(34, 0, 1, FH);
    for (var l = 1; l < LANES; l++) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(36 + laneW * l, 0, 1, prodY); }
    /* production line */
    ctx.strokeStyle = 'rgba(255,90,110,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(36, prodY); ctx.lineTo(FW - 8, prodY); ctx.stroke(); ctx.setLineDash([]);
    var pg = ctx.createLinearGradient(0, prodY, 0, FH); pg.addColorStop(0, 'rgba(255,90,110,0.18)'); pg.addColorStop(1, 'rgba(255,90,110,0)');
    ctx.fillStyle = pg; ctx.fillRect(36, prodY, FW - 44, FH - prodY);
    ctx.fillStyle = 'rgba(255,140,150,0.9)'; ctx.font = '700 10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left'; ctx.fillText('▼ production', 42, prodY + 14);
    ctx.fillStyle = 'rgba(235,235,245,0.35)'; ctx.textAlign = 'center';
    for (l = 0; l < LANES; l++) ctx.fillText(String(l + 1), laneX(l), FH - 12);
    /* objects */
    G.objs.forEach(function (o) {
      if (o.dead) return;
      if (o.type === 'feat') drawFeat(o); else if (o.type === 'orb') drawOrb(o, t); else drawBug(o, t);
    });
    /* fx */
    G.fx.forEach(function (f) {
      if (f.wave) {
        var k = f.t / 0.8; ctx.strokeStyle = 'rgba(10,188,243,' + (0.8 * (1 - k)) + ')'; ctx.lineWidth = 3 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, k * Math.max(FW, FH), 0, 6.2832); ctx.stroke(); return;
      }
      ctx.globalAlpha = Math.max(0, 1 - f.t / 0.7); ctx.fillStyle = f.col; ctx.font = '800 15px Onest, system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f.txt, f.x, f.y - f.t * 50); ctx.globalAlpha = 1;
    });
    if (G.slow > 0) { ctx.fillStyle = 'rgba(10,188,243,' + (0.08 * Math.min(1, G.slow)) + ')'; ctx.fillRect(0, 0, FW, FH); }
    if (G.flash > 0) { ctx.fillStyle = 'rgba(255,60,80,' + (G.flash * 0.9) + ')'; ctx.fillRect(0, 0, FW, FH); }
  }

  /* ---------- loop ---------- */
  function hud() {
    elScore.textContent = fmt(G.score);
    elCombo.textContent = '×' + G.mult;
    elComboBox.classList.toggle('is-hot', G.mult >= 3);
    var left = Math.max(0, Math.ceil(G.dur - G.t));
    if (elTime.textContent !== String(left)) elTime.textContent = left;
    elTbar.style.transform = 'scaleX(' + Math.max(0, 1 - G.t / G.dur).toFixed(4) + ')';
    Array.prototype.forEach.call(elLives.children, function (el, i) { el.classList.toggle('is-off', i >= G.lives); });
  }
  function step(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!paused) {
      var k = G.slow > 0 ? 0.45 : 1;
      G.t += dt; G.slow = Math.max(0, G.slow - dt); G.shake = Math.max(0, G.shake - dt); G.flash = Math.max(0, G.flash - dt * 1.6);
      G.spawnT -= dt;
      var p = G.t / G.dur, rate = 0.95 + p * 1.7;
      if (G.spawnT <= 0) { spawn(); if (p > 0.55 && Math.random() < 0.25) spawn(); G.spawnT = 1 / rate * (0.75 + Math.random() * 0.5); }
      G.objs.forEach(function (o) {
        if (o.dead) return;
        o.y += o.v * dt * k; o.hit = Math.max(0, o.hit - dt);
        if (o.y > prodY) {
          o.dead = true;
          if (o.type === 'feat') { G.shipped++; G.score += 50; addFx(o.x, prodY - 10, '+50', '#3ff2cc'); }
          else if (o.type === 'orb') { /* missed power-up */ }
          else { G.lives--; breakCombo(); G.flash = 0.45; G.shake = 0.4; sfx('miss'); addFx(o.x, prodY - 10, 'BUG IN PROD', '#ff6b7a'); if (navigator.vibrate && !reduce) try { navigator.vibrate([30, 40, 30]); } catch (e) { /* ignore */ } }
        }
      });
      G.objs = G.objs.filter(function (o) { return !o.dead; });
      G.fx.forEach(function (f) { f.t += dt; }); G.fx = G.fx.filter(function (f) { return f.t < (f.wave ? 0.8 : 0.7); });
      hud();
      draw(dt);
      if (G.lives <= 0 || G.t >= G.dur) { end(G.lives <= 0); return; }
    }
    raf = requestAnimationFrame(step);
  }
  function show(scr) { [scrStart, scrGame, scrOver].forEach(function (s) { s.hidden = s !== scr; }); }
  function start() {
    show(scrGame);
    resize(); newGame(); hud();
    running = true; paused = false; lastT = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
    cv.focus && field.focus();
    sfx('whoosh');
  }
  function end(crashed) {
    running = false; G.over = true;
    var best = getBest(), isBest = G.score > best;
    if (isBest) setBest(G.score);
    $('[data-bh-over-k]').textContent = crashed ? T.crashed : T.over;
    $('[data-bh-final]').textContent = fmt(G.score);
    $('[data-bh-caught]').textContent = G.caught;
    $('[data-bh-shipped]').textContent = G.shipped;
    $('[data-bh-best]').textContent = fmt(Math.max(best, G.score));
    var v = $('[data-bh-verdict]'), beat = G.score > RECORD;
    v.textContent = beat ? T.beat : (isBest ? T.newBest + ' ' : '') + T.toRecord(fmt(RECORD - G.score));
    v.className = 'bh-verdict' + (beat ? ' is-win' : isBest ? ' is-best' : '');
    $('[data-bh-career]').hidden = !beat;
    renderBoard($('[data-bh-board2]'), G.score);
    renderBoard($('[data-bh-board]'));
    show(scrOver);
    sfx(beat || isBest ? 'record' : 'gameover');
    $('[data-bh-live]').textContent = T.live(fmt(G.score));
    var btn = scrOver.querySelector('[data-bh-play]'); if (btn) setTimeout(function () { btn.focus(); }, 60);
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-bh-play]')) { start(); return; }
    if (e.target.closest('[data-bh-request]')) { if (W2W.openModal) W2W.openModal('request'); }
  });
  cv.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    var r = cv.getBoundingClientRect();
    tapAt(e.clientX - r.left, e.clientY - r.top);
  });
  field.setAttribute('tabindex', '0');
  field.addEventListener('keydown', function (e) {
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) { e.preventDefault(); laneKey(n - 1); }
  });
  document.addEventListener('keydown', function (e) {
    if (!running || scrGame.hidden) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5 && document.activeElement !== field) { e.preventDefault(); laneKey(n - 1); }
  });
  window.addEventListener('resize', function () { if (running) resize(); });
  document.addEventListener('visibilitychange', function () { if (running) { paused = document.hidden; lastT = performance.now(); } });
  document.addEventListener('w2w:modal-close', function (e) {
    if (e.detail && e.detail.id === 'game' && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; show(scrStart); renderBoard($('[data-bh-board]')); }
  });
  document.addEventListener('w2w:modal-open', function (e) { if (e.detail && e.detail.id === 'game') { show(scrStart); renderBoard($('[data-bh-board]')); } });
  window.W2WGame = { start: start };
})();
