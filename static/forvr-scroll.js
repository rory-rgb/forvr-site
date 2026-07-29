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

  /* ---------------- Rail and progress ---------------- */
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
