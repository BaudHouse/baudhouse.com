/* BAUDHOUSE — carrier logic. No frameworks; the page must work with JS disabled. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  var hasStored = false;
  try { hasStored = !!localStorage.getItem('bh-theme'); } catch (e) {}

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      hasStored = true;
      try { localStorage.setItem('bh-theme', theme); } catch (e) {}
    }
    document.getElementById('mode-label').textContent = theme === 'light' ? 'PAPER' : 'DARK';
  }

  applyTheme(root.dataset.theme || 'dark', false);

  document.getElementById('theme-toggle').addEventListener('click', function () {
    applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
  });

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', function (e) {
    if (!hasStored) applyTheme(e.matches ? 'dark' : 'light', false);
  });

  /* ---------- wordmark demodulation ---------- */
  var lockText = document.getElementById('lock-text');
  var fig = document.getElementById('fig');
  var circle = document.getElementById('ocircle');
  var spans = Array.prototype.slice.call(document.querySelectorAll('#wordmark [data-bh-l]'));
  var NOISE = '#$%&@*+=/\\<>~^?!;:';
  var animating = false;
  var sawVisible = false;

  function setStage(n) {
    var stages = ['DIALING…', 'TRAINING…', 'LOCK ACQUIRED'];
    lockText.textContent = stages[n];
    lockText.classList.toggle('lock-pending', n !== 2);
    fig.classList.toggle('on', n === 2);
  }

  function settle() {
    spans.forEach(function (s) {
      s.textContent = s.getAttribute('data-bh-l');
      s.style.color = ''; s.style.fontFamily = ''; s.style.fontWeight = '';
    });
    animating = false;
    setStage(2);
  }

  function demodulate() {
    if (animating) return;
    /* tab opened in background: hold until first visible, then run (browsers throttle rAF in hidden tabs) */
    if (document.hidden && !sawVisible) {
      settle();
      var once = function () {
        if (!document.hidden) {
          sawVisible = true;
          document.removeEventListener('visibilitychange', once);
          demodulate();
        }
      };
      document.addEventListener('visibilitychange', once);
      return;
    }
    sawVisible = true;
    if (reduced || !spans.length) { settle(); return; }

    animating = true;
    setStage(0);
    var T = 850, start = performance.now();
    setTimeout(function () { if (animating) setStage(1); }, 320);

    if (circle) {
      var len = 2 * Math.PI * 41;
      circle.style.strokeDasharray = String(len);
      circle.style.transition = 'none';
      circle.style.strokeDashoffset = String(len);
      requestAnimationFrame(function () {
        circle.style.transition = 'stroke-dashoffset 850ms cubic-bezier(0.16,1,0.3,1)';
        circle.style.strokeDashoffset = '0';
      });
    }

    function tick(now) {
      var t = Math.min(1, (now - start) / T);
      var e = 1 - Math.pow(1 - t, 3); /* ease-out cubic */
      var lockedCount = Math.floor(e * spans.length + 1e-6);
      spans.forEach(function (s, i) {
        if (i < lockedCount) {
          s.textContent = s.getAttribute('data-bh-l');
          s.style.color = ''; s.style.fontFamily = ''; s.style.fontWeight = '';
        } else {
          s.textContent = NOISE[(Math.random() * NOISE.length) | 0];
          s.style.color = 'var(--faint)';
          s.style.fontFamily = 'var(--mono)';
          s.style.fontWeight = '500';
        }
      });
      if (t < 1) requestAnimationFrame(tick);
      else settle();
    }
    requestAnimationFrame(tick);
  }

  document.getElementById('wordmark-h').addEventListener('click', demodulate);
  demodulate();

  /* ---------- footer waveform: 'BAUDHOUSE' as BFSK square wave ---------- */
  (function buildWave() {
    var svg = document.getElementById('wave');
    if (!svg) return;
    var bits = [];
    'BAUDHOUSE'.split('').forEach(function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 7; i >= 0; i--) bits.push((c >> i) & 1);
    });
    var W = 1080 / bits.length, HI = 5, LO = 31;
    var d = 'M0 ' + HI, x = 0;
    bits.forEach(function (b) {
      var cycles = b ? 2 : 1, p = W / cycles;
      for (var c = 0; c < cycles; c++) {
        d += ' H' + (x + p / 2).toFixed(2) + ' V' + LO + ' H' + (x + p).toFixed(2) + ' V' + HI;
        x += p;
      }
    });
    svg.querySelector('path').setAttribute('d', d);
  })();

  /* ---------- UTC clock ---------- */
  var utc = document.getElementById('utc');
  function clock() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    utc.textContent = p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + 'Z';
  }
  clock();
  setInterval(clock, 1000);

  /* ---------- console ---------- */
  console.log(
    '%cBAUDHOUSE%c  CARRIER 9600 · LOCK ACQUIRED\nraw stream inspected. the footer waveform decodes to the obvious.\nsignal@baudhouse.com',
    'font-family:monospace;background:#FFB000;color:#0A0A0A;padding:2px 6px;font-weight:700',
    'font-family:monospace;color:#8F8F8F'
  );
})();
