/* Patch chat demo page: the "Ask the assistant" buttons, and ?play=1, a hands-free run for screen recordings. */
(function () {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = () => document.querySelector("[data-forvr-assistant]")?.shadowRoot;
  async function ready() {
    for (let i = 0; i < 100; i++) { const r = root(); if (r && r.querySelector("textarea")) return r; await wait(50); }
    throw new Error("assistant did not load");
  }
  function openPanel(r) { const p = r.querySelector(".panel"); if (p.hidden) r.querySelector(".launch").click(); }
  async function settled(r, before) {
    // wait for the typing dots to go and a new reply to land
    for (let i = 0; i < 200; i++) {
      await wait(60);
      if (!r.querySelector(".typing") && r.querySelectorAll(".m.bot").length > before) return;
    }
  }
  async function typeInto(input, text, speed = 42) {
    input.focus({ preventScroll: true });
    for (const ch of text) {
      input.value += ch;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await wait(speed + Math.random() * 30);
    }
  }
  async function ask(text, { typed = false } = {}) {
    const r = await ready();
    openPanel(r);
    await wait(250);
    const input = r.querySelector("textarea");
    const before = r.querySelectorAll(".m.bot").length;
    if (typed) { await typeInto(input, text); await wait(350); } else input.value = text;
    r.querySelector("form.in").requestSubmit();
    await settled(r, before);
  }

  document.querySelectorAll("[data-ask]").forEach((b) => {
    b.addEventListener("click", () => ask(b.dataset.ask));
  });

  if (new URLSearchParams(location.search).get("play") !== "1") return;

  (async function play() {
    const r = await ready();
    await wait(1200);
    openPanel(r);
    await wait(1400);
    await ask("I've got dark marks from old spots, what helps?", { typed: true });
    await wait(3400);
    await ask("Is it ok on darker skin?", { typed: true });
    await wait(3200);
    await ask("Can someone call me instead?", { typed: true });
    await wait(1600);
    const cb = [...r.querySelectorAll(".acts button")].find((b) => /call me/i.test(b.textContent));
    if (!cb) return;
    cb.click();
    await wait(700);
    const f = r.querySelector("form.cb");
    await typeInto(f.querySelector("[name=name]"), "Sam Carter", 55);
    await wait(250);
    await typeInto(f.querySelector("[name=phone]"), "07700 900123", 45);
    await wait(250);
    await typeInto(f.querySelector("[name=preferred_time]"), "after 6pm", 50);
    await wait(400);
    f.querySelector("[name=consent]").checked = true;
    await wait(600);
    f.requestSubmit();
    await wait(1500);
    const m = r.querySelector(".msgs"); m.scrollTo({ top: m.scrollHeight, behavior: "smooth" });
  })();
})();
