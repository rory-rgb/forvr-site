/* Forvr clinic assistant widget.
   Copy of ~/Code/03_Websites/clinic-assistant/public/widget.js with one addition: data-mode="scripted".
   Scripted mode makes no network calls. Config and replies come from window.FORVR_ASSISTANT_SCRIPTED
   (see scripted.js), so the public concept demo needs no API key and cannot be abused.
   Add to any site with one line:
   <script src="https://YOUR-ASSISTANT-HOST/widget.js" data-clinic="alder-wren" defer></script>
   Optional: data-label="Ask us anything"  data-position="left"  data-open="true" */
(function () {
  if (window.__forvrAssistant) return;
  window.__forvrAssistant = true;

  const script = document.currentScript || document.querySelector("script[data-clinic]");
  const CLINIC = script.dataset.clinic;
  const API = new URL(script.src).origin;
  const SCRIPTED = script.dataset.mode === "scripted" ? window.FORVR_ASSISTANT_SCRIPTED : null;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Same shape as fetch().then(r => r.json()) so the rest of the widget is unchanged.
  async function call(route, body) {
    if (!SCRIPTED) {
      const r = await fetch(API + route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { ok: r.ok, json: await r.json() };
    }
    if (route === "/api/chat") {
      const turn = SCRIPTED.reply(body.messages);
      await wait(700 + Math.min(1400, turn.reply.length * 9));
      return { ok: true, json: turn };
    }
    await wait(600);
    return { ok: true, json: SCRIPTED.lead(body) };
  }
  const LABEL = script.dataset.label || "Ask us anything";
  const LEFT = script.dataset.position === "left";
  const STORE = "forvr-assistant:" + CLINIC;

  const store = {
    get() { try { return JSON.parse(sessionStorage.getItem(STORE)) || null; } catch { return null; } },
    set(v) { try { sessionStorage.setItem(STORE, JSON.stringify(v)); } catch {} }
  };

  let cfg = null;
  let state = store.get() || { history: [], open: false };
  let busy = false;

  const host = document.createElement("div");
  host.setAttribute("data-forvr-assistant", "");
  const root = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (href) => (href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:") ? href : new URL(href, API).href);

  function css(t) {
    return `
:host{all:initial}
*{box-sizing:border-box}
.w{--a:${t.accent};--ink:${t.ink};--bg:${t.surface};--mu:${t.muted};font:15px/1.5 ${t.font};color:var(--ink);-webkit-font-smoothing:antialiased}
.launch{position:fixed;${LEFT ? "left" : "right"}:20px;bottom:24px;z-index:2147483000;display:flex;align-items:center;gap:10px;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:10px 18px 10px 10px;font:600 14px ${t.font};cursor:pointer;box-shadow:0 14px 34px rgba(20,10,20,.28);transition:transform .2s ease}
.launch:hover{transform:translateY(-2px)}
.launch:focus-visible,button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--a);outline-offset:2px}
.launch i{width:30px;height:30px;border-radius:50%;background:var(--a);display:grid;place-items:center;font-style:normal}
.launch .live{width:8px;height:8px;border-radius:50%;background:#5fd38d;box-shadow:0 0 0 3px rgba(95,211,141,.25)}
.panel{position:fixed;${LEFT ? "left" : "right"}:20px;bottom:88px;z-index:2147483001;width:min(380px,calc(100vw - 28px));height:min(600px,calc(100vh - 120px));background:var(--bg);border-radius:18px;box-shadow:0 24px 60px rgba(20,10,20,.3);display:flex;flex-direction:column;overflow:hidden}
.panel[hidden]{display:none}
.head{background:var(--ink);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.head b{font-size:15px}.head small{display:block;color:rgba(255,255,255,.7);font-size:12px;margin-top:2px}
.x{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}
.msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
.m{max-width:86%;padding:10px 14px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}
.bot{background:var(--mu);border-bottom-left-radius:4px}
.me{background:var(--a);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.acts{display:flex;flex-wrap:wrap;gap:8px;margin:-2px 0 4px}
.btn{display:inline-flex;align-items:center;justify-content:center;font:600 13.5px ${t.font};border-radius:10px;padding:9px 13px;cursor:pointer;text-decoration:none;border:1px solid var(--a);background:#fff;color:var(--a)}
.btn.p{background:var(--a);color:#fff}
.chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 10px}
.chips button{font:500 13px ${t.font};border:1px solid rgba(0,0,0,.14);background:var(--bg);color:var(--ink);border-radius:999px;padding:7px 12px;cursor:pointer}
.chips button:hover{border-color:var(--a);color:var(--a)}
form.in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.08)}
form.in textarea{flex:1;resize:none;border:1px solid rgba(0,0,0,.16);border-radius:12px;padding:10px 12px;font:16px/1.35 ${t.font};color:var(--ink);max-height:110px;background:#fff}
form.in button{border:0;background:var(--a);color:#fff;border-radius:12px;padding:0 14px;font:600 14px ${t.font};cursor:pointer}
form.in button:disabled{opacity:.5;cursor:default}
.foot{padding:0 14px 10px;font-size:11.5px;color:rgba(0,0,0,.55);line-height:1.4}
.foot a{color:inherit}
.typing{display:inline-flex;gap:4px;padding:4px 0}.typing span{width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,.35);animation:b 1s infinite}
.typing span:nth-child(2){animation-delay:.15s}.typing span:nth-child(3){animation-delay:.3s}
@keyframes b{0%,60%,100%{opacity:.25}30%{opacity:1}}
.cb{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:12px;display:grid;gap:8px}
.cb label{font-size:12.5px;font-weight:600;display:grid;gap:4px}
.cb input[type=text],.cb input[type=tel]{border:1px solid rgba(0,0,0,.16);border-radius:9px;padding:9px 10px;font:16px ${t.font};color:var(--ink);width:100%}
.cb .ok{display:flex;gap:8px;align-items:flex-start;font-weight:400;font-size:12.5px}
.cb .err{color:#a1263a;font-size:12.5px;min-height:1em}
.cb .hp{position:absolute;left:-9999px}
.demo{background:var(--mu);border:1px dashed var(--a);border-radius:12px;padding:10px 12px;font-size:12.5px;white-space:pre-wrap;display:grid;gap:10px;justify-items:start}
@media (max-width:600px){
  .panel{inset:0;width:100%;height:100%;height:100dvh;max-height:none;border-radius:0}
  .launch{bottom:${script.dataset.offset || "86"}px;${LEFT ? "left" : "right"}:14px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
  }

  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  let panel, msgs, chips, input, form, launch;

  function build() {
    const t = cfg.theme;
    root.innerHTML = `<style>${css(t)}</style>
<div class="w">
  <button class="launch" aria-expanded="false" aria-controls="p"><i aria-hidden="true">✦</i>${esc(LABEL)}<span class="live" aria-hidden="true"></span></button>
  <div class="panel" id="p" role="dialog" aria-modal="false" aria-label="${esc(cfg.name)} assistant" hidden>
    <div class="head"><div><b>${esc(cfg.name)}</b><small>${SCRIPTED ? "Concept: made-up business, illustrative data" : "Automated assistant · replies any time"}</small></div><button class="x" aria-label="Close chat">×</button></div>
    <div class="msgs" aria-live="polite"></div>
    <div class="chips"></div>
    <form class="in"><label style="position:absolute;left:-9999px" for="q">Your message</label><textarea id="q" rows="1" maxlength="600" placeholder="Type your question" enterkeyhint="send"></textarea><button type="submit" aria-label="Send">Send</button></form>
    <div class="foot">An automated assistant that can't give medical advice. Please don't share medical details here. Chats aren't stored.${cfg.privacy_url ? ` <a href="${esc(link(cfg.privacy_url))}" target="_blank" rel="noopener">Privacy</a>` : ""}</div>
  </div>
</div>`;
    launch = root.querySelector(".launch");
    panel = root.querySelector(".panel");
    msgs = root.querySelector(".msgs");
    chips = root.querySelector(".chips");
    form = root.querySelector("form.in");
    input = root.querySelector("textarea");

    launch.onclick = () => toggle(panel.hidden);
    root.querySelector(".x").onclick = () => toggle(false);
    root.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) toggle(false); });
    form.onsubmit = (e) => { e.preventDefault(); send(input.value); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
    input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 110) + "px"; });

    redraw();
    if (state.open || script.dataset.open === "true") toggle(true);
  }

  function toggle(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    state.open = open; store.set(state);
    if (open) { setTimeout(() => input.focus({ preventScroll: true }), 30); msgs.scrollTop = msgs.scrollHeight; }
    else launch.focus();
  }

  function bubble(text, who) {
    const d = el(`<div class="m ${who}"></div>`);
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function actions(turn) {
    const a = turn.action;
    if (!a || a === "none") return;
    const box = el(`<div class="acts"></div>`);
    if (a === "book_online") {
      box.appendChild(el(`<a class="btn p" href="${esc(link(turn.booking_url || cfg.booking_url))}" target="_blank" rel="noopener">Book online</a>`));
      box.appendChild(callbackButton("Ask them to call me", turn));
    } else if (a === "callback" || a === "handoff") {
      box.appendChild(callbackButton(a === "handoff" ? "Ask the team to call me" : "Ask them to call me", turn));
      box.appendChild(el(`<a class="btn" href="${esc(cfg.phone_href)}">Call ${esc(cfg.phone)}</a>`));
    }
    msgs.appendChild(box);
  }

  function callbackButton(label, turn) {
    const b = el(`<button class="btn" type="button">${esc(label)}</button>`);
    b.onclick = () => { b.parentElement.remove(); callbackForm(turn); };
    return b;
  }

  function callbackForm(turn) {
    const f = el(`<form class="cb" novalidate>
  <label>Your name<input type="text" name="name" autocomplete="name" required maxlength="80"></label>
  <label>Phone number<input type="tel" name="phone" autocomplete="tel" inputmode="tel" required maxlength="20"></label>
  <label>Best time to call<input type="text" name="preferred_time" placeholder="e.g. weekday evenings" maxlength="80"></label>
  <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <label class="ok"><input type="checkbox" name="consent"> <span>I'm happy for ${esc(cfg.name)} to call me about this request.</span></label>
  <div class="err" role="alert"></div>
  <button class="btn p" type="submit">Send request</button>
</form>`);
    f.onsubmit = async (e) => {
      e.preventDefault();
      const err = f.querySelector(".err");
      const data = Object.fromEntries(new FormData(f));
      const body = { clinic: CLINIC, name: data.name, phone: data.phone, preferred_time: data.preferred_time, treatment: turn.treatment || "", website: data.website, consent: !!data.consent };
      f.querySelector("button[type=submit]").disabled = true;
      try {
        const { ok, json: j } = await call("/api/lead", body);
        if (!ok) throw new Error(j.error || "That didn't send");
        f.remove();
        const done = `Thanks ${data.name.split(" ")[0]}, that's sent. The team will call you${data.preferred_time ? " (" + data.preferred_time + ")" : ""}, during opening hours.`;
        bubble(done, "bot");
        state.history.push({ role: "assistant", content: done, ui: true });
        store.set(state);
        if (j.demo) {
          const d = el(`<div class="demo"></div>`);
          d.textContent = j.note || `Concept demo, nothing was sent. The clinic would get this email:\n\nTo: ${j.preview.to}\nSubject: ${j.preview.subject}\n\n${j.preview.text}`;
          if (j.link) d.appendChild(el(`<a class="btn p" href="${esc(j.link.href)}">${esc(j.link.label)}</a>`));
          msgs.appendChild(d);
          msgs.scrollTop = msgs.scrollHeight;
        }
      } catch (ex) {
        err.textContent = ex.message;
        f.querySelector("button[type=submit]").disabled = false;
      }
    };
    msgs.appendChild(f);
    msgs.scrollTop = msgs.scrollHeight;
    f.querySelector("input").focus();
  }

  function suggestions() {
    chips.innerHTML = "";
    if (state.history.some((m) => m.role === "user")) return;
    (cfg.suggestions || []).forEach((s) => {
      const b = el(`<button type="button"></button>`);
      b.textContent = s;
      b.onclick = () => send(s);
      chips.appendChild(b);
    });
  }

  function redraw() {
    msgs.innerHTML = "";
    bubble(cfg.greeting, "bot");
    state.history.forEach((m, i) => {
      bubble(m.content, m.role === "user" ? "me" : "bot");
      if (m.role === "assistant" && i === state.history.length - 1 && m.turn) actions(m.turn);
    });
    suggestions();
  }

  async function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    input.value = ""; input.style.height = "auto";
    chips.innerHTML = "";
    msgs.querySelectorAll(".acts").forEach((a) => a.remove());
    bubble(text, "me");
    state.history.push({ role: "user", content: text });
    store.set(state);
    const typing = el(`<div class="m bot"><span class="typing" aria-label="Typing"><span></span><span></span><span></span></span></div>`);
    msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
    form.querySelector("button").disabled = true;

    let turn;
    try {
      ({ json: turn } = await call("/api/chat", { clinic: CLINIC, messages: state.history.filter((m) => !m.ui).map(({ role, content }) => ({ role, content })) }));
      if (!turn.reply) throw new Error(turn.error || "No reply");
    } catch {
      turn = { reply: `Sorry, I couldn't connect just now. You can book online any time, or call ${cfg.phone}.`, action: "book_online", booking_url: cfg.booking_url };
    }
    typing.remove();
    bubble(turn.reply, "bot");
    actions(turn);
    state.history.push({ role: "assistant", content: turn.reply, turn: { action: turn.action, booking_url: turn.booking_url, treatment: turn.treatment } });
    store.set(state);
    busy = false;
    form.querySelector("button").disabled = false;
  }

  (SCRIPTED ? Promise.resolve(SCRIPTED.config) : fetch(API + "/api/config?clinic=" + encodeURIComponent(CLINIC)).then((r) => (r.ok ? r.json() : Promise.reject())))
    .then((c) => { cfg = c; build(); })
    .catch(() => {}); // if the assistant is down, the site carries on without it
})();
