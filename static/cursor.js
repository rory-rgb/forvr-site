/* Forvr custom crosshair cursor — cyan plus sign that follows the mouse.
   Hide native cursor, grow + tint on clickable elements, contract on click.
   Restores native cursor on form inputs so typing still feels right. */
(function() {
  if (window.__forvrCursorInit) return;
  window.__forvrCursorInit = true;

  // Respect touch devices — skip on hover-less inputs
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

  const style = document.createElement('style');
  style.textContent = `
    /* CROSSHAIR ONLY — no exceptions. Native cursor (and the browser's
       drag-image / text-select cursors) must never show through on top of
       the custom crosshair. Block native drag affordances on every media
       element so dragging an image or canvas does not pop the OS cursor. */
    html, body, *, *::before, *::after { cursor: none !important; }
    video, iframe, embed, object, canvas, img, svg { cursor: none !important; }
    input, textarea, select, [contenteditable="true"] { cursor: none !important; }
    button, a, [role="button"] { cursor: none !important; }
    img, video, svg, canvas, picture, embed, object {
      -webkit-user-drag: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    .forvr-cursor {
      position: fixed; top: 0; left: 0; width: 14px; height: 14px;
      pointer-events: none; z-index: 99999;
      /* Position via GPU-composited transform (translate3d) on an inner layer;
         scale states live on this element so the two never fight. */
      transform: translate3d(var(--cx, -100px), var(--cy, -100px), 0) translate(-50%, -50%) scale(1);
      transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), opacity 0.2s;
      filter: drop-shadow(0 0 4px rgba(91,194,231,0.45));
      will-change: transform;
    }
    .forvr-cursor::before, .forvr-cursor::after {
      content: ""; position: absolute; background: #5BC2E7;
      border-radius: 1px;
      transition: background 0.2s, opacity 0.2s, transform 0.25s cubic-bezier(0.22,1,0.36,1);
    }
    .forvr-cursor::before { left: 50%; top: 0; bottom: 0; width: 1.2px; transform: translateX(-50%); }
    .forvr-cursor::after { top: 50%; left: 0; right: 0; height: 1.2px; transform: translateY(-50%); }
    .forvr-cursor .ring {
      position: absolute; inset: 0; border: 1px solid rgba(91,194,231,0.0); border-radius: 50%;
      transition: border-color 0.25s, transform 0.3s cubic-bezier(0.22,1,0.36,1);
    }
    /* Hover state — spin the crosshair into an X and grow it. No ring. */
    .forvr-cursor.is-hover { transform: translate3d(var(--cx, -100px), var(--cy, -100px), 0) translate(-50%, -50%) scale(2) rotate(45deg); }
    .forvr-cursor.is-hover .ring { border-color: transparent; transform: scale(1); }
    /* Colour swaps for contrast: black on light backgrounds, white on dark.
       (Default cyan washes out over white/blue, so on hover we go monochrome.) */
    .forvr-cursor.is-hover::before,
    .forvr-cursor.is-hover::after { background: #0a0a0a; }
    .forvr-cursor.is-hover.on-dark::before,
    .forvr-cursor.is-hover.on-dark::after { background: #ffffff; }
    /* Pressed state */
    .forvr-cursor.is-down { transform: translate3d(var(--cx, -100px), var(--cy, -100px), 0) translate(-50%, -50%) scale(0.8); }
    /* Idle state before first mouse move */
    .forvr-cursor.is-idle { opacity: 0; }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'forvr-cursor is-idle';
  cursor.innerHTML = '<span class="ring"></span>';
  document.body.appendChild(cursor);

  let revealed = false;
  let lx = 0, ly = 0, queued = false;
  function paint() {
    queued = false;
    cursor.style.setProperty('--cx', lx + 'px');
    cursor.style.setProperty('--cy', ly + 'px');
  }
  document.addEventListener('mousemove', (e) => {
    lx = e.clientX; ly = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(paint); }
    if (!revealed) { cursor.classList.remove('is-idle'); revealed = true; }
  }, { passive: true });

  document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-down'));

  // Walk up from an element to find the first non-transparent background colour,
  // then decide if it's dark. Used to flip the hover cursor white only on dark.
  function bgIsDark(el) {
    let node = el;
    for (let i = 0; i < 6 && node && node !== document.documentElement; i++) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg && bg.match(/rgba?\(([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)(?:,\s*([0-9.]+))?\)/);
      if (m) {
        const a = m[4] === undefined ? 1 : parseFloat(m[4]);
        if (a > 0.2) {
          const lum = 0.2126*+m[1] + 0.7152*+m[2] + 0.0722*+m[3];
          return lum < 128;
        }
      }
      node = node.parentElement;
    }
    return true; // default: assume dark (site is black-dominant)
  }
  document.addEventListener('mouseover', (e) => {
    const hit = e.target.closest('a, button, [role="button"], input, textarea, select, label, .fvr-select-trigger, .fvr-select-list li, .ucard, .fcard, .ask-fab-toggle, .nav-item, .nav-toggle, .top-brand, .pillars-deck .fcard, .usp-orbit, .faq-item summary, .ask-more-cue, .sg-cell, .ladder-list li, .svc-row, .m-tile, .wheel-cue, .ai-ask-btn, .svc-link, .prompt-row, [data-svc]');
    if (hit) {
      cursor.classList.add('is-hover');
      cursor.classList.toggle('on-dark', bgIsDark(hit));
    } else {
      cursor.classList.remove('is-hover');
      cursor.classList.remove('on-dark');
    }
  });

  // Suppress native drag affordances site-wide (this is the OS cursor that
  // popped up when the user dragged on the studio ball image).
  document.addEventListener('dragstart', (e) => e.preventDefault());
  // (selectstart handler removed so visitors can highlight and copy text; image drag stays blocked via dragstart.)

  // Restore idle state if the tab loses focus / window blurs
  window.addEventListener('blur', () => cursor.classList.add('is-idle'));
  window.addEventListener('focus', () => { if (revealed) cursor.classList.remove('is-idle'); });
})();

/* Top-brand reveal — hidden by default so it never overlaps hero text on load.
   Desktop (hover-capable): appears while the pointer is in the top-left region,
   hides when it leaves. Touch (no hover): appears after a small scroll. Runs
   independently of the cursor module so it also applies on touch devices. */
(function() {
  if (window.__forvrBrandRevealInit) return;
  window.__forvrBrandRevealInit = true;

  var style = document.createElement('style');
  style.textContent =
    '.top-brand{opacity:0;pointer-events:none;transition:opacity .3s ease;}' +
    '.top-brand.brand-revealed{opacity:1;pointer-events:auto;}';
  document.head.appendChild(style);

  function init() {
    var brand = document.querySelector('.top-brand');
    if (!brand) return;
    var hoverCapable = !(window.matchMedia && window.matchMedia('(hover: none)').matches);
    if (hoverCapable) {
      // Reveal while the cursor is near the top-left corner; hide otherwise.
      var ZONE_X = 300, ZONE_Y = 130;
      var bx = 0, by = 0, bqueued = false;
      function bpaint(){ bqueued = false; brand.classList.toggle('brand-revealed', bx < ZONE_X && by < ZONE_Y); }
      document.addEventListener('mousemove', function(e) {
        bx = e.clientX; by = e.clientY;
        if (!bqueued) { bqueued = true; requestAnimationFrame(bpaint); }
      }, { passive: true });
      document.addEventListener('mouseleave', function() { brand.classList.remove('brand-revealed'); });
    } else {
      // Touch: no hover, so reveal after a small scroll instead.
      var ticking = false;
      function apply() { ticking = false; brand.classList.toggle('brand-revealed', (window.pageYOffset || 0) > 64); }
      window.addEventListener('scroll', function() { if (!ticking) { requestAnimationFrame(apply); ticking = true; } }, { passive: true });
      apply();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Accessibility layer — universal (every page, every device).
   1) prefers-reduced-motion: kill CSS animations/transitions and smooth-scroll
      for visitors who asked their device for less motion.
   2) focus-visible: a cyan outline so keyboard users can see where they are
      (the site hides the mouse cursor, so without this they were lost).
   3) skip-to-content: a hidden link, first in tab order, that jumps past the
      nav straight to the main content. Only visible when focused via keyboard. */
(function() {
  if (window.__forvrA11yInit) return;
  window.__forvrA11yInit = true;

  var css = [
    '@media (prefers-reduced-motion: reduce) {',
    '  *, *::before, *::after {',
    '    animation-duration: 0.001ms !important;',
    '    animation-iteration-count: 1 !important;',
    '    transition-duration: 0.001ms !important;',
    '    scroll-behavior: auto !important;',
    '  }',
    '  html { scroll-behavior: auto !important; }',
    '}',
    ':focus-visible {',
    '  outline: 2px solid #5BC2E7 !important;',
    '  outline-offset: 3px !important;',
    '  border-radius: 2px;',
    '}',
    '.skip-to-main {',
    '  position: fixed; top: -64px; left: 12px; z-index: 100000;',
    '  background: #0a0a0a; color: #fff; border: 1px solid #5BC2E7;',
    '  padding: 10px 14px; border-radius: 6px;',
    '  font-family: ui-monospace, "SF Mono", Menlo, monospace;',
    '  font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;',
    '  text-decoration: none; transition: top 0.2s ease;',
    '}',
    '.skip-to-main:focus { top: 12px; }'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function init() {
    if (document.querySelector('.skip-to-main')) return;
    var target = document.querySelector('main') || document.querySelector('body > section, section');
    if (target && !target.id) target.id = 'main';
    var link = document.createElement('a');
    link.href = '#' + (target && target.id ? target.id : 'main');
    link.className = 'skip-to-main';
    link.textContent = 'Skip to content';
    document.body.insertBefore(link, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Scroll-linked type drift — elements tagged .scroll-drift (or the existing
   dormant .reverse-on-scroll headings) glide horizontally as they pass through
   the viewport. Bidirectional: follows the scroll both down and back up, in the
   spirit of the hero wordmark reveal. Direction auto-alternates; override with
   data-drift-dir="1|-1", amplitude with data-drift="<px>" (x) / data-drift-y.
   Transform-only + rAF-batched, so it stays smooth; skipped for reduced-motion. */
(function() {
  if (window.__forvrDriftInit) return;
  window.__forvrDriftInit = true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    var els = Array.prototype.slice.call(
      document.querySelectorAll('.scroll-drift, .reverse-on-scroll')
    );
    if (!els.length) return;
    els.forEach(function(el, i) {
      el.style.willChange = 'transform';
      if (el.dataset.driftDir === undefined) el.dataset.driftDir = (i % 2 === 0) ? '1' : '-1';
    });

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var vw = window.innerWidth || document.documentElement.clientWidth;
      var defAmp = Math.min(vw * 0.035, 42); // subtle, won't push type off-screen
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) continue; // far offscreen: skip
        var center = r.top + r.height / 2;
        var p = (center - vh / 2) / (vh / 2 + r.height / 2); // +1 entering bottom -> -1 leaving top
        if (p > 1) p = 1; else if (p < -1) p = -1;
        var dir = parseFloat(el.dataset.driftDir) || 1;
        var ampX = el.dataset.drift !== undefined ? parseFloat(el.dataset.drift) : defAmp;
        var ampY = el.dataset.driftY !== undefined ? parseFloat(el.dataset.driftY) : 0;
        var x = p * ampX * dir;
        var y = p * ampY;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
    }
    function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* "Eyes on it" — the brand eye-glyph pupils track the cursor. Pointer-driven +
   eased; replaces the random dart with intentional watching (the blink stays).
   Skipped on touch (no hover) and for reduced-motion. */
(function() {
  if (window.__forvrEyeTrackInit) return;
  window.__forvrEyeTrackInit = true;
  if (window.matchMedia && (window.matchMedia('(hover: none)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;

  function init() {
    var eyes = Array.prototype.slice.call(document.querySelectorAll('.glyph-eye'));
    if (!eyes.length) return;
    eyes.forEach(function(svg) {
      var p = svg.querySelector('.pupil');
      if (p) { p.style.animation = 'none'; p.style.transition = 'transform 0.18s cubic-bezier(0.22,1,0.36,1)'; }
    });
    var mx = 0, my = 0, queued = false;
    function apply() {
      queued = false;
      for (var i = 0; i < eyes.length; i++) {
        var svg = eyes[i], p = svg.querySelector('.pupil');
        if (!p) continue;
        var r = svg.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > window.innerHeight) continue;
        var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var travel = Math.min(d / 150, 1) * 4; // up to ~4 SVG units, matches the eye scale
        p.style.transform = 'translate(' + (dx / d * travel).toFixed(2) + 'px,' + (dy / d * travel).toFixed(2) + 'px)';
      }
    }
    document.addEventListener('mousemove', function(e) {
      mx = e.clientX; my = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Decode/scramble reveal — elements tagged [data-scramble] resolve their text
   from random characters when they scroll into view, and re-decode on hover.
   Terminal-flavoured, on-brand for an AI studio. Skipped for reduced-motion.
   Only the element's leading text node is scrambled, so child markup (e.g. the
   accent dot span) is preserved. */
(function() {
  if (window.__forvrScrambleInit) return;
  window.__forvrScrambleInit = true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&._/';

  function scramble(node) {
    var final = node.__final != null ? node.__final : (node.__final = node.nodeValue);
    var len = final.length, start = 0, dur = 560, running = node.__run;
    if (running) return; node.__run = true;
    function done() { node.nodeValue = final; node.__run = false; }
    var guard = setTimeout(done, dur + 250); // hard fallback so it can never stay scrambled
    function step(ts) {
      if (!node.__run) return;
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), reveal = Math.floor(p * len), out = '';
      for (var i = 0; i < len; i++) {
        out += (i < reveal || final[i] === ' ') ? final[i] : CH[(Math.random() * CH.length) | 0];
      }
      node.nodeValue = out;
      if (p < 1) { requestAnimationFrame(step); } else { clearTimeout(guard); done(); }
    }
    requestAnimationFrame(step);
  }

  function init() {
    var els = document.querySelectorAll('[data-scramble]');
    if (!els.length) return;
    Array.prototype.forEach.call(els, function(el) {
      var tn = null;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3 && el.childNodes[i].nodeValue.trim()) { tn = el.childNodes[i]; break; }
      }
      if (!tn) return;
      el.addEventListener('mouseenter', function() { scramble(tn); });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function(es) {
          es.forEach(function(e) { if (e.isIntersecting) { scramble(tn); io.disconnect(); } });
        }, { threshold: 0.6 });
        io.observe(el);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
