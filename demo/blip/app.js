/* ============================================================
   BLIP v3 — the Hollow
   One script for all twenty pages. Every block checks for its
   own markup first, so the home page runs the ring, the dive and
   the trail, and a character page runs only the bag.

   1  THE INCUBATOR   full-bleed 3D ring, drag / flick / arrow / click,
                      the front pod cracks open and its card is a
                      small product page
   2  THE DIVE        the descent from the sky into the burrow
   3  THE TRAIL       the path through the world, drawn by scrolling
   4  THE SHELVES     filtering, which is all that is left client side
   5  THE BAG         line items, subtotal, delivery threshold, bag page
   ============================================================ */
(function () {
  'use strict';

  var D = window.BLIP || {};
  var SET = D.SET || [], GROUPS = D.GROUPS || [], BUNDLES = D.BUNDLES || [];
  var PRICE = D.PRICE || 16, FREE = D.FREE || 30;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var doc = document.documentElement;
  doc.classList.add('js');
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var money = function (p) { return '£' + (p % 1 ? p.toFixed(2) : p); };

  /* every page sits at a different depth, so work the prefix out from the one
     link that is always present rather than hard-coding it per page */
  var sheet = document.querySelector('link[rel="stylesheet"][href$="style.css"]');
  var BASE = sheet ? sheet.getAttribute('href').replace('style.css', '') : '';

  /* ══════════════════════════════════════════════════════════
     1. THE INCUBATOR
  ══════════════════════════════════════════════════════════ */
  var ring = $('ring'), stage = $('stage'), hatch = $('hatch');
  var hImg = $('hatchImg'), openBt = $('open'), spinBt = $('spin');

  var N = SET.length, STEP = N ? 360 / N : 30, RAD = Math.PI / 180;
  var R = 820, PW = 200, PH = 244;
  var angle = 0, vel = 0, dragging = false, lastX = 0, raf = null;
  var front = 0, aim = 0, moved = false, startX = 0;
  var pods = [];

  if (ring && N) {
    ring.innerHTML = SET.map(function (b, i) {
      return '<button class="pod" type="button" data-i="' + i + '" style="--tint:' + b.t + '"' +
        ' aria-label="' + b.n + ', for ' + b.f + ', ' + b.r.toLowerCase() + '">' +
        '<span class="pod__shell"><span class="pod__glow"></span></span>' +
        '<img class="pod__me" src="' + BASE + 'assets/' + b.k + '.webp" alt="" ' +
        (i > 3 ? 'loading="lazy" ' : '') + 'decoding="async" width="200" height="200">' +
        '<span class="pod__n">' + b.n + '</span></button>';
    }).join('');
    pods = [].slice.call(ring.children);
  }

  /* the ring scales with the viewport so it always bleeds off both edges */
  function sizeRing() {
    if (!ring || !pods.length) return;
    var w = window.innerWidth;
    var sh = stage.clientHeight || 300;
    R  = clamp(w * 0.66, 340, 1000);
    PW = w < 760 ? 132 : clamp(w * 0.14, 150, 210);
    PH = Math.round(PW * 1.22);
    // the stage clips, so a pod taller than the stage loses its lid
    if (PH > sh - 24) { PH = Math.max(110, sh - 24); PW = Math.round(PH / 1.22); }
    ring.style.setProperty('--R', R + 'px');
    // set on the stage, not per pod: the pods inherit it and so does the hatch,
    // so the split shell is always exactly pod-sized
    stage.style.setProperty('--pw', Math.round(PW) + 'px');
    stage.style.setProperty('--ph', PH + 'px');
    apply(true);
  }

  function showCard(i) {
    var b = SET[i];
    if (!$('cN')) return;
    $('cN').textContent = b.n;
    var r = $('cR'); r.textContent = b.r; r.setAttribute('data-r', b.r);
    $('cF').textContent = 'For ' + b.f;
    $('cS').textContent = b.s;
    var im = $('cImg');
    im.src = BASE + 'assets/' + b.k + '.webp'; im.alt = b.n;
    im.parentNode.style.background = b.t;
    if ($('cMore')) {
      $('cMore').href = BASE + 'meet/' + b.slug + '/';
      $('cMore').setAttribute('aria-label', 'Meet ' + b.n);
    }
    $('addFront').dataset.add = 'b' + i;   // data-add, or the delegated handler
    if ($('bbN')) {                        // never sees the click
      $('bbN').textContent = b.n;
      $('bbF').textContent = 'for ' + b.f;
      $('bbAdd').dataset.add = 'b' + i;
    }
  }

  function apply(force) {
    if (!ring || !pods.length) return;
    ring.style.transform = 'translateZ(-' + R + 'px) rotateY(' + angle + 'deg)';

    /* Each pod is billboarded back to face the camera, then depth-faded. Left
       facing outward they turn edge-on at the sides and render as slivers, and
       the far half shows through the near half as clutter. Perspective still
       does the scaling, so the ring keeps its depth. */
    for (var q = 0; q < N; q++) {
      var wr = q * STEP + angle;                       // this pod's world rotation
      var c = Math.cos(wr * RAD);                      // 1 at the front, -1 behind
      var pod = pods[q];
      if (c < -0.2) { pod.style.opacity = '0'; pod.style.pointerEvents = 'none'; continue; }
      pod.style.pointerEvents = '';
      pod.style.opacity = (0.34 + 0.66 * Math.pow((c + 0.2) / 1.2, 1.4)).toFixed(2);
      pod.style.transform =
        'rotateY(' + (q * STEP) + 'deg) translateZ(' + R + 'px) rotateY(' + (-wr) + 'deg)';
    }

    var idx = ((Math.round(-angle / STEP) % N) + N) % N;
    if (idx !== front || force) {
      if (idx !== front) closeHatch();
      front = idx; aim = idx;
      pods.forEach(function (p, k) { p.classList.toggle('is-front', k === idx); });
      showCard(idx);
    }
  }

  function loop() {
    if (!dragging) {
      angle += vel;
      vel *= 0.94;
      if (Math.abs(vel) < 0.02) {
        var t = Math.round(angle / STEP) * STEP;   // settle on a pod, never between
        angle += (t - angle) * 0.18;
        if (Math.abs(t - angle) < 0.04) { angle = t; vel = 0; apply(); raf = null; return; }
      }
    }
    apply();
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  /* arrow keys walk a separate aim index, or they stall on the nearest pod */
  function rotateTo(i) {
    aim = ((i % N) + N) % N;
    var target = -i * STEP;
    while (target - angle > 180) target -= 360;
    while (target - angle < -180) target += 360;
    /* the loop decays velocity by 0.94 a frame, so the distance actually
       travelled is vel / (1 - 0.94) = 16.67 x vel. Anything larger than 0.06
       overshoots and the settle lands on the wrong pod. */
    vel = (target - angle) * 0.06;
    kick();
  }

  function openHatch() {
    vel = 0;                       // freeze first, or the settle steals the front pod
    angle = -front * STEP;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    ring.style.transform = 'translateZ(-' + R + 'px) rotateY(' + angle + 'deg)';
    var b = SET[front];
    hImg.src = BASE + 'assets/' + b.k + '.webp';
    hImg.alt = b.n;
    hatch.style.setProperty('--tint', b.t);   // the shell keeps its own colour,
    hatch.classList.add('is-on');             // or it vanishes against the sky
    if (document.activeElement === pods[front]) openBt.focus();
    pods[front].style.visibility = 'hidden';
    openBt.textContent = 'Put it back';
  }
  function closeHatch() {
    if (!hatch || !hatch.classList.contains('is-on')) return;
    hatch.classList.remove('is-on');
    pods.forEach(function (p) { p.style.visibility = ''; });
    if (openBt) openBt.textContent = 'Open this one';
  }

  if (stage) {
    /* No setPointerCapture. It retargets pointer events, so the click lands on
       the stage and a pod is never clickable. Track the drag on window instead
       and suppress the click only if the pointer really moved. */
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; lastX = startX = e.clientX; vel = 0; kick();
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      if (Math.abs(e.clientX - startX) > 6) moved = true;
      angle += dx * 0.3; vel = dx * 0.3;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        if (!dragging) return;
        dragging = false; kick();
      });
    });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); rotateTo(aim + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); rotateTo(aim - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && e.target === stage) {
        e.preventDefault(); openBt.click();
      }
    });
  }
  pods.forEach(function (p) {
    p.addEventListener('click', function () {
      if (moved) return;                       // that was a drag, not a choice
      var i = +p.dataset.i;
      if (i === front) openBt.click(); else rotateTo(i);
    });
  });
  if (openBt) openBt.addEventListener('click', function () {
    if (hatch.classList.contains('is-on')) closeHatch(); else openHatch();
  });
  if (spinBt) spinBt.addEventListener('click', function () {
    closeHatch();
    vel = 11 + Math.random() * 11;      // a real flick, lands wherever it lands
    kick();
  });

  if (ring && pods.length) {
    sizeRing();
    showCard(0);
    if (!reduced.matches) {
      var idle = setInterval(function () {           // drifts until someone grabs it
        if (dragging || raf) return;
        angle -= 0.11; apply();
      }, 32);
      var stopIdle = function () { clearInterval(idle); };
      stage.addEventListener('pointerdown', stopIdle, { once: true });
      stage.addEventListener('keydown', stopIdle, { once: true });
      if (spinBt) spinBt.addEventListener('click', stopIdle, { once: true });
    }
  }

  /* ══════════════════════════════════════════════════════════
     2. THE DESCENT
     The hero is pinned (sticky) and the Hollow rises up over it as you scroll,
     a scroll-linked cover. The surface recedes and dims underneath, so it reads
     as the world coming over you rather than a page jump. All driven off the
     one scroll handler below, so the timing IS the scroll.
  ══════════════════════════════════════════════════════════ */
  var hollow = $('hollow');
  var heroEl = document.querySelector('.hero');
  var heroInner = document.querySelector('.hero__inner');
  var heroDim = document.querySelector('.hero__dim');

  function descend(y) {
    if (!heroInner) return;
    var p = clamp(y / (window.innerHeight * 0.9), 0, 1);
    var e = p * p * (3 - 2 * p);                  // smoothstep, so it eases
    // translate + dim only, no scale: scaling shrank the hero's own controls
    // below the 44px tap minimum mid-transform, and the drift + darken already
    // read as the surface receding underground.
    heroInner.style.transform = 'translateY(' + (-9 * e).toFixed(2) + 'vh)';
    if (heroDim) heroDim.style.opacity = e.toFixed(3);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bagOpen) closeBag();
  });

  /* ══════════════════════════════════════════════════════════
     3. THE TRAIL
     One path from the Hollow to the footer. It draws as you scroll
     and a BLIP walks down it. Points are sampled once, so no
     getPointAtLength work happens per frame.
  ══════════════════════════════════════════════════════════ */
  var NS = 'http://www.w3.org/2000/svg';
  var trailBox = null, inkPath = null, edgePath = null, meG = null, pts = [], inkLen = 0;
  var tTop = 0, tH = 1;

  function xAt(y) { return 48 + 26 * Math.sin(y / 260); }

  function buildTrail() {
    if (trailBox) { trailBox.remove(); trailBox = null; pts = []; }
    if (window.innerWidth <= 900 || !hollow) return;
    var main = document.querySelector('main');
    var foot = document.querySelector('.foot');
    if (!main || !foot) return;
    tTop = hollow.offsetTop;
    tH = Math.max(200, foot.offsetTop - tTop);

    var d = 'M ' + xAt(0).toFixed(1) + ' 0';
    pts = [{ x: xAt(0), y: 0 }];
    for (var y = 24; y <= tH; y += 24) {
      var x = xAt(y);
      d += ' L ' + x.toFixed(1) + ' ' + y;
      pts.push({ x: x, y: y });
    }

    trailBox = document.createElement('div');
    trailBox.className = 'trail';
    trailBox.style.top = tTop + 'px';
    trailBox.style.height = tH + 'px';
    trailBox.setAttribute('aria-hidden', 'true');

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '96');
    svg.setAttribute('height', String(tH));
    svg.setAttribute('viewBox', '0 0 96 ' + tH);

    var bed = document.createElementNS(NS, 'path');
    bed.setAttribute('class', 'trail__bed'); bed.setAttribute('d', d);
    svg.appendChild(bed);

    edgePath = document.createElementNS(NS, 'path');
    edgePath.setAttribute('class', 'trail__edge'); edgePath.setAttribute('d', d);
    svg.appendChild(edgePath);

    inkPath = document.createElementNS(NS, 'path');
    inkPath.setAttribute('class', 'trail__ink'); inkPath.setAttribute('d', d);
    svg.appendChild(inkPath);

    // a numbered peg where each place on the trail begins
    [].forEach.call(document.querySelectorAll('.zone--path'), function (sec, k) {
      var y = sec.offsetTop - tTop + 70;
      if (y < 0 || y > tH) return;
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'trail__peg');
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', xAt(y).toFixed(1)); c.setAttribute('cy', y);
      c.setAttribute('r', '15');
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', xAt(y).toFixed(1)); t.setAttribute('y', y + 5);
      t.textContent = String(k + 1);
      g.appendChild(c); g.appendChild(t); svg.appendChild(g);
    });

    // a BLIP walking the path, not an abstract dot
    meG = document.createElementNS(NS, 'g');
    meG.setAttribute('class', 'trail__me');
    var mc = document.createElementNS(NS, 'circle');
    mc.setAttribute('cx', '0'); mc.setAttribute('cy', '0'); mc.setAttribute('r', '20');
    var mi = document.createElementNS(NS, 'image');
    mi.setAttribute('href', BASE + 'assets/' + (SET[0] ? SET[0].k : 'blue') + '.webp');
    mi.setAttribute('width', '34'); mi.setAttribute('height', '34');
    meG.appendChild(mc); meG.appendChild(mi);
    svg.appendChild(meG);

    trailBox.appendChild(svg);
    main.appendChild(trailBox);

    inkLen = tH * 1.06;              // the sine adds a little length over the drop
    [inkPath, edgePath].forEach(function (el) {
      el.style.strokeDasharray = inkLen;
      el.style.strokeDashoffset = inkLen;
    });
    drawTrail();
  }

  function drawTrail() {
    if (!inkPath || !pts.length) return;
    var p = clamp((window.scrollY + window.innerHeight * 0.55 - tTop) / tH, 0, 1);
    var off = (inkLen * (1 - p)).toFixed(1);
    inkPath.style.strokeDashoffset = off;
    edgePath.style.strokeDashoffset = off;
    var pt = pts[Math.min(pts.length - 1, Math.round(p * (pts.length - 1)))];
    meG.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y + ')');
    meG.style.opacity = p > 0.002 && p < 0.999 ? '1' : '0';
  }

  /* ══════════════════════════════════════════════════════════
     4. THE SHELVES — the cards are server rendered, only the
     filtering is client side
  ══════════════════════════════════════════════════════════ */
  var filters = $('filters'), note = $('gridNote');
  var cards = [].slice.call(document.querySelectorAll('.prod'));

  if (filters && cards.length) {
    var applyFilter = function (id) {
      var shown = 0;
      cards.forEach(function (el) {
        var hit = id === 'all' || el.dataset.g === id;
        el.classList.toggle('prod--hide', !hit);
        if (hit) shown++;
      });
      [].forEach.call(filters.children, function (f) {
        f.setAttribute('aria-pressed', String(f.dataset.g === id));
      });
      if (note) {
        note.textContent = id === 'all'
          ? 'Twelve out of fifty, ' + money(PRICE) + ' each. Free UK delivery over ' +
            money(FREE) + '.'
          : shown + (shown === 1 ? ' is out' : ' are out') + ' for this so far, of fifty in the set.';
      }
    };
    filters.addEventListener('click', function (e) {
      var f = e.target.closest('.filt'); if (f) applyFilter(f.dataset.g);
    });
    applyFilter('all');
  }

  /* ══════════════════════════════════════════════════════════
     5. THE BAG
  ══════════════════════════════════════════════════════════ */
  /* The bag has to survive a page change now that every BLIP has its own page.
     sessionStorage rather than localStorage: it follows you round the site and
     is gone when the tab is, which is the right lifetime for a demo. */
  var BAGKEY = 'blip.bag';
  var bag = [];                                   // [{ id, q }]
  try {
    var saved = JSON.parse(sessionStorage.getItem(BAGKEY) || '[]');
    if (Array.isArray(saved)) {
      bag = saved.filter(function (l) {
        return l && typeof l.id === 'string' && l.q > 0 &&
               (l.id.charAt(0) === 'b' ? SET[+l.id.slice(1)]
                 : BUNDLES.some(function (x) { return x.id === l.id; }));
      });
    }
  } catch (e) { bag = []; }
  function saveBag() {
    try { sessionStorage.setItem(BAGKEY, JSON.stringify(bag)); } catch (e) {}
  }
  var bagBtn = $('bagBtn'), bagN = $('bagN'), drawer = $('drawer');
  var bagBody = $('bagBody'), bagTot = $('bagTot'), bagShip = $('bagShip');
  var bagPage = $('bagPage');
  var toast = $('toast'), toastT = null, bagOpen = false, lastFocus = null;

  function item(id) {
    if (id.charAt(0) === 'b') {
      var b = SET[+id.slice(1)];
      return { n: b.n, f: 'for ' + b.f, p: PRICE,
               img: BASE + 'assets/' + b.k + '.webp',
               href: BASE + 'meet/' + b.slug + '/' };
    }
    var s = BUNDLES.filter(function (x) { return x.id === id; })[0];
    return { n: s.t, f: 'three BLIPs', p: s.p,
             img: BASE + 'assets/' + SET[s.m[0]].k + '.webp', href: BASE + 'sets/' };
  }
  function count() { return bag.reduce(function (a, l) { return a + l.q; }, 0); }
  function total() {
    return bag.reduce(function (a, l) { return a + item(l.id).p * l.q; }, 0);
  }
  function add(id) {
    var hit = bag.filter(function (l) { return l.id === id; })[0];
    if (hit) hit.q++; else bag.push({ id: id, q: 1 });
    paintBag();
    if (bagBtn) {
      bagBtn.classList.remove('is-pop');
      void bagBtn.offsetWidth;
      bagBtn.classList.add('is-pop');
    }
    say(item(id).n + ' is in your bag');
  }
  function setQ(id, q) {
    bag = bag.filter(function (l) {
      if (l.id !== id) return true;
      l.q = q; return q > 0;
    });
    paintBag();
  }
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }
  function lines(big) {
    if (!bag.length) {
      return big
        ? '<p class="drawer__empty">Nothing in it yet. <a href="' + BASE +
          'shop/">Have a look at the shelves</a>.</p>'
        : '<p class="drawer__empty">Nothing in it yet.</p>';
    }
    return bag.map(function (l) {
      var it = item(l.id);
      return '<div class="line">' +
        '<a class="line__me" href="' + it.href + '"><img src="' + it.img +
          '" alt="" decoding="async"></a>' +
        '<div><p class="line__n">' + it.n + '</p>' +
        '<p class="line__f">' + it.f + '</p>' +
        '<span class="line__q">' +
          '<button class="qb" type="button" data-q="-1" data-id="' + l.id +
            '" aria-label="One fewer ' + it.n + '">&minus;</button>' +
          '<b>' + l.q + '</b>' +
          '<button class="qb" type="button" data-q="1" data-id="' + l.id +
            '" aria-label="One more ' + it.n + '">+</button>' +
        '</span></div>' +
        '<p class="line__p">' + money(it.p * l.q) + '</p></div>';
    }).join('');
  }
  function paintBag() {
    saveBag();
    var c = count(), t = total();
    if (bagN) {
      bagN.textContent = String(c);
      bagBtn.setAttribute('aria-label', 'Bag, ' + c + (c === 1 ? ' item' : ' items'));
    }
    var ship = !c ? 'Free UK delivery on orders over ' + money(FREE) + '.'
      : t >= FREE ? 'Delivery is free. 2 to 3 working days.'
      : money(FREE - t) + ' more and delivery is free.';
    if (bagTot) bagTot.textContent = money(t);
    if (bagShip) bagShip.textContent = ship;
    if (bagBody) bagBody.innerHTML = lines(false);
    if (bagPage) {
      bagPage.innerHTML = lines(true);
      $('bagPageTot').textContent = money(t);
      $('bagPageShip').textContent = t >= FREE ? 'Free' : money(FREE - t) + ' to go';
    }
  }
  function openBag() {
    lastFocus = document.activeElement;
    drawer.hidden = false; bagOpen = true;
    bagBtn.setAttribute('aria-expanded', 'true');
    $('bagClose').focus();
  }
  function closeBag() {
    drawer.hidden = true; bagOpen = false;
    bagBtn.setAttribute('aria-expanded', 'false');
    (lastFocus || bagBtn).focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]');
    if (a) { e.preventDefault(); add(a.dataset.add); return; }
    var q = e.target.closest('[data-q]');
    if (q) {
      var line = bag.filter(function (l) { return l.id === q.dataset.id; })[0];
      if (line) setQ(q.dataset.id, line.q + (+q.dataset.q));
    }
  });
  if (bagBtn) bagBtn.addEventListener('click', function () {
    bagOpen ? closeBag() : openBag();
  });
  if ($('bagClose')) $('bagClose').addEventListener('click', closeBag);
  if ($('drawerScrim')) $('drawerScrim').addEventListener('click', closeBag);
  // keep tab inside the drawer while it is open
  if (drawer) drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = drawer.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  if ($('subBtn')) $('subBtn').addEventListener('click', function () {
    say('The first one is free. We would email you to ask what is going on.');
  });
  paintBag();

  /* ══════════════════════════════════════════════════════════
     6. SCROLL WORK — one handler, one frame
  ══════════════════════════════════════════════════════════ */
  var nav = $('nav'), buybar = $('buybar'), ticking = false;
  var footEl = document.querySelector('.foot');
  function onScroll() {
    var y = window.scrollY;
    if (nav && heroEl) nav.classList.toggle('is-stuck', y > 40);
    if (heroInner && !reduced.matches) descend(y);
    if (buybar && footEl) {
      // on the home page it appears once you are into the Hollow, on a
      // product page as soon as the buy block has scrolled away
      var past = hollow ? y > hollow.offsetTop - window.innerHeight * 0.5 : y > 420;
      var atFoot = y + window.innerHeight > footEl.offsetTop + 60;
      buybar.classList.toggle('is-on', !!past && !atFoot);
      buybar.setAttribute('aria-hidden', past && !atFoot ? 'false' : 'true');
    }
    drawTrail();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  var rz = null;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { sizeRing(); buildTrail(); onScroll(); }, 160);
  });

  /* ---------- reveals ---------- */
  var revs = document.querySelectorAll('[data-rev]');
  if (!('IntersectionObserver' in window) || reduced.matches) {
    [].forEach.call(revs, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    [].forEach.call(revs, function (el) { io.observe(el); });
  }

  window.addEventListener('load', function () { sizeRing(); buildTrail(); onScroll(); });
  buildTrail();
  onScroll();
})();
