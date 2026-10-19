/* Patch lead tracker, concept demo. Everything is in memory: made-up people, Ofcom drama numbers
   (07700 900xxx), times worked out from "now" so the board always looks current. Nothing is sent. */
(function () {
  const STAGES = ["New", "Replied", "Consult booked", "Treated", "Review asked"];
  const SOURCES = {
    chat: { via: "the website chat", short: "Chat", label: "Chat", icon: '<path d="M4 5h16v11H9l-5 4z"/>' },
    form: { via: "the website form", short: "Form", label: "Website form", icon: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>' },
    ig: { via: "Instagram DM", short: "Instagram", label: "Instagram DM", icon: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/>' },
    call: { via: "a phone call", short: "Call", label: "Call", icon: '<path d="M6 3l3 1 1 5-2 1a12 12 0 0 0 6 6l1-2 5 1 1 3-2 3C10 21 3 14 3 5z"/>' }
  };
  const NURSE = { "Dark marks": "Ama Mensah", "Early lines": "Ama Mensah", Breakouts: "Tom Hartley", Texture: "Tom Hartley", Redness: "Priya Lal", "Dull skin": "Priya Lal" };

  const NOW = new Date();
  const MIN = 60000;
  const ago = (m) => new Date(NOW - m * MIN);
  const at = (days, hm) => { const d = new Date(NOW); d.setDate(d.getDate() + days); const [h, m] = hm.split(":"); d.setHours(+h, +m, 0, 0); return d; };
  const endOfToday = at(0, "23:59");

  function seed() {
    return [
      { id: "leah", name: "Leah Morgan", phone: "07700 900184", source: "ig", interest: "Breakouts", stage: 0, first: ago(64), last: ago(64),
        message: "Hiya, how much are the peels? I've had spots on my jaw for about 3 years and nothing works",
        nudge: { at: ago(4), text: "Reply on Instagram: peel prices and the £30 assessment" } },
      { id: "daniel", name: "Daniel Price", phone: "07700 900233", source: "form", interest: "Texture", stage: 0, first: ago(190), last: ago(190),
        message: "Old acne scars on both cheeks. Looking at microneedling, how many sessions would I need?",
        nudge: { at: at(0, "17:00"), text: "Email: microneedling, three to six sessions, results on skin type III" } },
      { id: "aisha", name: "Aisha Bello", phone: "07700 900417", source: "call", interest: "Redness", stage: 0, first: at(-1, "18:40"), last: at(-1, "18:41"),
        message: "Missed call at 18:40, no voicemail. Auto text sent: \"Sorry we missed you, what's it about?\" Reply: \"redness on my cheeks\"",
        nudge: { at: at(-1, "19:00"), text: "Call back: she replied to the missed-call text" } },
      { id: "hannah", name: "Hannah Reed", phone: "07700 900352", source: "form", interest: "Redness", stage: 1, first: at(-3, "21:12"), last: at(-1, "11:05"),
        message: "My cheeks go red at the slightest thing. Is that something you can help with?",
        nudge: { at: at(1, "10:00"), text: "Follow up: send redness results on skin type II" } },
      { id: "marcus", name: "Marcus Hill", phone: "07700 900629", source: "ig", interest: "Dark marks", nurse: "Priya Lal", stage: 1, first: at(-4, "22:30"), last: at(-2, "13:20"),
        message: "Do you treat dark marks on black skin? Had bad experiences with lasers",
        nudge: { at: at(0, "12:00"), text: "Check in: still want an assessment with Priya?" } },
      { id: "chloe", name: "Chloe Evans", phone: "07700 900771", source: "chat", interest: "Early lines", stage: 1, first: at(-3, "23:48"), last: at(-3, "23:52"),
        message: "Chat at 23:48: asked about skin boosters and evening appointments. Booked nothing, asked for an email.",
        nudge: { at: at(1, "09:30"), text: "Email: skin boosters from £220, evenings till 8pm" } },
      { id: "ryan", name: "Ryan Cole", phone: "07700 900505", source: "form", interest: "Texture", stage: 2, first: at(-6, "08:15"), last: at(-2, "16:40"), booked: at(1, "18:00"),
        message: "Want to sort my skin texture before a wedding in March",
        nudge: { at: at(0, "10:00"), text: "Reminder text: assessment tomorrow 6pm, with directions" } },
      { id: "nadia", name: "Nadia Khan", phone: "07700 900938", source: "call", interest: "Dark marks", stage: 2, first: at(-5, "12:02"), last: at(-5, "12:10"), booked: at(3, "17:30"),
        message: "Called in her lunch break. Dark marks after spots, skin type V. Booked with Ama.",
        nudge: { at: at(2, "10:00"), text: "Reminder text the day before" } },
      { id: "ellie", name: "Ellie Walsh", phone: "07700 900246", source: "chat", interest: "Breakouts", stage: 2, first: at(-2, "22:05"), last: at(-2, "22:09"), booked: at(5, "10:00"),
        message: "Chat at 22:05: spots on chin, asked if peels sting. Booked a Saturday assessment from the chat.",
        nudge: { at: at(4, "10:00"), text: "Reminder text the day before" } },
      { id: "grace", name: "Grace Turner", phone: "07700 900318", source: "ig", interest: "Breakouts", stage: 3, first: at(-30, "19:00"), last: at(-4, "15:30"),
        message: "Peel 2 of 3 done. Skin calmer, a little flaky on day 3 as expected.",
        nudge: { at: at(0, "11:00"), text: "Book peel 3 for two weeks after peel 2" } },
      { id: "olivia", name: "Olivia Bennett", phone: "07700 900664", source: "form", interest: "Dull skin", stage: 3, first: at(-12, "10:40"), last: at(-2, "14:00"),
        message: "Deep cleanse facial done. Going away next week, wanted her skin to look less tired.",
        nudge: { at: at(3, "11:00"), text: "Ask how her skin feels, then ask for a review" } },
      { id: "jess", name: "Jess Moore", phone: "07700 900123", source: "chat", interest: "Dark marks", stage: 4, first: at(-70, "21:30"), last: at(-2, "18:00"), review: "left",
        message: "Four peels done. Review request sent two days ago.", nudge: null },
      { id: "kemi", name: "Kemi Adeyemi", phone: "07700 900859", source: "call", interest: "Redness", stage: 4, first: at(-50, "09:20"), last: at(-1, "18:00"), review: "waiting",
        message: "Two light sessions done. Review request sent yesterday.",
        nudge: { at: at(5, "11:00"), text: "One gentle review reminder, then stop" } },
      { id: "ben", name: "Ben Ward", phone: "07700 900492", source: "ig", interest: "Texture", stage: 4, first: at(-90, "13:00"), last: at(-6, "18:00"), review: "left",
        message: "Microneedling course finished. Review request sent six days ago.", nudge: null }
    ].map((l) => ({ ...l, history: history(l) }));
  }

  function history(l) {
    const h = [{ at: l.first, text: `Enquiry via ${SOURCES[l.source].via}` }];
    // replies go out within the hour in opening hours, otherwise first thing next morning
    const open = l.first.getHours() >= 10 && l.first.getHours() < 19;
    const replied = open ? new Date(+l.first + 40 * MIN) : (() => { const d = new Date(l.first); if (d.getHours() >= 10) d.setDate(d.getDate() + 1); d.setHours(10, 12, 0, 0); return d; })();
    if (l.stage >= 1) h.push({ at: replied, text: "Replied" });
    if (l.booked) h.push({ at: l.last, text: `Assessment booked for ${when(l.booked)}` });
    if (l.stage >= 3) h.push({ at: l.last, text: "Treated" });
    if (l.stage >= 4) h.push({ at: l.last, text: "Review request sent" });
    if (l.review === "left") h.push({ at: new Date(+l.last + 300 * MIN), text: "Left a Google review" });
    return h.reverse();
  }

  // ---------- formatting
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hm = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  function when(d) {
    const diff = (d - NOW) / MIN;
    if (diff <= 0 && diff > -60) return `${Math.max(1, Math.round(-diff))} min ago`;
    if (sameDay(d, NOW)) return `Today ${hm(d)}`;
    if (sameDay(d, at(-1, "12:00"))) return `Yesterday ${hm(d)}`;
    if (sameDay(d, at(1, "12:00"))) return `Tomorrow ${hm(d)}`;
    if (Math.abs(diff) < 6 * 1440) return `${DAY[d.getDay()]} ${hm(d)}`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  function due(l) {
    if (!l.nudge) return null;
    if (l.fresh) return { cls: "today", label: "Just in" };
    const t = l.nudge.at;
    if (t > endOfToday) return { cls: "later", label: when(t) };
    if (t < NOW) {
      const late = (NOW - t) / MIN;
      return { cls: "late", label: late < 60 ? "Due now" : late < 1440 && sameDay(t, NOW) ? `Due ${hm(t)}` : "Overdue" };
    }
    return { cls: "today", label: `Due ${hm(t)}` };
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (src) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${SOURCES[src].icon}</svg>`;
  const srcTag = (src, short) => `<span class="src src--${src}">${icon(src)}${short ? SOURCES[src].short : SOURCES[src].label}</span>`;

  // ---------- state
  let leads = seed();
  let filter = "all";
  let openId = null;
  let returnFocus = null;
  const $ = (s) => document.querySelector(s);

  function chatLead() {
    // A call-back left in the chat demo (same tab only, never in the URL).
    let raw = null;
    try { raw = JSON.parse(sessionStorage.getItem("forvr-demo:patch-lead")); } catch {}
    if (!raw || !raw.name) return null;
    const interest = { "dark-marks": "Dark marks", breakouts: "Breakouts", texture: "Texture", redness: "Redness", "early-lines": "Early lines", "dull-skin": "Dull skin" }[raw.treatment] || "Skin assessment";
    const t = new Date(raw.at || NOW);
    return addLead({ id: "chat-" + (raw.at || 1), name: String(raw.name).slice(0, 60), phone: String(raw.phone || "").slice(0, 20), source: "chat", interest, stage: 0, first: t, last: t,
      message: `Chat: asked for a call back${raw.when ? " (" + String(raw.when).slice(0, 60) + ")" : ""}. Conversation attached.`,
      nudge: { at: t, text: `Call back${raw.when ? ", " + String(raw.when).slice(0, 60) : " today"}` } });
  }
  function addLead(l) {
    if (leads.some((x) => x.id === l.id)) return null;
    l.history = [{ at: l.first, text: "Enquiry via chat, call back requested" }];
    leads.unshift(l);
    return l;
  }

  // ---------- render
  function visible() { return leads.filter((l) => filter === "all" || l.source === filter); }

  function render() {
    $("#today").textContent = NOW.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const weekAgo = ago(7 * 1440);
    const waiting = leads.filter((l) => l.nudge && l.nudge.at <= endOfToday);
    $("#stats").innerHTML = [
      ["New enquiries, last 7 days", leads.filter((l) => l.first >= weekAgo).length],
      ["Waiting on a reply today", waiting.length],
      ["Consults booked", leads.filter((l) => l.stage === 2).length],
      ["Google reviews left", leads.filter((l) => l.review === "left").length]
    ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("");

    $("#filters").innerHTML = [["all", "All"], ...Object.entries(SOURCES).map(([k, v]) => [k, v.label])]
      .map(([k, label]) => {
        const n = k === "all" ? leads.length : leads.filter((l) => l.source === k).length;
        return `<button type="button" data-filter="${k}" aria-pressed="${filter === k}">${k === "all" ? "" : icon(k)}${label}<span>${n}</span></button>`;
      }).join("");

    const list = visible().filter((l) => l.nudge && l.nudge.at <= endOfToday).sort((a, b) => (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0) || a.nudge.at - b.nudge.at);
    $("#rt-count").textContent = list.length;
    $("#reply-today").innerHTML = list.length ? list.map((l) => {
      const d = due(l);
      return `<li><button type="button" class="rt" data-open="${l.id}">
        <span class="rt__due due--${d.cls}">${d.label}</span>
        <span class="rt__name">${esc(l.name)}</span>
        <span class="rt__what">${esc(l.nudge.text)}</span>
        <span class="rt__meta">${srcTag(l.source)}<span>${esc(l.interest)}</span></span>
      </button></li>`;
    }).join("") : `<li class="empty">Nobody waiting. Every enquiry has had a reply.</li>`;

    $("#board").innerHTML = STAGES.map((s, i) => {
      const cards = visible().filter((l) => l.stage === i);
      return `<div class="col" data-stage="${i}">
        <div class="col-head"><h2>${s}</h2><span class="count">${cards.length}</span></div>
        <div class="col__cards">${cards.map(card).join("") || '<p class="col__empty">Nothing here</p>'}</div>
      </div>`;
    }).join("");
  }

  function card(l) {
    const d = due(l);
    const tag = l.stage === 2 && l.booked ? `<span class="badge">Booked ${when(l.booked)}</span>`
      : l.review === "left" ? `<span class="badge badge--ok">Review left</span>`
      : d && d.cls !== "later" ? `<span class="badge due--${d.cls}">${d.label}</span>` : "";
    return `<button type="button" class="card${l.fresh ? " is-fresh" : ""}" draggable="true" data-open="${l.id}" data-id="${l.id}">
      <span class="card__name">${esc(l.name)}</span>
      <span class="card__int">${esc(l.interest)}</span>
      <span class="card__meta">${srcTag(l.source, true)}<span class="card__last">${when(l.last)}</span></span>
      ${tag}
    </button>`;
  }

  // ---------- drawer
  function nextAction(l) {
    if (l.stage === 0) return "Mark replied";
    if (l.stage < STAGES.length - 1) return `Move to ${STAGES[l.stage + 1]}`;
    return null;
  }
  function openDrawer(id, from) {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    openId = id;
    returnFocus = from || document.activeElement;
    const d = due(l);
    const next = nextAction(l);
    $("#drawer").innerHTML = `
      <div class="d-head">
        <div><h2 id="d-name">${esc(l.name)}</h2><p class="d-sub">${srcTag(l.source)}<span class="stage-pill">${STAGES[l.stage]}</span></p></div>
        <button type="button" class="x" data-close aria-label="Close">Close</button>
      </div>
      <div class="d-body">
        <blockquote class="d-msg"><span>First message</span>${esc(l.message)}</blockquote>
        <dl class="d-facts">
          <div><dt>Interested in</dt><dd>${esc(l.interest)}</dd></div>
          <div><dt>Nurse</dt><dd>${l.nurse || NURSE[l.interest] || "Next free nurse"}</dd></div>
          <div><dt>Phone</dt><dd>${esc(l.phone || "Not given")}</dd></div>
          <div><dt>Came in</dt><dd>${when(l.first)}</dd></div>
          <div><dt>Last contact</dt><dd>${when(l.last)}</dd></div>
          ${l.booked ? `<div><dt>Assessment</dt><dd>${when(l.booked)}</dd></div>` : ""}
        </dl>
        <section class="d-nudge${l.nudge ? "" : " is-none"}" aria-labelledby="dn-h">
          <h3 id="dn-h">Next nudge</h3>
          ${l.nudge ? `<p class="d-nudge__when due--${d.cls}">${d.cls === "later" ? when(l.nudge.at) : d.label}</p>
            <p class="d-nudge__what">${esc(l.nudge.text)}</p>
            <div class="d-nudge__btns"><button type="button" class="btn" data-act="send">Done, log it</button><button type="button" class="btn btn--ghost" data-act="snooze">Tomorrow instead</button></div>`
          : `<p class="d-nudge__what">${l.review === "left" ? "Nothing to do. They left a review." : "Nothing scheduled."}</p>`}
        </section>
        <section aria-labelledby="ds-h">
          <h3 id="ds-h">Stage</h3>
          <div class="d-stages">${STAGES.map((s, i) => `<button type="button" data-stage-set="${i}" aria-pressed="${i === l.stage}">${s}</button>`).join("")}</div>
        </section>
        <section aria-labelledby="dh-h">
          <h3 id="dh-h">History</h3>
          <ol class="d-hist">${l.history.map((h) => `<li><span>${when(h.at)}</span>${esc(h.text)}</li>`).join("")}</ol>
        </section>
      </div>
      ${next ? `<div class="d-foot"><button type="button" class="btn btn--wide" data-act="next">${next}</button></div>` : ""}`;
    $("#drawer").hidden = false; $("#scrim").hidden = false;
    requestAnimationFrame(() => { $("#drawer").classList.add("is-open"); $("#scrim").classList.add("is-open"); });
    $("#drawer [data-close]").focus({ preventScroll: true });
  }
  function closeDrawer() {
    if (!openId) return;
    openId = null;
    $("#drawer").classList.remove("is-open"); $("#scrim").classList.remove("is-open");
    setTimeout(() => { if (!openId) { $("#drawer").hidden = true; $("#scrim").hidden = true; } }, 260);
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  }

  const NEXT_NUDGE = [
    null,
    () => ({ at: at(2, "10:00"), text: "Follow up if no answer: send results on skin like theirs" }),
    () => ({ at: at(1, "10:00"), text: "Reminder text the day before, with directions" }),
    () => ({ at: at(3, "11:00"), text: "Ask how their skin feels, book the next session" }),
    () => ({ at: at(5, "11:00"), text: "One gentle review reminder, then stop" })
  ];
  function setStage(l, i) {
    if (i === l.stage) return;
    l.stage = i;
    l.last = new Date();
    l.fresh = false;
    l.history.unshift({ at: new Date(), text: i === 1 ? "Replied" : i === 4 ? "Review request sent" : `Moved to ${STAGES[i]}` });
    l.nudge = NEXT_NUDGE[i] ? NEXT_NUDGE[i]() : null;
    if (i === 2 && !l.booked) l.booked = at(2, "17:30");
    toast(`${l.name.split(" ")[0]} moved to ${STAGES[i]}`);
  }
  function act(kind) {
    const l = leads.find((x) => x.id === openId);
    if (!l) return;
    if (kind === "send") {
      l.history.unshift({ at: new Date(), text: `Done: ${l.nudge.text}` });
      l.last = new Date();
      l.nudge = l.stage === 0 ? null : NEXT_NUDGE[l.stage]?.() || null;
      if (l.stage === 0) setStage(l, 1);
      toast("Logged. Concept demo: no message was actually sent.");
    } else if (kind === "snooze") {
      l.nudge = { ...l.nudge, at: at(1, hm(l.nudge.at)) };
      toast("Moved to tomorrow");
    } else if (kind === "next") {
      setStage(l, Math.min(l.stage + 1, STAGES.length - 1));
    }
    render();
    openDrawer(l.id, returnFocus);
  }

  let tt;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  // ---------- events
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) return openDrawer(o.dataset.open, o);
    if (e.target.closest("[data-close]") || e.target === $("#scrim")) return closeDrawer();
    const a = e.target.closest("[data-act]");
    if (a) return act(a.dataset.act);
    const s = e.target.closest("[data-stage-set]");
    if (s) { const l = leads.find((x) => x.id === openId); setStage(l, +s.dataset.stageSet); render(); return openDrawer(l.id, returnFocus); }
    const f = e.target.closest("[data-filter]");
    if (f) { filter = f.dataset.filter; render(); return; }
    const v = e.target.closest("[data-view]");
    if (v && v.tagName === "BUTTON") {
      document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-selected", String(b === v)));
      $(".layout").dataset.view = v.dataset.view;
    }
  });
  $("#reset").addEventListener("click", () => { leads = seed(); filter = "all"; closeDrawer(); render(); toast("Demo reset"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
    if (e.key === "Tab" && openId) {
      const f = [...$("#drawer").querySelectorAll("button")];
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // drag a card to another column
  let dragId = null;
  document.addEventListener("dragstart", (e) => { const c = e.target.closest?.(".card"); if (c) { dragId = c.dataset.id; e.dataTransfer.effectAllowed = "move"; c.classList.add("is-drag"); } });
  document.addEventListener("dragend", () => { dragId = null; document.querySelectorAll(".is-drag,.is-over").forEach((x) => x.classList.remove("is-drag", "is-over")); });
  document.addEventListener("dragover", (e) => { const col = e.target.closest?.(".col"); if (col && dragId) { e.preventDefault(); document.querySelectorAll(".is-over").forEach((x) => x !== col && x.classList.remove("is-over")); col.classList.add("is-over"); } });
  document.addEventListener("drop", (e) => {
    const col = e.target.closest?.(".col");
    if (!col || !dragId) return;
    e.preventDefault();
    const l = leads.find((x) => x.id === dragId);
    setStage(l, +col.dataset.stage);
    render();
  });

  // ---------- start
  const fromChat = chatLead();
  if (fromChat) { fromChat.fresh = true; }
  render();
  if (fromChat) toast(`New lead from chat: ${fromChat.name.split(" ")[0]}`);

  // ?play=1: a hands-free run for screen recordings
  if (new URLSearchParams(location.search).get("play") === "1") {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const isPhone = matchMedia("(max-width:900px)").matches;
    (async () => {
      await wait(1600);
      const sam = addLead({ id: "sam", name: "Sam Carter", phone: "07700 900123", source: "chat", interest: "Dark marks", stage: 0, first: new Date(), last: new Date(),
        message: "Chat just now: dark marks from old spots, asked if it's ok on darker skin, then asked for a call back after 6pm.",
        nudge: { at: at(0, "18:00"), text: "Call back after 6pm" } });
      if (sam) sam.fresh = true;
      render();
      toast("New lead from chat: Sam, dark marks");
      await wait(2600);
      openDrawer("sam", document.querySelector('[data-open="sam"]'));
      await wait(3200);
      document.querySelector('#drawer [data-act="send"]')?.click();
      await wait(2600);
      closeDrawer();
      if (isPhone) { await wait(600); document.querySelector('.seg [data-view="board"]').click(); }
      await wait(1400);
      openDrawer("olivia", document.querySelector('[data-open="olivia"]'));
      await wait(2400);
      document.querySelector('#drawer [data-act="next"]')?.click();
      await wait(2400);
      closeDrawer();
    })();
  }
})();
