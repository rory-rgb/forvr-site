#!/usr/bin/env python3
"""Rebuild the favicon / touch icon set from the site's FORVR. mark.

A dark tile with a BringBold F and the blue dot, matching the nav mark. Dark
rather than transparent on purpose: it reads against light and dark browser
chrome, and iOS composites touch icons onto white if they have alpha.

Rendered at 1024 and downsampled per size, since Chrome's hinting at 16px is
worse than a good LANCZOS reduction.

    python3 tools/make-icons.py
"""
import base64, pathlib, subprocess
from PIL import Image

REPO   = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT   = "data:font/woff2;base64," + base64.b64encode(
    (REPO / "assets/BringBold-Nineties.woff2").read_bytes()).decode()

S = 1024   # master, all geometry below is a fraction of it
HTML = f"""<style>
@font-face{{font-family:'BringBold';src:url('{FONT}') format('woff2');font-display:block}}
*{{margin:0;padding:0}}
body{{width:{S}px;height:{S}px;overflow:hidden}}
.t{{width:{S}px;height:{S}px;background:#0A0B0D;position:relative;
   display:flex;align-items:center;justify-content:center}}
.f{{font-family:'BringBold',sans-serif;font-size:{S*0.655:.0f}px;line-height:1;color:#F7F6F2;
   transform:translate({-S*0.030:.0f}px,{-S*0.012:.0f}px)}}
.dot{{position:absolute;width:{S*0.121:.0f}px;height:{S*0.121:.0f}px;border-radius:50%;
   background:#5BC2E7;left:{S*0.629:.0f}px;top:{S*0.586:.0f}px}}
</style><div class=t><span class=f>F</span><span class=dot></span></div>"""

if __name__ == "__main__":
    tmp = REPO / "tools/.icon.html"; tmp.write_text(HTML)
    png = REPO / "tools/.icon-master.png"
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                    f"--window-size={S},{S}", "--virtual-time-budget=5000",
                    f"--screenshot={png}", str(tmp)], check=True, capture_output=True)
    master = Image.open(png).convert("RGB")

    for size, dest in [(32, "static/icon-32.png"), (48, "static/icon-48.png"),
                       (180, "static/icon-180.png"), (192, "static/icon-192.png"),
                       (512, "static/icon-512.png")]:
        out = REPO / dest
        master.resize((size, size), Image.LANCZOS).save(out, optimize=True)
        print(f"  {dest}  {out.stat().st_size // 1024}KB")

    # multi-size .ico so browsers pick the right one for tab vs bookmark bar
    ico = REPO / "favicon.ico"
    master.resize((256, 256), Image.LANCZOS).save(
        ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    (REPO / "static/favicon.ico").write_bytes(ico.read_bytes())
    print(f"  favicon.ico  {ico.stat().st_size // 1024}KB (16/32/48)")

    tmp.unlink(); png.unlink()
