#!/usr/bin/env python3
"""Rebuild the social share cards in assets/og/.

Each card is drawn in HTML with the site's own font and tokens, then shot at 2x
in headless Chrome and downsampled, so a card can never drift from the live
design. Page cards reuse that page's hero; trial has no hero so it mirrors the
trial page's starfield.

    python3 tools/make-og-cards.py

Social platforms cache OG images by URL, so if a card is redrawn AFTER it has
been shared anywhere, bump its filename here and in the page's meta tags.
Overwriting in place leaves the old card in WhatsApp/LinkedIn caches for weeks.
"""
import base64, math, pathlib, random, subprocess
from PIL import Image

REPO   = pathlib.Path(__file__).resolve().parent.parent
OUT    = REPO / "assets/og"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
def _font(rel):
    return "data:font/woff2;base64," + base64.b64encode((REPO / rel).read_bytes()).decode()

# every face is embedded from the site's own self-hosted files, so a card is
# drawn with the exact same outlines the site ships and the build needs no network
FONT     = _font("assets/BringBold-Nineties.woff2")
ARCHIVO  = _font("assets/fonts/archivo-latin.woff2")
PLEX     = _font("assets/fonts/ibm-plex-mono-400-latin.woff2")
PLEX_500 = _font("assets/fonts/ibm-plex-mono-500-latin.woff2")


def b64_jpg(rel):
    return "data:image/jpeg;base64," + base64.b64encode((REPO / rel).read_bytes()).decode()


def shoot(html, slug):
    tmp = OUT / f".{slug}.html"
    tmp.write_text(html)
    png = OUT / f".{slug}@2x.png"
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=2", "--window-size=1200,630",
                    "--virtual-time-budget=6000", f"--screenshot={png}", str(tmp)],
                   check=True, capture_output=True)
    Image.open(png).convert("RGB").resize((1200, 630), Image.LANCZOS).save(
        OUT / f"{slug}.jpg", quality=88, optimize=True, progressive=False)
    tmp.unlink(); png.unlink()
    print(f"  {slug}.jpg  {(OUT / f'{slug}.jpg').stat().st_size // 1024} KB")


HEAD = f"""<meta charset=utf-8>
<style>
@font-face{{font-family:'BringBold';src:url('{FONT}') format('woff2');font-display:block}}
@font-face{{font-family:'Archivo';src:url('{ARCHIVO}') format('woff2');font-display:block}}
@font-face{{font-family:'IBM Plex Mono';font-weight:400;src:url('{PLEX}') format('woff2');font-display:block}}
@font-face{{font-family:'IBM Plex Mono';font-weight:500;src:url('{PLEX_500}') format('woff2');font-display:block}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;overflow:hidden;-webkit-font-smoothing:antialiased}}
.card{{width:1200px;height:630px;position:relative;overflow:hidden;background:#0A0B0D;color:#F2F3F4}}
.mark{{position:absolute;top:44px;left:56px;font-family:'BringBold',sans-serif;font-size:44px;line-height:1;letter-spacing:.02em}}
.strap{{position:absolute;top:56px;right:56px;font-family:'IBM Plex Mono',monospace;font-size:15px;
  letter-spacing:.17em;text-transform:uppercase;color:#E2E7EB;display:flex;align-items:center;gap:11px}}
.tick{{width:9px;height:9px;border-radius:50%;background:#5BC2E7;flex:none}}
.bot{{position:absolute;left:56px;bottom:52px}}
h1{{font-family:'BringBold',sans-serif;font-weight:400;line-height:.92;letter-spacing:.005em}}
.url{{font-family:'IBM Plex Mono',monospace;font-size:17px;letter-spacing:.16em;text-transform:uppercase;
  color:#C7CED4;margin-top:26px}}
.d{{color:#5BC2E7}}
</style>"""

# One card for the whole site. Every page points at it, so whatever link gets
# shared, the preview is the same. slug: (hero, headline, strap, headline px)
HERO_CARDS = {
    "share": ("hero-foliage.jpg", "YOUR VISUAL<br>WORLD, BUILT<br>IN DAYS<span class=d>.</span>",
              "AI CREATIVE AGENCY &middot; READING, UK", 78),
}

HERO_BODY = """<style>
.bg{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%}}
/* mirrors .hero-shade on the live site, plus a left wash so the type always
   holds whatever the hero behind it is doing */
.shade{{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(10,11,13,.42) 0%,rgba(10,11,13,.04) 26%,rgba(10,11,13,.20) 52%,rgba(10,11,13,.88) 100%)}}
.side{{position:absolute;inset:0;background:linear-gradient(100deg,
  rgba(10,11,13,.60) 0%,rgba(10,11,13,.20) 34%,transparent 58%)}}
h1{{font-size:{size}px}}
</style>
<div class=card>
  <img class=bg src="{hero}"><div class=side></div><div class=shade></div>
  <span class=mark>FORVR<span class=d>.</span></span>
  <span class=strap><i class=tick></i>{strap}</span>
  <div class=bot><h1>{head}</h1><div class=url>FORVR.ORG</div></div>
</div>"""


def trial_card():
    random.seed(7)                       # seeded so the card is reproducible
    stars = []
    for _ in range(120):
        x, y = random.random() * 1200, random.random() * 630
        r = random.choice([1, 1, 1, 1.4, 1.4, 2, 2.6])
        col = "145,215,242" if random.random() < .28 else "236,242,246"
        a = min(.20 + max(0, 1 - math.hypot(x - 830, y - 250) / 500) * .62, 1)
        stars.append(f'<i style="left:{x:.0f}px;top:{y:.0f}px;width:{r*2:.1f}px;'
                     f'height:{r*2:.1f}px;background:rgba({col},{a:.2f})"></i>')
    return HEAD + """<style>
.orb{position:absolute;left:830px;top:250px;width:1060px;height:1060px;transform:translate(-50%,-50%);
  background:radial-gradient(circle closest-side,rgba(150,222,247,.36) 0%,rgba(91,194,231,.22) 18%,
  rgba(38,120,164,.10) 45%,rgba(0,0,0,0) 100%)}
.orb.core{width:276px;height:276px;background:radial-gradient(circle closest-side,
  rgba(150,222,247,.46) 0%,rgba(91,194,231,.28) 18%,rgba(38,120,164,.13) 45%,rgba(0,0,0,0) 100%)}
.stars i{position:absolute;border-radius:50%}
.bot{bottom:56px;max-width:760px}
h1{font-size:88px}
.url{color:#9AA1A8}
.url b{color:#5BC2E7;font-weight:400}
</style>
<div class=card>
  <div class=orb></div><div class="orb core"></div>
  <div class=stars>""" + "".join(stars) + """</div>
  <span class=mark>FORVR<span class=d>.</span></span>
  <span class=strap><i class=tick></i>FREE TRIAL</span>
  <div class=bot>
    <h1>THREE PIECES,<br>MADE FOR YOU<span class=d>.</span></h1>
    <div class=url>BACK IN 72 HOURS &middot; NO CARD &middot; <b>FORVR.ORG/TRIAL</b></div>
  </div>
</div>"""


# Every path this site has ever advertised as its share card. Scrapers cache by
# URL and never re-check, so a platform that saw an old tag keeps fetching the
# old path forever. Pointing them all at the current card is the only thing that
# reaches a cache you cannot clear (WhatsApp, iMessage, an existing LinkedIn
# Featured item). Deleting them instead turns a stale preview into a broken one.
LEGACY = [
    "static/og-card.jpg",      # Jul 2026 Statue of a Fool card
    "static/forvr-og.jpg",     # the card before that
    "assets/og/home.jpg",      # per-page set, live for about an hour
    "assets/og/work.jpg", "assets/og/services.jpg",
    "assets/og/studio.jpg", "assets/og/contact.jpg", "assets/og/trial.jpg",
]


def mirror_to_legacy():
    card = (OUT / "share.jpg").read_bytes()
    for rel in LEGACY:
        dest = REPO / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(card)
        print(f"  {rel}  <- share.jpg")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print("Rendering share cards ->", OUT)
    for slug, (hero, head, strap, size) in HERO_CARDS.items():
        shoot(HEAD + HERO_BODY.format(hero=b64_jpg(f"assets/{hero}"),
                                      head=head, strap=strap, size=size), slug)
    mirror_to_legacy()
