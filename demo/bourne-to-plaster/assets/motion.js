// Shared motion for the Bourne To Plaster directions. GSAP 3.13 (ScrollTrigger, SplitText) + Lenis.
// Everything is readable with JS off or reduced motion on; this file only adds movement on top.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var has = typeof gsap !== "undefined";
  var doc = document.documentElement;

  // Menu drawer
  var mb = document.querySelector("[data-menu]"), dr = document.getElementById("drawer");
  if (mb && dr) mb.addEventListener("click", function () {
    var o = dr.classList.toggle("open"); mb.setAttribute("aria-expanded", o); document.body.classList.toggle("lock", o);
  });

  // Draft forms
  document.querySelectorAll("form[data-draft]").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); var d = f.querySelector(".done"); d.hidden = false; d.focus(); });
  });

  // Manual before/after control works with or without GSAP
  document.querySelectorAll("[data-skim]").forEach(function (el) {
    var r = el.querySelector("input[type=range]");
    if (!r) return;
    r.addEventListener("input", function () { el.style.setProperty("--p", r.value); el.dataset.manual = "1"; });
  });

  // Header: always there; turns solid once you leave the top
  var top = document.querySelector(".top"), lastY = 0;
  if (top) addEventListener("scroll", function () {
    var y = scrollY;
    top.classList.toggle("solid", y > 40);
    lastY = y;
  }, { passive: true });

  // Before and after: switch between pairs
  document.querySelectorAll("[data-skim]").forEach(function (el) {
    var tabs = el.parentNode.querySelectorAll(".ba-tab"); if (!tabs.length) return;
    var b = el.querySelector("img.b"), a = el.querySelector("img.a");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.toggle("on", x === t); x.setAttribute("aria-pressed", x === t); });
        el.classList.add("swap");
        setTimeout(function () {
          b.src = t.dataset.b; b.alt = t.dataset.balt; a.src = t.dataset.a; a.alt = t.dataset.aalt;
          el.style.setProperty("--ar", t.dataset.ar);
          el.classList.remove("swap");
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        }, 300);
      });
    });
  });

  // Reviews: open the full list
  document.querySelectorAll("[data-showall]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = document.querySelector("[data-allrevs]"); if (!box) return;
      box.classList.remove("collapsed"); btn.remove();
      if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.from(box.querySelectorAll(".mini"), { y: 30, opacity: 0, duration: 0.6, ease: "expo.out", stagger: 0.03 });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  // Hero quote card: room stepper
  document.querySelectorAll("[data-qcard]").forEach(function (f) {
    var out = f.querySelector("[data-rooms]");
    f.querySelectorAll("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () { out.textContent = Math.max(1, Math.min(12, (+out.textContent) + (+b.dataset.step))); });
    });
  });

  // Sticky call bar
  var bar = document.querySelector("[data-callbar]"), first = document.querySelector("[data-first-actions]");
  if (bar && first && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { bar.classList.toggle("show", !e[0].isIntersecting && e[0].boundingClientRect.top < 0); }).observe(first);
  }

  if (!has || reduce) { doc.classList.add("static"); var i0 = document.querySelector("[data-intro]"); if (i0) i0.remove(); return; }
  doc.classList.add("moving");
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Smooth scroll
  if (typeof Lenis !== "undefined") {
    var lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) { var t = document.querySelector(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } });
    });
  }

  // Intro: one trowel pass across the screen, once per visit
  var intro = document.querySelector("[data-intro]");
  var seen = false; try { seen = sessionStorage.getItem("btp-intro") === "1"; sessionStorage.setItem("btp-intro", "1"); } catch (e) {}
  var heroDelay = 0;
  if (intro && !seen) {
    heroDelay = 0.75;
    gsap.timeline({ onComplete: function () { intro.remove(); } })
      .fromTo(intro.querySelector(".intro-word"), { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: "power3.out" })
      .to(intro, { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", duration: 0.7, ease: "power3.inOut" }, "+=0.15");
  } else if (intro) { intro.remove(); }

  // Cycling ending on the hero headline
  document.querySelectorAll("[data-morph]").forEach(function (el) {
    var words = el.dataset.morph.split("|"), i = 0, span = el.querySelector("span");
    el.style.overflow = "hidden";
    setInterval(function () {
      i = (i + 1) % words.length;
      gsap.to(span, { yPercent: -110, opacity: 0, duration: 0.4, ease: "power3.in", onComplete: function () {
        span.textContent = words[i];
        gsap.fromTo(span, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: "expo.out" });
      } });
    }, 2800);
  });

  // Masked line rise for headings
  document.fonts.ready.then(function () {
    document.querySelectorAll("[data-lines]").forEach(function (h) {
      var s = SplitText.create(h, { type: "lines", mask: "lines", linesClass: "ln" });
      var hero = h.hasAttribute("data-hero");
      gsap.from(s.lines, {
        yPercent: 105, duration: hero ? 1 : 0.9, ease: "expo.out", stagger: 0.08, delay: hero ? heroDelay + 0.1 : 0,
        scrollTrigger: hero ? null : { trigger: h, start: "top 88%" }
      });
    });

    // Words light up as you read
    document.querySelectorAll("[data-scrub-words]").forEach(function (p) {
      var s = SplitText.create(p, { type: "words" });
      gsap.fromTo(s.words, { opacity: 0.16 }, {
        opacity: 1, ease: "none", stagger: 0.05,
        scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: true }
      });
    });
    ScrollTrigger.refresh();
  });

  // Blocks that rise in
  gsap.utils.toArray("[data-rise]").forEach(function (el) {
    gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });
  gsap.utils.toArray("[data-rise-kids]").forEach(function (el) {
    gsap.from(el.children, { y: 36, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  // Hero image settles from a slight zoom, then drifts slower than the page
  gsap.utils.toArray("[data-hero-img]").forEach(function (img) {
    gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "expo.out", delay: heroDelay });
    gsap.to(img, { yPercent: 12, ease: "none", scrollTrigger: { trigger: img.closest("section"), start: "top top", end: "bottom top", scrub: true } });
  });

  // Count up once
  gsap.utils.toArray("[data-count]").forEach(function (el) {
    var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
    } });
  });

  // Marquee that speeds up with scroll
  gsap.utils.toArray("[data-marquee]").forEach(function (track) {
    var dir = track.dataset.marquee === "rtl" ? 1 : -1;
    var loop = gsap.to(track, { xPercent: 50 * dir, ease: "none", duration: parseFloat(track.dataset.speed || 28), repeat: -1 });
    if (dir === 1) gsap.set(track, { xPercent: -50 });
    ScrollTrigger.create({ onUpdate: function (s) {
      var v = Math.min(5, 1 + Math.abs(s.getVelocity()) / 500);
      loop.timeScale(v); gsap.to(loop, { timeScale: 1, duration: 0.9, overwrite: true });
    } });
  });

  // The skim: scroll drags the trowel across the wall, before becomes after
  gsap.utils.toArray("[data-skim]").forEach(function (el) {
    var r = el.querySelector("input[type=range]");
    var pin = matchMedia("(min-width: 900px)").matches ? (el.closest("[data-skim-pin]") || el) : el;  // pinned on desktop only
    var o = { p: 0 };
    gsap.set(el, { "--p": 0 });
    gsap.to(o, {
      p: 100, ease: "none",
      scrollTrigger: { trigger: pin, start: pin === el ? "top 75%" : "top top", end: pin === el ? "bottom 30%" : "+=120%", scrub: 0.6, pin: pin !== el },
      onUpdate: function () { if (el.dataset.manual) return; el.style.setProperty("--p", o.p.toFixed(2)); if (r) r.value = o.p; }
    });
  });

  // The hero dries: fresh plaster pink fades to white as you leave it
  gsap.utils.toArray("[data-dry]").forEach(function (sec) {
    gsap.fromTo(sec, { "--dry": 0 }, { "--dry": 1, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom 35%", scrub: true } });
  });

  // Stacked cards scale back as the next one lands
  gsap.utils.toArray("[data-stack] > *").forEach(function (card, i, all) {
    if (i === all.length - 1) return;
    gsap.to(card, { scale: 0.92, opacity: 0.5, ease: "none", scrollTrigger: { trigger: all[i + 1], start: "top 85%", end: "top 25%", scrub: true } });
  });

  if (!fine) return;

  // Service rows: a photo follows the pointer
  document.querySelectorAll("[data-flow]").forEach(function (list) {
    var pv = list.querySelector(".flow-preview"); if (!pv) return;
    var img = pv.querySelector("img");
    var xTo = gsap.quickTo(pv, "x", { duration: 0.5, ease: "power3" }), yTo = gsap.quickTo(pv, "y", { duration: 0.5, ease: "power3" });
    list.addEventListener("mousemove", function (e) { var b = list.getBoundingClientRect(); xTo(e.clientX - b.left); yTo(e.clientY - b.top); });
    list.querySelectorAll("[data-img]").forEach(function (row) {
      row.addEventListener("mouseenter", function () { img.src = row.dataset.img; gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" }); });
    });
    list.addEventListener("mouseleave", function () { gsap.to(pv, { autoAlpha: 0, scale: 0.85, duration: 0.3 }); });
  });

  // Magnetic buttons
  document.querySelectorAll("[data-magnetic]").forEach(function (b) {
    var xTo = gsap.quickTo(b, "x", { duration: 0.5, ease: "elastic.out(1,0.4)" }), yTo = gsap.quickTo(b, "y", { duration: 0.5, ease: "elastic.out(1,0.4)" });
    b.addEventListener("mousemove", function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.3); });
    b.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
  });
})();
