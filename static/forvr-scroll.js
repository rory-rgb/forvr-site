/* =====================================================================
   FORVR — shared scroll experience

     1. Chapter rail    — a persistent index of the page's chapters that
                          tracks position and inverts over dark chapters.
     2. Scroll progress — a hairline at the top of the viewport.

   NOTE ON SMOOTH SCROLL, so nobody adds it back.
   An inertial wheel-interception layer was built here and removed on
   2026-07-29 because it felt, in Rory's words, stiff and then suddenly
   flying. Measuring a simulated trackpad flick showed exactly that:

     total travel 636px, of which 636px happened AFTER input stopped,
     still moving 1.27s after the finger lifted.

   The cause is structural, not a tuning problem. macOS already eases
   trackpad input and sends a long decaying momentum tail, so easing the
   wheel deltas again integrates the same gesture twice: the page lags the
   finger while you move, then coasts once you stop. No lerp value fixes
   that, because the input is already a velocity curve, not a position.

   The continuity Rory wanted comes from choreography instead: one easing
   curve on every reveal, a consistent chapter rhythm, the rail and the
   progress hairline. The Bang, one of the two reference sites, likewise
   does not intercept scroll at all, and reads as the most composed page
   in the reference library.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- Reveal kit ----------------
     Drives [data-reveal] on every page. Replays: an element re-arms once it
     is completely clear of the viewport, matching the homepage behaviour
     Rory asked for. Entrances never gate reading, so a failure here leaves
     the page readable rather than blank. */
  function initRevealKit() {
    var nodes = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (!nodes.length) return;

    // Auto-index children of a [data-stagger] container so they arrive one
    // by one without hand-numbering every item in the markup.
    [].forEach.call(document.querySelectorAll('[data-stagger]'), function (group) {
      var kids = group.querySelectorAll('[data-reveal]');
      for (var i = 0; i < kids.length; i++) {
        if (!kids[i].style.getPropertyValue('--i')) kids[i].style.setProperty('--i', i);
      }
    });

    // Split short headlines into characters. Long strings are left alone:
    // per-character motion on a full sentence reads as noise, and it would
    // also mean hundreds of extra spans.
    [].forEach.call(document.querySelectorAll('[data-reveal="chars"]'), function (el) {
      var text = el.textContent.trim();
      if (text.length > 28 || el.querySelector('.rc')) { el.removeAttribute('data-reveal'); return; }
      var html = '', n = 0;
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === ' ') { html += ' '; continue; }
        html += '<span class="rc" style="transition-delay:' + (n * 26) + 'ms">' + ch.replace('&', '&amp;').replace('<', '&lt;') + '</span>';
        n++;
      }
      el.innerHTML = html;
    });

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
        } else {
          var r = e.boundingClientRect;
          if (r.bottom < 0 || r.top > window.innerHeight) e.target.classList.remove('is-revealed');
        }
      });
    }, { rootMargin: '-40px 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------------- Genie ----------------
     The macOS minimise move: a panel is sucked out of (or back into) a
     button, sides bowing toward the neck while it travels. Rory asked for
     it by name on the services tiles and the same primitive drives the
     Ask AI popup, so it lives here rather than per page.

     Pure clip-path polygon on rAF, no libraries. The panel must be
     position:absolute/fixed with its final box already laid out; this
     only animates the clip, so layout never thrashes. Reduced motion
     gets an instant cut. */
  window.forvrGenie = function (panel, anchor, open, done) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (panel.__genieRaf) { cancelAnimationFrame(panel.__genieRaf); panel.__genieRaf = 0; }
    if (reduce) {
      panel.style.clipPath = open ? 'none' : 'polygon(0 100%, 0 100%, 0 100%)';
      if (done) done();
      return;
    }
    var pr = panel.getBoundingClientRect();
    var ar = anchor.getBoundingClientRect();
    if (!pr.width || !pr.height) { if (done) done(); return; }
    // Neck: the anchor button's x-range projected onto the panel's nearest
    // horizontal edge (bottom if the button sits below the panel's centre).
    var n0 = Math.max(0, Math.min(96, ((ar.left - pr.left) / pr.width) * 100));
    var n1 = Math.max(n0 + 4, Math.min(100, ((ar.right - pr.left) / pr.width) * 100));
    var fromBottom = (ar.top + ar.height / 2) > (pr.top + pr.height / 2);
    var DUR = open ? 520 : 400;
    var t0 = performance.now();
    var K = 7; // samples per curved side

    function poly(p) {
      // p: 0 = fully in the button, 1 = full panel
      var topY = 100 * (1 - p);
      var TL = n0 * (1 - p);
      var TR = n1 + (100 - n1) * p;
      var q = Math.max(0, Math.min(1, (p - 0.55) / 0.45)); // neck releases late
      var BL = n0 * (1 - q);
      var BR = n1 + (100 - n1) * q;
      var bow = (1 - p); // how hard the sides hug the neck
      var pts = [];
      // left side, bottom -> top, quadratic bezier bowed toward the neck
      for (var i = 0; i <= K; i++) {
        var t = i / K;
        var cx = TL + (BL - TL) * bow * 0.85;   // control pulled toward the neck
        var x = (1 - t) * (1 - t) * BL + 2 * (1 - t) * t * cx + t * t * TL;
        var y = 100 + (topY - 100) * t;
        pts.push(x.toFixed(2) + '% ' + y.toFixed(2) + '%');
      }
      // top edge
      pts.push(TR.toFixed(2) + '% ' + topY.toFixed(2) + '%');
      // right side, top -> bottom
      for (var j = K; j >= 0; j--) {
        var t2 = j / K;
        var cx2 = TR + (BR - TR) * bow * 0.85;
        var x2 = (1 - t2) * (1 - t2) * BR + 2 * (1 - t2) * t2 * cx2 + t2 * t2 * TR;
        var y2 = 100 + (topY - 100) * t2;
        pts.push(x2.toFixed(2) + '% ' + y2.toFixed(2) + '%');
      }
      if (!fromBottom) {
        // Mirror vertically for a panel that opens downward from its anchor.
        pts = pts.map(function (pt) {
          var m = pt.split(' ');
          return m[0] + ' ' + (100 - parseFloat(m[1])).toFixed(2) + '%';
        });
      }
      return 'polygon(' + pts.join(', ') + ')';
    }

    function frame(now) {
      var raw = Math.max(0, Math.min(1, (now - t0) / DUR));
      var e = open ? (1 - Math.pow(1 - raw, 4))        // fast out of the button, soft landing
                   : Math.pow(1 - raw, 3);             // eases back in and accelerates home
      panel.style.clipPath = poly(open ? e : e);
      if (raw < 1) { panel.__genieRaf = requestAnimationFrame(frame); return; }
      panel.__genieRaf = 0;
      if (open) panel.style.clipPath = 'none';
      if (done) done();
    }
    panel.style.clipPath = poly(open ? 0 : 1);
    panel.__genieRaf = requestAnimationFrame(frame);
  };

  /* ---------------- Round-two rollout ----------------
     Frame count, drift, genie'd FAQ rows, genie'd nav popup, and the pass.
     All approved off /motion-lab. */

  function initFrameCount() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.forEach(function (el) {
      var text = el.textContent.trim();
      el.textContent = '';
      el.__cols = [];
      text.split('').forEach(function (ch) {
        if (!/[0-9]/.test(ch)) {
          var st = document.createElement('span'); st.textContent = ch; el.appendChild(st);
          return;
        }
        var wrap = document.createElement('span'); wrap.className = 'fcnt-digit';
        var col = document.createElement('span'); col.className = 'fcnt-col';
        '0123456789'.split('').concat(ch).forEach(function (n) {
          var sp = document.createElement('span'); sp.textContent = n; col.appendChild(sp);
        });
        wrap.appendChild(col); el.appendChild(wrap);
        el.__cols.push(col);
      });
      el.__play = function () {
        el.__cols.forEach(function (col, i) {
          var steps = col.children.length - 1;
          if (reduce) { col.style.transform = 'translateY(-' + steps + 'em)'; return; }
          col.style.transition = 'none';
          col.style.transform = 'translateY(0)';
          void col.offsetHeight;
          col.style.transition = 'transform ' + (0.9 + i * 0.1) + 's cubic-bezier(0.22,1,0.36,1)';
          col.style.transform = 'translateY(-' + steps + 'em)';
        });
      };
      // settle instantly so the number is never blank pre-view
      el.__cols.forEach(function (col) { col.style.transform = 'translateY(-' + (col.children.length - 1) + 'em)'; });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !e.target.__seen) { e.target.__seen = true; e.target.__play(); }
        else if (!e.isIntersecting) {
          var r = e.boundingClientRect;
          if (r.bottom < 0 || r.top > window.innerHeight) e.target.__seen = false;
        }
      });
    }, { rootMargin: '-40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function initDrift() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var imgs = [].slice.call(document.querySelectorAll('img[data-drift]'));
    if (!imgs.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      imgs.forEach(function (im) {
        var r = im.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var travel = parseFloat(im.getAttribute('data-drift')) || 8;
        var p = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2);
        im.style.transform = 'translateY(' + (p * -travel).toFixed(2) + '%)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initGenieDetails() {
    if (!window.forvrGenie) return;
    [].forEach.call(document.querySelectorAll('details.faq-item'), function (d) {
      var summary = d.querySelector('summary');
      var body = d.querySelector('.faq-body');
      if (!summary || !body) return;
      // The genie neck sits where the + marker lives: the right end of the
      // summary. forvrGenie only reads getBoundingClientRect, so a plain
      // object stands in for a real anchor element.
      var anchor = { getBoundingClientRect: function () {
        var r = summary.getBoundingClientRect();
        return { left: r.right - 46, right: r.right - 6, top: r.top, bottom: r.bottom, height: r.height, width: 40 };
      } };
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (!d.open) {
          d.open = true;
          body.style.visibility = 'visible';
          window.forvrGenie(body, anchor, true);
        } else {
          body.style.visibility = 'visible';
          window.forvrGenie(body, anchor, false, function () {
            body.style.visibility = '';
            d.open = false;
          });
        }
      });
    });
  }

  function initGenieNav() {
    var nav = document.querySelector('.floating-nav');
    var menu = nav && nav.querySelector('.nav-menu');
    var btn = document.getElementById('navToggle');
    if (!nav || !menu || !btn || !window.forvrGenie) return;
    var was = nav.classList.contains('open');
    new MutationObserver(function () {
      var is = nav.classList.contains('open');
      if (is === was) return;
      was = is;
      menu.style.visibility = 'visible';
      window.forvrGenie(menu, btn, is, is ? null : function () { menu.style.visibility = ''; });
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  /* The pass — internal navigation as an exposure sweep. The hairline leads
     a clean sheet across, the wordmark holds a beat, and the next page
     opens already covered and sweeps itself clear. */
  function initPass() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ov = document.createElement('div');
    ov.id = 'forvrPass';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="sheet"></div><div class="edge"></div>';
    document.body.appendChild(ov);
    var sheet = ov.querySelector('.sheet'), edge = ov.querySelector('.edge');
    var EASE = 'cubic-bezier(0.65,0,0.35,1)';
    var leaving = false;

    // Arrival: if the previous page swept in, we open covered and sweep out.
    if (sessionStorage.getItem('forvrPass') === '1') {
      sessionStorage.removeItem('forvrPass');
      ov.style.visibility = 'visible';
      sheet.style.transform = 'translateX(0)';
      requestAnimationFrame(function () {
        sheet.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(101%)' }], { duration: 300, easing: EASE, fill: 'forwards' });
        edge.animate([{ left: '0%', opacity: 1 }, { left: '100%', opacity: 0 }], { duration: 300, easing: EASE, fill: 'forwards' });
        setTimeout(function () { ov.style.visibility = 'hidden'; sheet.style.transform = ''; }, 340);
      });
    }

    document.addEventListener('click', function (e) {
      if (leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      // internal page navigations only — never anchors, mailto, external
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(href) && a.host !== location.host) return;
      if (/^(mailto:|tel:)/.test(href)) return;
      if (a.host && a.host !== location.host) return;
      if (a.pathname === location.pathname && a.hash) return;
      e.preventDefault();
      leaving = true;
      sessionStorage.setItem('forvrPass', '1');
      ov.style.visibility = 'visible';
      // Loader-quick, per Rory: no wordmark, no held beat. Cover in ~0.24s,
      // go, and the arriving page sweeps itself clear in ~0.3s.
      sheet.animate([{ transform: 'translateX(-101%)' }, { transform: 'translateX(0)' }], { duration: 240, easing: EASE, fill: 'forwards' });
      edge.animate([{ left: '0%', opacity: 1 }, { left: '100%', opacity: 1 }], { duration: 240, easing: EASE, fill: 'forwards' });
      setTimeout(function () { location.href = a.href; }, 260);
    });

    // Back-forward cache restores mid-transition state; reset it.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { leaving = false; ov.style.visibility = 'hidden'; sheet.style.transform = ''; }
    });
  }

  /* ---------------- Rail and progress ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initRevealKit();
    initFrameCount();
    initDrift();
    initGenieDetails();
    initGenieNav();
    initPass();

    // Ask AI popup rides the genie. The FAB's own inline script just toggles
    // .open; we watch that class and run the clip animation around it, so the
    // seven per-page copies of that script stay untouched.
    (function genieFab() {
      var fab = document.getElementById('askFab');
      var panel = document.getElementById('askFabPanel');
      var btn = document.getElementById('askFabToggle');
      if (!fab || !panel || !btn || !window.forvrGenie) return;
      var was = fab.classList.contains('open');
      new MutationObserver(function () {
        var is = fab.classList.contains('open');
        if (is === was) return;
        was = is;
        if (is) {
          panel.style.visibility = 'visible';
          window.forvrGenie(panel, btn, true);
        } else {
          panel.style.visibility = 'visible';
          window.forvrGenie(panel, btn, false, function () { panel.style.visibility = ''; });
        }
      }).observe(fab, { attributes: true, attributeFilter: ['class'] });
    })();

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
