/* BAUDHOUSE — shared behaviour for project pages.
   Each page sets window.BH_WORD before loading this (footer BFSK wave). */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- theme ---------- */
  var hasStored = false;
  try { hasStored = !!localStorage.getItem('bh-theme'); } catch (e) {}

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      hasStored = true;
      try { localStorage.setItem('bh-theme', theme); } catch (e) {}
    }
    var label = document.getElementById('mode-label');
    if (label) label.textContent = theme === 'light' ? 'PAPER' : 'DARK';
  }

  applyTheme(root.dataset.theme || 'dark', false);

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!hasStored) applyTheme(e.matches ? 'dark' : 'light', false);
  });

  /* ---------- footer waveform: page word as a BFSK square wave ---------- */
  (function buildWave() {
    var svg = document.getElementById('wave');
    if (!svg) return;
    var bits = [];
    (window.BH_WORD || 'BAUDHOUSE').split('').forEach(function (ch) {
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
  if (utc) {
    var clock = function () {
      var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
      utc.textContent = p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + 'Z';
    };
    clock();
    setInterval(clock, 1000);
  }

  /* ---------- click-to-copy SHA256 ---------- */
  var sha = document.getElementById('sha-copy');
  if (sha) {
    var full = sha.getAttribute('data-sha') || '';
    var short = full.slice(0, 10) + '…' + full.slice(-6);
    sha.textContent = short;
    var t;
    sha.addEventListener('click', function () {
      try { navigator.clipboard.writeText(full); } catch (e) {}
      sha.textContent = 'COPIED ✓';
      clearTimeout(t);
      t = setTimeout(function () { sha.textContent = short; }, 1600);
    });
  }

  /* ---------- OS note under the download button ---------- */
  var note = document.getElementById('os-note');
  if (note) {
    var ua = navigator.userAgent;
    var os = /Windows/i.test(ua) ? 'WINDOWS' : /Mac/i.test(ua) ? 'MACOS' : /Linux|X11/i.test(ua) ? 'LINUX' : null;
    if (os && os !== 'WINDOWS') {
      note.textContent = "YOU'RE ON " + os + ' — WINDOWS IS THE ONLY BUILD TODAY.';
    } else {
      note.remove();
    }
  }
})();
