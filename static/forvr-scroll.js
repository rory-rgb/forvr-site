/* =====================================================================
   FORVR — shared scroll experience
   Makes the whole site read as one continuous, planned scroll rather than
   a stack of independent sections. Three parts:

     1. Inertial scroll   — wheel input is eased into the native scroll
                            position, so every section arrives on the same
                            curve as every other one.
     2. Chapter rail      — a persistent index of the page's chapters that
                            tracks position and inverts over dark chapters.
     3. Scroll progress   — a hairline at the top of the viewport.

   Deliberate constraints:
     - It drives window.scrollTo, it does NOT transform a wrapper element.
       A transform-based virtual scroller breaks position:sticky, and this
       site pins the tile band with sticky.
     - Touch, keyboard, anchor jumps and reduced-motion all keep native
       behaviour. Only mouse-wheel input is eased.
   ===================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* ---------------- 1. Inertial scroll ---------------- */
  if (fine && !reduce) {
    var target = window.scrollY;
    var current = window.scrollY;
    var running = false;
    var LERP = 0.14;      // higher = snappier, lower = floatier
    var SNAP = 0.4;       // px below which we settle
    var selfDriven = 0;   // timestamp of the last scroll WE caused

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function frame() {
      var diff = target - current;
      if (Math.abs(diff) < SNAP) {
        current = target;
        selfDriven = Date.now();
        window.scrollTo(0, Math.round(current));
        running = false;
        return;
      }
      current += diff * LERP;
      selfDriven = Date.now();
      window.scrollTo(0, Math.round(current));
      requestAnimationFrame(frame);
    }

    function start() {
      if (!running) { running = true; requestAnimationFrame(frame); }
    }

    window.addEventListener('wheel', function (e) {
      // Let the browser handle zoom and any scroller that is not the page.
      if (e.ctrlKey) return;
      var el = e.target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollHeight > el.clientHeight + 2) {
          var cs = getComputedStyle(el).overflowY;
          if (cs === 'auto' || cs === 'scroll') return;
        }
        el = el.parentElement;
      }
      e.preventDefault();
      target = Math.max(0, Math.min(maxScroll(), target + e.deltaY));
      start();
    }, { passive: false });

    // Anything that moves the page by other means (keyboard, anchor jump,
    // scrollbar drag, find-in-page, resize, browser restore) leaves `target`
    // pointing at a stale position, and the next wheel event then yanks the
    // page back to it. Rather than guess at every source, watch the scroll
    // itself: any scroll we did not cause re-syncs us to reality.
    // (Timed listeners were tried first and lost the race with the smooth
    // anchor scroll, which yanked the page back 1400px on the next wheel.)
    window.addEventListener('scroll', function () {
      if (Date.now() - selfDriven > 120) {
        current = window.scrollY;
        if (!running) target = current;
      }
    }, { passive: true });

    // An anchor jump should hand control back to the browser for the duration
    // of its own smooth scroll.
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a) running = false;
    });
  }

  /* ---------------- 2 + 3. Rail and progress ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var chapters = [].slice.call(document.querySelectorAll('[data-chapter]'));

    // Progress hairline
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    var fill = bar.querySelector('i');

    // Chapter rail, only if the page declares chapters
    var rail = null, dots = [];
    if (chapters.length > 1) {
      rail = document.createElement('nav');
      rail.className = 'chapter-rail';
      rail.setAttribute('aria-label', 'Page chapters');
      chapters.forEach(function (sec) {
        var a = document.createElement('a');
        a.href = '#' + sec.id;
        a.setAttribute('aria-label', sec.getAttribute('data-chapter') || sec.id);
        a.title = sec.getAttribute('data-chapter') || sec.id;
        rail.appendChild(a);
        dots.push(a);
      });
      document.body.appendChild(rail);
    }

    var ticking = false;
    function update() {
      ticking = false;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var p = Math.max(0, Math.min(1, window.scrollY / max));
      fill.style.width = (p * 100).toFixed(2) + '%';

      if (!rail) return;
      // Which chapter owns the middle of the viewport
      var mid = window.scrollY + window.innerHeight * 0.5;
      var active = -1, onDark = false;
      for (var i = 0; i < chapters.length; i++) {
        var r = chapters[i].getBoundingClientRect();
        var top = r.top + window.scrollY;
        if (mid >= top && mid < top + r.height) { active = i; break; }
        if (mid >= top) active = i;
      }
      // The rail sits at the vertical middle, so it inverts against whatever
      // element is actually behind it there, not against the active chapter.
      var behind = document.elementFromPoint(window.innerWidth - 22, window.innerHeight / 2);
      while (behind && behind !== document.body) {
        if (behind.classList && (behind.classList.contains('is-dark') || behind.classList.contains('band') || behind.classList.contains('hero'))) { onDark = true; break; }
        behind = behind.parentElement;
      }
      rail.classList.toggle('on-dark', onDark);
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i === active); });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
