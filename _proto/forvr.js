/* FORVR — shared behaviour. One file for every page.
   Two effects total: reveal-on-scroll, and the work-list hover peek.
   No canvas, no rAF loops, no scroll-scrub. Animation ceiling is two
   steps (Post Archive Faction, 67k). */

(function () {
  'use strict';

  // reveal on scroll
  var els = document.querySelectorAll('.rv');
  if (els.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    els.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i, 4) * 60) + 'ms';
      io.observe(el);
    });
  }

  // work-list hover peek — pointer devices only
  var peek = document.querySelector('.peek');
  var list = document.querySelector('[data-peek-list]');
  if (!peek || !list) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  var raf = null, x = 0, y = 0;

  list.querySelectorAll('[data-img]').forEach(function (row) {
    row.addEventListener('mouseenter', function () {
      var src = row.getAttribute('data-img');
      if (src) { peek.src = src; peek.classList.add('on'); }
    });
    row.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
  });

  list.addEventListener('mousemove', function (e) {
    x = e.clientX; y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      peek.style.transform = 'translate(calc(' + x + 'px - 50%), calc(' + y + 'px - 50%))';
      raf = null;
    });
  });
})();
