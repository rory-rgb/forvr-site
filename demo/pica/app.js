/* ============================================================
   PICA
     1. REGISTRATION — the signature. Two ink plates sit out of
        true and SNAP to register. Pointer on desktop, viewport
        position on touch, and an explicit button for everyone.
     2. PASS COUNTER — a job builds one ink at a time, in discrete
        states. Never a cross-dissolve.
     3. PAPER PICKER — swaps the stock token; the overprint
        recomputes because it was never a chosen colour.
   Plus the PLATE reveal vocabulary.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ----------------------------------------------------------
     1. REGISTRATION
  ---------------------------------------------------------- */
  var hero = document.getElementById('hero');
  var regBtn = document.getElementById('regBtn');
  var regState = document.getElementById('regState');
  var locked = false;   // set by the button; overrides hover/scroll

  function setRegistered(on) {
    if (!hero) return;
    hero.classList.toggle('is-registered', on);
    if (regState) regState.textContent = on ? 'In register · 0px' : 'Out of true · 9px';
    if (regBtn) {
      regBtn.setAttribute('aria-pressed', String(on));
      regBtn.textContent = on ? 'Knock them out again' : 'Register the plates';
    }
  }

  if (regBtn) {
    regBtn.addEventListener('click', function () {
      locked = !hero.classList.contains('is-registered');
      setRegistered(locked);
      if (!locked) locked = false;
    });
  }

  if (!reduced.matches && hero) {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

    if (fine.matches) {
      // desktop: proximity to the plate stack
      addEventListener('pointermove', function (e) {
        if (locked) return;
        var r = hero.getBoundingClientRect();
        var cx = clamp(e.clientX, r.left, r.right);
        var cy = clamp(e.clientY, r.top, r.bottom);
        var d = Math.hypot(e.clientX - cx, e.clientY - cy);
        setRegistered(d < 90);
      }, { passive: true });
      addEventListener('pointerleave', function () { if (!locked) setRegistered(false); });
    } else {
      // touch: hold it out of true on arrival so the fringe is the first thing
      // seen, then snap once the reader has actually engaged with the page.
      addEventListener('scroll', function () {
        if (locked) return;
        setRegistered(window.scrollY > 140);
      }, { passive: true });
    }
  }

  /* ----------------------------------------------------------
     2. PASS COUNTER — discrete states, snapped, never blended
  ---------------------------------------------------------- */
  var track = document.getElementById('passTrack');
  var sheet = document.getElementById('sheet');
  var sheetCap = document.getElementById('sheetCap');
  var passList = document.getElementById('passList');
  var CAPS = ['Blank stock', 'Pass 1 · blue', 'Pass 2 · pink, 3mm out', 'Re-squared · in register'];

  function setPass(n) {
    if (!sheet || sheet.dataset.pass === String(n)) return;
    sheet.dataset.pass = String(n);
    sheetCap.textContent = CAPS[n];
    if (passList) {
      [].forEach.call(passList.children, function (li, i) {
        li.classList.toggle('on', i <= n);
      });
    }
  }

  if (sheet) {
    if (reduced.matches) {
      setPass(3);   // reduced motion sees the finished, registered sheet
    } else if (track) {
      var onPass = function () {
        var r = track.getBoundingClientRect();
        var total = track.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        var p = clamp(-r.top / total, 0, 1);
        // four equal bands -> a hard state change at each boundary
        setPass(Math.min(3, Math.floor(p * 4.0)));
      };
      addEventListener('scroll', onPass, { passive: true });
      addEventListener('resize', onPass);
      onPass();
    }
  }

  /* ----------------------------------------------------------
     3. PAPER PICKER
     Only --paper changes. The overprint swatch is two inks with
     mix-blend-mode: multiply, so it re-resolves against the new
     stock on its own — exactly as ink does on a different sheet.
  ---------------------------------------------------------- */
  var stocks = document.getElementById('stocks');
  if (stocks) {
    stocks.addEventListener('click', function (e) {
      var b = e.target.closest('.stock');
      if (!b) return;
      [].forEach.call(stocks.querySelectorAll('.stock'), function (o) {
        o.setAttribute('aria-pressed', String(o === b));
      });
      document.documentElement.style.setProperty('--paper', b.dataset.paper);
      var n = document.getElementById('paperName');
      if (n) n.textContent = b.dataset.name;
      // no artwork fix-up needed: the SVG plates reference var(--paper) and
      // var(--pink)/var(--blue) directly, so they re-resolve on their own.
    });
  }

  /* ----------------------------------------------------------
     4. PLATE reveal
  ---------------------------------------------------------- */
  var revs = document.querySelectorAll('[data-rev]');
  if (!('IntersectionObserver' in window) || reduced.matches) {
    revs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revs.forEach(function (el) { io.observe(el); });
  }
})();
