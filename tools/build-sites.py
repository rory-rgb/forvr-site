#!/usr/bin/env python3
"""Generates the website showcase band + one detail page per build.
Only touches work.html's #websites section and the site-*.html pages.
Everything else on the site is hand-maintained; do not regenerate it."""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent

SITES = [
 ("pyre","PYRE","Hot sauce",
  "The page has a temperature. Scoville maps to Kelvin on a black-body curve, so scrolling the range physically heats the site from near-black to white-hot.",12),
 ("section","SECTION","Sandwich counter",
  "The build. The sandwich comes apart layer by layer as you scroll, because the order things go in is the thing they actually sell.",12),
 ("halflight","HALF LIGHT","Fragrance",
  "Real refractive glass, with liquid that carries scroll momentum. The bottle behaves like glass rather than a picture of it.",10),
 ("haldane","HALDANE","Watchmaker, Edinburgh",
  "The Caseback. A circular aperture opens through the dial into the movement, then the escapement, with a balance wheel running at a real 4Hz.",11),
 ("blip","BLIP","Children's toys, direct",
  "The Incubator. A full-bleed ring of pods you drag or flick through. Open the front one and it cracks: the lid tips off and the creature springs out.",9),
 ("nocturne","NOCTURNE","Night-shift clinical staffing",
  "The Rota Dial. A working 12-hour control. Drag it to 03:00 and coverage, open shifts and the hourly rate all re-resolve, and the page itself darkens.",6),
 ("pica","PICA","Risograph print house",
  "Registration. Two real ink plates composited with multiply, so the overprint colour is produced rather than picked. They sit 9px out of true until you snap them.",8),
 ("puddle","PUDDLE","Animation studio",
  "The Pose Test. Click a keyframe and the rig snaps to it, no tween. Press play to run it on twos, then switch the hand-drawn boil off and watch it die.",5),
]

NAV  = (root/'tools/_nav.html').read_text()
FOOT = (root/'tools/_foot.html').read_text()

def head(title, desc, slug):
    return f'''<!DOCTYPE html><html lang="en-GB"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://forvr.org/{slug}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_GB">
<meta property="og:site_name" content="Forvr Studios">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://forvr.org/{slug}">
<meta property="og:image" content="https://forvr.org/assets/og/share.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://forvr.org/assets/og/share.jpg">
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/static/icon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/static/icon-180.png">
<link rel="stylesheet" href="assets/site.css">
</head><body>
'''

# ---------------------------------------------------------------- the band for work.html
def band():
    cards = "".join(f'''    <a class="sitecard" href="site-{slug}.html">
      <div class="shot"><img class="strip" src="assets/strip-{slug}.jpg" alt="{name} site, scrolled top to bottom" loading="lazy">
        <span class="scrub mono">Hover to scroll &middot; click to open</span></div>
      <div class="scap"><h3>{name}</h3><span class="mono">{sector}</span></div>
      <p>{desc}</p>
    </a>
''' for slug,name,sector,desc,_ in SITES)
    return f'''<section class="section" id="websites">
  <div class="sec-head">
    <div>
      <p class="eyebrow reveal"><span class="tick"></span>Design and build</p>
      <h2 class="reveal">WEBSITES<span class="dot">.</span></h2>
    </div>
    <span class="mono">{len(SITES)} builds &middot; designed and coded in house</span>
  </div>
  <p class="lede reveal" style="margin-bottom:56px">Every one answers the same question a different way: what should this business's site actually do that a template cannot? Each is built around one working interaction, not a slideshow of it.</p>
  <div class="sites-grid">
{cards}  </div>
  <p class="honest-line" style="color:var(--muted)">Self-initiated concept builds, made to prove the interaction rather than to fill a portfolio. Client sites shown on request.</p>
</section>
'''

# ---------------------------------------------------------------- detail pages
for slug,name,sector,desc,frames in SITES:
    shots = "".join(
      f'    <figure class="sheet-cell"><img src="assets/f-{slug}-{i:02d}.jpg" alt="{name}, screen {i+1}" loading="lazy">'
      f'<figcaption class="mono">{i+1:02d}</figcaption></figure>\n' for i in range(frames))
    pg  = head(f"{name} &middot; website &middot; Forvr Studios", f"{name}, {sector}. {desc[:110]}", f"site-{slug}")
    pg += NAV
    pg += f'''<header class="detail-hero">
  <a class="crumb mono" href="work.html#websites">&larr; All websites</a>
  <p class="eyebrow"><span class="tick"></span>{sector}</p>
  <h1>{name}<span class="dot">.</span></h1>
  <p class="sub">{desc}</p>
  <div class="dmeta">
    <div><span class="k mono">Discipline</span><span>Design and build</span></div>
    <div><span class="k mono">Built with</span><span>Hand-written HTML, CSS and JS</span></div>
    <div><span class="k mono">Screens</span><span>{frames}</span></div>
    <div><span class="k mono">Status</span><span>Concept build</span></div>
  </div>
</header>
<main class="over">
<section class="section">
  <div class="sec-head"><h2>THE PAGE, TOP TO BOTTOM<span class="dot">.</span></h2>
    <span class="mono">{frames} screens &middot; captured at 1440px</span></div>
  <div class="sheet">
{shots}  </div>
  <p class="honest-line" style="color:var(--muted)">Captured from the live build, scrolled in sequence. Self-initiated concept work.</p>
</section>
'''
    pg += FOOT
    (root/f"site-{slug}.html").write_text(pg)

# ---------------------------------------------------------------- splice the band into work.html
w = (root/'work.html').read_text()
w = re.sub(r'<section class="section" id="websites">.*?</section>\n', '', w, flags=re.S)
anchor = w.index('<footer')
# put the band after the project index section, before the footer
w = w[:anchor] + band() + '\n' + w[anchor:]
(root/'work.html').write_text(w)
print(f"built {len(SITES)} site pages + spliced the websites band into work.html")
