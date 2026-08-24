#!/usr/bin/env python3
"""Builds the Forvr site from one shared shell. Local proto only, nothing deployed."""
import json, pathlib

NAV = [("Work","work.html"),("Services","services.html"),("Studio","studio.html"),("Contact","contact.html")]

def head(title, desc):
    return f'''<!DOCTYPE html><html lang="en-GB"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="assets/site.css">
</head><body>
'''

def nav(active):
    CUR = ' aria-current="page"'
    links = "".join(
        '<a href="%s"%s>%s</a>' % (href, CUR if label == active else "", label)
        for label, href in NAV)
    return f'''<nav class="nav" id="nav">
  <a class="mark" href="index.html">FORVR<span class="dot">.</span></a>
  <div class="links">{links}</div>
  <a class="cta-pill" href="trial.html">Try it free</a>
</nav>
'''

def hero(img, eyebrow, line_pre, word, words, line_suffix, line2, sub, ctas, page=False):
    w = ('<span id="word" data-words=\'%s\'>%s</span>' % (json.dumps(words), word)) if word else ""
    cta = "".join('<a class="btn %s" href="%s">%s</a>' % (c,h,t) for c,h,t in ctas)
    row2 = ('<span class="row"><span>%s</span></span>' % line2) if line2 else ""
    return f'''<header class="hero{' page' if page else ''}" id="top">
  <img class="hero-bg" id="heroBg" src="assets/{img}" alt="">
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="hero-inner">
    <p class="eyebrow"><span class="tick"></span>{eyebrow}</p>
    <h1><span class="row"><span>{line_pre}{w}{line_suffix}</span></span>
      {row2}</h1>
    <p class="sub">{sub}</p>
    <div class="cta-row">{cta}</div>
  </div>
</header>
<main class="over">
'''

TOOLS = [("Midjourney","midjourney.svg","https://www.midjourney.com"),
 ("Higgsfield","higgsfield.png","https://higgsfield.ai"),
 ("Claude","claude.png","https://claude.com"),
 ("Weavy","weavy.png","https://www.weavy.ai"),
 ("DaVinci Resolve","davinciresolve.png","https://www.blackmagicdesign.com/products/davinciresolve"),
 ("Photoshop","adobephotoshop.svg","https://www.adobe.com/products/photoshop.html"),
 ("Cosmos","cosmos-clean.png","https://www.cosmos.so"),
 ("OpenAI","openai.svg","https://openai.com"),
 ("Figma","figma.svg","https://www.figma.com")]

def tools():
    items = "".join(
      f'<a class="tool" href="{u}" target="_blank" rel="noopener"><img src="assets/{i}" alt=""><span>{n}</span></a>'
      for n,i,u in TOOLS)
    return f'''<div class="tools" aria-label="Tools we build with">
  <span class="label mono">BUILT WITH</span>
  <span class="eaten" aria-hidden="true"></span>
  <span class="pac" aria-hidden="true"><i class="t"></i><i class="b"></i></span>
  <div class="tools-track" id="tools">{items}</div>
</div>
'''

TRIAL = '''<section class="trial" id="trial">
  <canvas id="stars" aria-hidden="true"></canvas>
  <p class="eyebrow reveal"><span class="tick"></span>Prove it on your own brand</p>
  <h2 class="reveal">SEE YOUR BRAND, VISUALISED<span class="dot">.</span></h2>
  <p class="lede reveal">Three finished pieces, on us. Proof beats pitch.</p>
  <div class="flow">
    <span class="stamp" id="stamp"><span class="h">72H</span><span class="u mono">TURNAROUND</span></span>
    <div class="fcard"><span class="num mono">STEP 01</span><h3>Tell us who you are</h3><p>Name, email and your brand's Instagram. That is the whole brief.</p></div>
    <div class="fcard"><span class="num mono">STEP 02</span><h3>We build the concept</h3><p>One idea for your brand, three finished pieces that carry it.</p></div>
    <div class="fcard"><span class="num mono">STEP 03</span><h3>Back in 72 hours</h3><p>Delivered to your inbox, post-ready. Yours to keep, either way.</p></div>
  </div>
  <div class="handle-row">
    <a class="btn blue" href="trial.html">Start the free trial</a>
    <span class="mono" style="font-size:11.5px;color:var(--dark-muted)">NO CARD &middot; NO COMMITMENT</span>
  </div>
  <p class="small-note"><strong>Yours whether you book us or not.</strong> If the first delivery misses the brief you approved, we redo it free.</p>
</section>
'''

def footer():
    links = "".join(f'<a href="{h}">{l}</a>' for l,h in NAV[:3])
    return f'''<footer id="contact-foot">
  <p class="big reveal">GOT A DROP COMING<span class="dot">?</span><br><a href="mailto:hello@forvr.org">LET'S BUILD IT<span class="dot">.</span></a></p>
  <div class="foot-cols">
    <div><span class="mark">FORVR<span class="dot">.</span></span></div>
    <div><a href="mailto:hello@forvr.org">hello@forvr.org</a><span>Reading, England</span></div>
    <div>{links}</div>
    <div><a href="https://instagram.com/forvr.cr" target="_blank" rel="noopener">Instagram</a></div>
  </div>
  <div class="foot-base"><span>&copy; 2026 Forvr.Studios</span></div>
</footer>
</main>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="assets/site.js"></script>
</body></html>
'''

# ---------------------------------------------------------------- shared data
PROJECTS = [
 dict(slug="relay", name="RELAY", client="Corteiz", kind="Spec film", year="2026",
      media=("video","clip-corteiz.mp4","poster-corteiz.jpg"), tag="FILM",
      blurb="A relay along one concrete wall, three runners, pole wipes on every hand-off, cut to loop back into its own first frame.",
      rows=[("Client","Corteiz (spec)"),("Discipline","Film, direction, grade"),("Format","9:16, 4K"),("Year","2026")]),
 dict(slug="blowup", name="BLOWUP", client="BlowUp LDN", kind="Spec film", year="2026",
      media=("video","clip-blowup.mp4","poster-blowup.jpg"), tag="FILM",
      blurb="London energy at street level, cast and lit as one continuous evening, built entirely from directed generation.",
      rows=[("Client","BlowUp LDN (spec)"),("Discipline","Film, casting, grade"),("Format","16:9, 4K"),("Year","2026")]),
 dict(slug="seaforth", name="SEAFORTH", client="Seaforth", kind="Brand film", year="2026",
      media=("video","clip-seaforth.mp4","poster-seaforth.jpg"), tag="FILM",
      blurb="A perfume remembered on a tube platform. Memory film built from amber light, close texture and one held face.",
      rows=[("Client","Seaforth"),("Discipline","Film, art direction, sound"),("Format","16:9, 4K"),("Year","2026")]),
 dict(slug="protect", name="PROTECT", client="Protect LDN", kind="Spec film", year="2026",
      media=("video","clip-protect.mp4","poster-protect.jpg"), tag="FILM",
      blurb="Garment-first film for a London label. Low angles, hard sun, the product carried by movement rather than captions.",
      rows=[("Client","Protect LDN (spec)"),("Discipline","Film, styling, grade"),("Format","9:16, 4K"),("Year","2026")]),
 dict(slug="studio", name="STUDIO SERIES", client="Forvr", kind="Stills", year="2026",
      media=("img","still-studio.jpg",None), tag="STILLS",
      blurb="Controlled studio portraiture on a graded sweep. One light, one chair, one grade held across the full set.",
      rows=[("Client","Forvr in-house"),("Discipline","Stills, styling, retouch"),("Format","4:5, print-ready"),("Year","2026")]),
 dict(slug="fence", name="FENCE", client="Spec", kind="Stills", year="2026",
      media=("img","still-fence.jpg",None), tag="STILLS",
      blurb="Location editorial shot as a set, not a series: same light, same world, every frame cut from one concept.",
      rows=[("Client","Spec"),("Discipline","Stills, location build"),("Format","4:5"),("Year","2026")]),
]

def media_html(m, cls=""):
    kind, src, poster = m
    if kind=="video":
        return f'<video src="assets/{src}" poster="assets/{poster}" muted loop playsinline preload="metadata"></video>'
    return f'<img src="assets/{src}" alt="" loading="lazy">'

root = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- HOME
home_tiles = ""
tile_spec = [("relay",""),("blowup",""),("seaforth","tall"),("protect","tall"),("studio","tall"),("fence","tall")]
by = {p["slug"]:p for p in PROJECTS}
for slug, cls in tile_spec:
    p = by[slug]
    live = '<span class="live"></span>' if p["media"][0]=="video" else ""
    home_tiles += f'''    <figure class="tile {cls}">
      {media_html(p["media"])}
      <span class="tag">{live}{p["tag"]}</span>
      <figcaption class="cap">{p["name"]}<span class="mono">{p["client"].upper()} &middot; {p["kind"].upper()}</span></figcaption>
    </figure>
'''

home = head("Forvr — AI creative agency","We build exceptional visual worlds for consumer focused brands.")
home += nav(None)
home += hero("hero-foliage.jpg","AI creative agency &middot; film, image, identity",
  "YOUR ","VISUAL WORLD",["VISUAL WORLD","CAMPAIGN","FILM","IDENTITY","LOOKBOOK"],",",
  "BUILT IN DAYS<span class=\"dot\">.</span>",
  "We build exceptional visual worlds for consumer focused brands. Using generative AI directed by human taste.",
  [("primary","work.html","See the work"),("ghost","trial.html","Try it free")])
home += tools()
home += f'''<section class="work" id="work">
  <div class="head">
    <h2>RECENT WORK<span class="dot">.</span></h2>
    <span class="mono">2026 &middot; SPEC + STUDIO</span>
  </div>
  <div class="tiles">
{home_tiles}  </div>
  <a class="all" href="work.html">All work &rarr;</a>
</section>

<section class="stats" id="numbers">
  <div class="srow">
    <span class="big"><span data-n="60">0</span>%</span>
    <span class="what">lower production cost</span>
    <p class="old"><span class="strike">Crew, studio, casting, location, reshoots.</span> One directed AI production.</p>
  </div>
  <div class="srow">
    <span class="big"><span data-n="3">0</span>&times;</span>
    <span class="what">faster to delivery</span>
    <p class="old"><span class="strike">Weeks of pre-production and scheduling.</span> Days of direction.</p>
  </div>
  <div class="srow">
    <span class="big">&infin;</span>
    <span class="what">locations</span>
    <p class="old"><span class="strike">Travel, permits, weather.</span> Any world you can direct.</p>
  </div>
  <p class="basis mono">Against typical UK campaign shoot budgets and timelines. Ask us to walk you through the maths on your brief.</p>
</section>

<section class="craft" id="craft">
  <div>
    <p class="eyebrow reveal"><span class="tick"></span>Why the work holds up</p>
    <h2 class="reveal">AI, WITHOUT THE TELLS<span class="dot">.</span></h2>
    <p class="lede reveal">Generated content usually gives itself away. Our process exists to remove the tells, and nothing ships until it stands next to the shoot it replaces.</p>
    <div class="checks">
      <div class="check"><span class="num mono">01</span><div><h3>One grade across the set</h3>
        <p>A hundred pieces, one shoot. Same light, same skin, same world, every frame.</p></div></div>
      <div class="check"><span class="num mono">02</span><div><h3>Direction before generation</h3>
        <p>Concept, cast and world are locked before a single frame is made.</p></div></div>
      <div class="check"><span class="num mono">03</span><div><h3>Finished by hand</h3>
        <p>Hands, fabric, type and logos corrected piece by piece before anything ships.</p></div></div>
    </div>
  </div>
  <div class="scanwrap" id="scan">
    <img id="scanImg" src="assets/tell-laundry.jpg" alt="Editorial frame under review, washing line in evening sun">
  </div>
</section>

{TRIAL}'''
home += footer()
(root/"index.html").write_text(home)

# ---------------------------------------------------------------- WORK
projs = ""
for p in PROJECTS:
    live = '<span class="live"></span>' if p["media"][0]=="video" else ""
    rows = "".join(f'<div><span class="k">{k}</span><span>{v}</span></div>' for k,v in p["rows"])
    projs += f'''  <article class="proj">
    <div class="media">{media_html(p["media"])}<span class="tag">{live}{p["tag"]}</span></div>
    <div>
      <h3>{p["name"]}</h3>
      <p>{p["blurb"]}</p>
      <div class="meta">{rows}</div>
    </div>
  </article>
'''
work = head("Work — Forvr","Recent films and stills from the studio.")
work += nav("Work")
work += hero("hero-beanbag.jpg","Selected work &middot; 2026",
  "RECENT ","FILMS",["FILMS","CAMPAIGNS","STILLS","WORLDS"],"",
  "AND STILLS<span class=\"dot\">.</span>",
  "Films and stills made this year, spec and commissioned. Every frame directed here, finished by hand.",
  [("primary","trial.html","Try it free"),("ghost","services.html","What we make")], page=True)
work += f'''<section class="section dark-band">
  <div class="sec-head">
    <h2>THE INDEX<span class="dot">.</span></h2>
    <span class="mono">6 projects &middot; 2026</span>
  </div>
{projs}
  <p class="honest-line">Spec work is labelled spec. Nothing here is a case study we cannot show you the files for, and no numbers are attached to work that has not run.</p>
</section>
'''
work += footer()
(root/"work.html").write_text(work)

# ---------------------------------------------------------------- SERVICES
LANES = [
 ("01","CAMPAIGN FILMS","Brand films, product films and social cutdowns, directed end to end.",
  ["Concept and treatment","Cast, wardrobe and world built as elements","Grade, sound design and final cut","Delivered 16:9, 9:16 and 1:1"]),
 ("02","CAMPAIGN STILLS","Full image sets that hold as one shoot, not a folder of one-offs.",
  ["Lookbooks, product and editorial","One grade locked across the set","Hand finish on fabric, hands and type","Print-ready and social crops"]),
 ("03","BRAND IDENTITY","The visual language underneath the campaign.",
  ["Direction, palette and type","Logo and mark work","Art direction guidelines","Templates your team can run"]),
 ("04","DECKS AND DOCUMENTS","Corporate work that looks like the brand, not like a template.",
  ["Pitch and sales decks","Reports and one-pagers","Built in your own file formats","Reusable master system"]),
]
lanes = "".join(f'''    <div class="lane"><span class="num">{n}</span><h3>{t}</h3><p>{d}</p>
      <ul>{"".join(f"<li>{i}</li>" for i in items)}</ul></div>
''' for n,t,d,items in LANES)

STEPS = [("01","Brief","One call or one Instagram handle. We work out what the brand already looks like."),
 ("02","Direction","Concept, cast, world and palette locked and signed off before anything is generated."),
 ("03","Production","Frames built as elements, then graded as one set."),
 ("04","Finish","Hand correction, sound, delivery in every format you need.")]
steps = "".join(f'<div class="stepc"><span class="num mono">{n}</span><h3>{t}</h3><p>{d}</p></div>' for n,t,d in STEPS)

serv = head("Services — Forvr","Campaign films, stills, identity and document design.")
serv += nav("Services")
serv += hero("hero-garden.jpg","What we make",
  "WE BUILD ","FILMS",["FILMS","CAMPAIGNS","IDENTITY","LOOKBOOKS","DECKS"],",",
  "AND THE WORLD AROUND THEM<span class=\"dot\">.</span>",
  "Four lanes, one studio. Everything is directed, produced and finished in house.",
  [("primary","trial.html","Try it free"),("ghost","work.html","See the work")], page=True)
serv += f'''<section class="section">
  <div class="sec-head">
    <h2>FOUR LANES<span class="dot">.</span></h2>
    <span class="mono">Pick one, or the full campaign</span>
  </div>
  <div class="lanes">
{lanes}  </div>
</section>

<section class="section dark-band">
  <p class="eyebrow reveal"><span class="tick"></span>How a job runs</p>
  <h2 class="reveal">FOUR STEPS, DAYS NOT MONTHS<span class="dot">.</span></h2>
  <p class="lede reveal">The same route every time, whether it is one image or a full campaign.</p>
  <div class="steps-row">{steps}</div>
</section>
'''
serv += footer()
(root/"services.html").write_text(serv)

# ---------------------------------------------------------------- STUDIO
FACTS = [("Where","Reading, England. Working with brands anywhere."),
 ("Who","One founder, directing every job start to finish."),
 ("Turnaround","Days. A full campaign in a working week.")]
facts = "".join(f'<div class="fact"><span class="k">{k}</span><p>{v}</p></div>' for k,v in FACTS)

stud = head("Studio — Forvr","One founder, no handoffs. How Forvr works.")
stud += nav("Studio")
stud += hero("hero-desert.jpg","The studio",
  "HOW WE ","DIRECT",["DIRECT","BUILD","FINISH","SHIP"],",",
  "AND WHY IT HOLDS<span class=\"dot\">.</span>",
  "Forvr is a one-person studio built around direction. The tools changed, the standard did not.",
  [("primary","trial.html","Try it free"),("ghost","contact.html","Get in touch")], page=True)
stud += f'''<section class="section">
  <div class="split">
    <div>
      <p class="eyebrow reveal"><span class="tick"></span>No handoffs</p>
      <p class="pquote reveal">You brief the person who directs, produces and finishes the work<span class="dot">.</span></p>
      <p class="lede reveal" style="margin-top:26px">No account layer, no junior pass, no brief lost between departments. That is why a campaign takes days: there is nobody to wait for.</p>
      <div class="factlist">{facts}</div>
    </div>
    <div class="imgwrap"><img src="assets/still-studio.jpg" alt="Studio portrait from a recent Forvr set"></div>
  </div>
</section>

<section class="section dark-band">
  <p class="eyebrow reveal"><span class="tick"></span>The method</p>
  <h2 class="reveal">DIRECTION FIRST<span class="dot">.</span></h2>
  <p class="lede reveal">Generation is the last step, not the first. Everything upstream of it is the job.</p>
  <div class="steps-row" style="margin-top:48px">
    <div class="stepc"><span class="num mono">01</span><h3>Read the brand</h3><p>What it already looks like, who it sells to, what it must never look like.</p></div>
    <div class="stepc"><span class="num mono">02</span><h3>Build the world</h3><p>Locations, cast and props built once as elements, reused across every frame.</p></div>
    <div class="stepc"><span class="num mono">03</span><h3>Hold the grade</h3><p>One light and one palette locked, so a hundred pieces read as a single shoot.</p></div>
    <div class="stepc"><span class="num mono">04</span><h3>Finish by hand</h3><p>Hands, fabric, type and logos corrected frame by frame before anything ships.</p></div>
  </div>
</section>
'''
stud += footer()
(root/"studio.html").write_text(stud)

# ---------------------------------------------------------------- CONTACT
cont = head("Contact — Forvr","Start a project, or take the free trial.")
cont += nav("Contact")
cont += hero("hero-monk.jpg","Start something",
  "LET'S BUILD YOUR ","CAMPAIGN",["CAMPAIGN","FILM","WORLD","IDENTITY"],".",
  "",
  "One email is enough. Tell us the brand and what is coming up.",
  [("primary","mailto:hello@forvr.org","Email the studio"),("ghost","trial.html","Try it free")], page=True)
cont += '''<section class="section">
  <div class="contact-grid">
    <div>
      <p class="eyebrow reveal"><span class="tick"></span>Start a project</p>
      <h2 class="reveal" style="font-size:clamp(30px,3.6vw,56px)">TELL US MORE<span class="dot">.</span></h2>
      <p class="lede reveal">A brief, a sketch, or just a feeling. We reply the same working day.</p>
      <form class="enq" action="https://formspree.io/f/mdajrlge" method="POST">
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp">
        <input type="hidden" name="_subject" value="forvr.org enquiry">
        <div class="frow">
          <label class="field half"><span class="lbl">Name <span class="req">*</span></span>
            <input type="text" name="name" required placeholder="Your name" autocomplete="name"></label>
          <label class="field half"><span class="lbl">Email <span class="req">*</span></span>
            <input type="email" name="email" required placeholder="you@brand.com" autocomplete="email"></label>
        </div>
        <label class="field"><span class="lbl">Brand or company</span>
          <input type="text" name="brand" placeholder="Optional" autocomplete="organization"></label>
        <label class="field"><span class="lbl">Rough budget</span>
          <select name="budget">
            <option value="">Skip</option>
            <option>Under &pound;1k</option>
            <option>&pound;1k to &pound;3k</option>
            <option>&pound;3k to &pound;5k</option>
            <option>&pound;5k to &pound;10k</option>
            <option>&pound;10k+</option>
            <option>Not sure yet</option>
          </select></label>
        <label class="field"><span class="lbl">What do you need <span class="req">*</span></span>
          <textarea name="message" rows="5" required placeholder="What are you looking to get done?"></textarea></label>
        <button type="submit" class="btn primary">Send message</button>
      </form>
    </div>
    <div>
      <p class="eyebrow reveal"><span class="tick"></span>Direct</p>
      <a class="bigmail" href="mailto:hello@forvr.org">hello@forvr.org</a>
      <div class="clist">
        <div class="crow"><span class="k">Studio</span><span>Reading, England</span></div>
        <div class="crow"><span class="k">Instagram</span><a href="https://instagram.com/forvr.cr" target="_blank" rel="noopener">@forvr.cr</a></div>
        <div class="crow"><span class="k">Typical reply</span><span>Same working day</span></div>
        <div class="crow"><span class="k">Working with</span><span>Consumer brands, anywhere</span></div>
      </div>
      <div class="trialcard">
        <span class="tstamp mono">72H</span>
        <h3>Not ready to brief us<span class="dot">?</span></h3>
        <p>Send your Instagram and nothing else. Three finished pieces built from your brand, back within 72 hours, yours whether you book us or not.</p>
        <a class="btn primary" href="trial.html">Start the free trial</a>
        <span class="mono fine">NO CARD &middot; NO COMMITMENT</span>
      </div>
    </div>
  </div>
</section>
'''
cont += footer()
(root/"contact.html").write_text(cont)
print("built: index, work, services, studio, contact")
