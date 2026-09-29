/* Win to Win — sound: synthesized UI sounds + generative ambient music (Web Audio, no files).
   Off by default. State in localStorage 'w2w-sound' ('on' | 'off').
   API: window.W2WSound = { enabled, play(name), toggle(), set(on) }; event 'w2w:sound' {detail:{on}} */
(function () {
  'use strict';
  var KEY = 'w2w-sound';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, sfxBus = null, musicBus = null, verb = null, delay = null;
  var enabled = false, musicTimer = null, nextNote = 0, step = 0, chordIdx = 0, padVoices = [];
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* ignore */ }

  function mk() {
    if (ctx || !AC) return !!ctx;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(comp);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(comp);
    /* reverb from generated impulse */
    verb = ctx.createConvolver();
    var len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = ir;
    var verbGain = ctx.createGain(); verbGain.gain.value = 0.42; verb.connect(verbGain); verbGain.connect(musicBus);
    delay = ctx.createDelay(1.5); delay.delayTime.value = 0.375;
    var fb = ctx.createGain(); fb.gain.value = 0.34;
    var dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600;
    delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(musicBus);
    return true;
  }

  /* ---------- UI sounds ---------- */
  function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function tone(type, f1, f2, dur, peak, when, dest) {
    var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.006, peak, dur); o.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, f1, f2, q, peak, when) {
    var t = ctx.currentTime + (when || 0), n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = ctx.createBufferSource(); s.buffer = b;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 1.2; f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = ctx.createGain(); env(g, t, dur * 0.35, peak, dur * 0.65);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
  }
  var SFX = {
    tap: function () { tone('sine', 1500, 900, 0.05, 0.06); },
    tick: function () { tone('sine', 2400, 2000, 0.02, 0.03); },
    toggle: function () { tone('triangle', 660, 0, 0.06, 0.08); tone('triangle', 990, 0, 0.08, 0.08, 0.06); },
    pop: function () { tone('sine', 420, 1250, 0.09, 0.1); },
    whoosh: function () { noise(0.34, 380, 2600, 0.9, 0.12); },
    success: function () { [1046.5, 1318.5, 1568, 2093].forEach(function (f, i) { tone('triangle', f, 0, 0.22, 0.07, i * 0.085); }); },
    error: function () { tone('square', 220, 170, 0.16, 0.04); tone('square', 196, 150, 0.2, 0.035, 0.12); },
    hit: function () { tone('triangle', 880, 1320, 0.07, 0.09); noise(0.05, 3000, 5000, 2, 0.05); },
    miss: function () { tone('sine', 320, 140, 0.14, 0.09); },
    combo: function () { [784, 988, 1175].forEach(function (f, i) { tone('triangle', f, 0, 0.09, 0.07, i * 0.05); }); },
    powerup: function () { tone('sawtooth', 300, 1600, 0.32, 0.05); tone('sine', 600, 2400, 0.32, 0.06, 0.04); },
    gameover: function () { [659, 523, 440, 330].forEach(function (f, i) { tone('triangle', f, f * 0.98, 0.22, 0.08, i * 0.16); }); },
    record: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone('triangle', f, 0, 0.24, 0.08, i * 0.1); }); }
  };
  function play(name) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    var fn = SFX[name]; if (fn) { try { fn(); } catch (e) { /* ignore */ } }
  }

  /* ---------- generative ambient ---------- */
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  var CHORDS = [[57, 60, 64, 71], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 66]]; /* Am(add9-ish) · Fmaj7 · Cmaj7 · G(add#11) */
  var SCALE = [69, 72, 74, 76, 79, 81, 84, 86];
  function padChord(t, notes, dur) {
    padVoices = padVoices.filter(function (v) { return v.end > ctx.currentTime; });
    notes.forEach(function (m, i) {
      [-6, 6].forEach(function (det) {
        var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det + (i * 2 - 3);
        f.type = 'lowpass'; f.frequency.setValueAtTime(420, t); f.frequency.linearRampToValueAtTime(980, t + dur * 0.5); f.frequency.linearRampToValueAtTime(520, t + dur); f.Q.value = 0.6;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.012, t + 2.2); g.gain.setValueAtTime(0.012, t + dur - 1.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 2);
        o.connect(f); f.connect(g); g.connect(musicBus); g.connect(verb);
        o.start(t); o.stop(t + dur + 2.2);
        padVoices.push({ end: t + dur + 2.2 });
      });
    });
    /* sub */
    var so = ctx.createOscillator(), sg = ctx.createGain();
    so.type = 'sine'; so.frequency.value = mtof(notes[0] - 12);
    sg.gain.setValueAtTime(0.0001, t); sg.gain.linearRampToValueAtTime(0.03, t + 1.5); sg.gain.linearRampToValueAtTime(0.0001, t + dur + 1);
    so.connect(sg); sg.connect(musicBus); so.start(t); so.stop(t + dur + 1.2);
  }
  function pluck(t, m, vel) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 * vel, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f); f.connect(g); g.connect(musicBus); g.connect(delay); g.connect(verb);
    o.start(t); o.stop(t + 1.3);
  }
  var BAR = 8; /* seconds per chord */
  function schedule() {
    if (!ctx) return;
    while (nextNote < ctx.currentTime + 0.4) {
      if (step % 16 === 0) { padChord(nextNote, CHORDS[chordIdx % CHORDS.length], BAR); chordIdx++; }
      var chord = CHORDS[(chordIdx - 1 + CHORDS.length) % CHORDS.length];
      if (Math.random() < (step % 4 === 0 ? 0.55 : 0.22)) {
        var pool = SCALE.filter(function (n) { return chord.some(function (c) { return (n - c) % 12 === 0; }) || Math.random() < 0.25; });
        var m = pool[Math.floor(Math.random() * pool.length)] || 76;
        pluck(nextNote, m, 0.5 + Math.random() * 0.5);
      }
      nextNote += BAR / 16; step++;
    }
  }
  function musicStart() {
    if (!ctx || musicTimer) return;
    nextNote = ctx.currentTime + 0.1; step = 0;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 2.5);
    schedule(); musicTimer = setInterval(schedule, 120);
  }
  function musicStop() {
    if (!ctx) return;
    clearInterval(musicTimer); musicTimer = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  }

  /* ---------- state ---------- */
  function syncUI() {
    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(enabled));
    });
    document.documentElement.classList.toggle('sound-on', enabled);
  }
  function start() {
    if (!mk()) return;
    var go = function () { musicStart(); };
    if (ctx.state !== 'running') ctx.resume().then(go, function () {}); else go();
  }
  function set(on, silent) {
    enabled = !!on;
    try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
    syncUI();
    if (enabled) { start(); if (!silent) setTimeout(function () { play('toggle'); }, 60); }
    else { musicStop(); }
    document.dispatchEvent(new CustomEvent('w2w:sound', { detail: { on: enabled } }));
  }
  function toggle() { set(!enabled); }

  /* remember the choice across pages: audio may only start after a gesture */
  if (stored === 'on' && AC) {
    enabled = true;
    var arm = function () {
      document.removeEventListener('pointerdown', arm, true);
      document.removeEventListener('keydown', arm, true);
      if (enabled) start();
    };
    document.addEventListener('pointerdown', arm, true);
    document.addEventListener('keydown', arm, true);
  }
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend(); } else if (enabled) { ctx.resume(); }
  });
  document.addEventListener('DOMContentLoaded', syncUI);

  /* delegated UI sounds */
  document.addEventListener('click', function (e) {
    if (!enabled) return;
    var t = e.target.closest ? e.target.closest('[data-sound-toggle]') : null;
    if (t) return;
    var sw = e.target.closest('[role="switch"], [aria-pressed], .chip, [role="radio"], [role="tab"]');
    if (sw) { play('tick'); return; }
    if (e.target.closest('a, button, summary')) play('tap');
  }, true);

  window.W2WSound = {
    get enabled() { return enabled; },
    play: play, toggle: toggle, set: set
  };
})();
