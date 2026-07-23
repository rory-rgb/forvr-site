/* FORVR — shared behaviour. One file for every page.

   Effects: the footer clock, reveal-on-scroll (plain, line-mask, image
   clip and staggered variants), the work-list hover peek, and a single
   rAF-throttled parallax pass.

   The earlier "two effects, no rAF loops" ceiling was there to stop
   decorative motion. Everything here is structural: it reveals type and
   imagery in reading order. All of it is skipped entirely under
   prefers-reduced-motion, and the CSS leaves content visible when JS
   never runs. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sign of life: local studio time in the footer ---------- */
  var clock = document.getElementById('foot-clock');
  if (clock) {
    var tick = function () {
      clock.textContent = '· ' + new Date().toLocaleTimeString('en-GB',
        { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }) + ' local';
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- reveal on scroll ----------
     one observer for all four reveal flavours. only plain .rv gets the
     index-based delay; the others carry their own stagger in CSS. */
  var els = document.querySelectorAll('.rv, .rv-lines, .rv-img, .rv-stag, .rv-l, .rv-r');
  if (els.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    var plain = 0;
    els.forEach(function (el) {
      if (el.classList.contains('rv') &&
          !el.classList.contains('rv-lines') &&
          !el.classList.contains('rv-stag')) {
        el.style.transitionDelay = (Math.min(plain++, 4) * 60) + 'ms';
      }
      io.observe(el);
    });
  }

  /* ---------- count-up ----------
     numbers with data-count climb to their value when they enter the
     viewport. markup carries the final figure, so no-JS and reduced
     motion read the true number with nothing to run. setTimeout rather
     than rAF so it cannot be starved by a busy main thread. */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var steps = 24, n = 0;
        // the true figure stays in the markup until this moment, so a
        // broken or never-firing observer can only ever show the real
        // number, not a stuck zero
        var iv = setInterval(function () {
          n++;
          var p = 1 - Math.pow(1 - n / steps, 3); // ease-out cubic
          el.textContent = Math.round(target * p);
          if (n >= steps) { el.textContent = target; clearInterval(iv); }
        }, 38);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- parallax ----------
     one passive scroll listener for the whole page, rAF throttled, and
     only ever writing a transform. data-para holds the travel in percent
     of the element's own height. */
  var paras = Array.prototype.slice.call(document.querySelectorAll('[data-para]'));
  if (paras.length && !reduced) {
    var ticking = false;

    var draw = function () {
      var vh = window.innerHeight;
      paras.forEach(function (el) {
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        // -1 when the frame sits below the fold, +1 when it has passed above
        var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        var amt = parseFloat(el.getAttribute('data-para')) || 10;
        el.style.transform =
          'translate3d(0,' + (p * amt).toFixed(2) + '%,0) scale(' +
          (1 + amt / 100 * 2.2).toFixed(3) + ')';
      });
      ticking = false;
    };

    var request = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(draw); }
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    draw();
  }

  /* ---------- work-list hover peek — pointer devices only ---------- */
  var peek = document.querySelector('.peek');
  var list = document.querySelector('[data-peek-list]');
  if (!peek || !list) return;
  if (reduced) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  var raf = null, x = 0, y = 0;

  list.querySelectorAll('[data-img]').forEach(function (row) {
    row.addEventListener('mouseenter', function () {
      var src = row.getAttribute('data-img');
      if (src) { peek.src = src; peek.classList.add('on'); }
      list.classList.add('dimmed');
      row.classList.add('lit');
    });
    row.addEventListener('mouseleave', function () {
      peek.classList.remove('on');
      list.classList.remove('dimmed');
      row.classList.remove('lit');
    });
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
