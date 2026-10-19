/* Stannard & Lowe follow-ups, concept demo. Three automations played out on the customer's phone,
   with the flow behind each one lighting up as it runs. Made-up firm, made-up customer, nothing sent.
   ?s=quote opens one automation; ?play=1 runs all three back to back for screen recordings. */
(function () {
  const S = {
    missed: {
      title: "Missed call, text back",
      lede: "Steve's on a roof and Martin's in a meeting. The caller gets a text within a minute instead of trying the next builder.",
      steps: [
        { type: "Trigger", title: "Call not answered", detail: "No pick-up in 25 seconds, or out of hours." },
        { type: "Wait", title: "30 seconds", detail: "Long enough to catch a call back from the team first." },
        { type: "Text", title: "Sorry we missed you", detail: "Asks what the job is, so the call back starts informed." },
        { type: "Check", title: "They reply", detail: "The reply is saved to the lead in the tracker." },
        { type: "Text", title: "Offer a call-back time", detail: "Or a link to book a free site visit." },
        { type: "Task", title: "Martin: call at 4.30", detail: "In the tracker, with the whole thread attached." }
      ],
      events: [
        { gap: 600, kind: "sep", text: "Tuesday 14:32", clock: "14:32", day: "Day 0, Tue 14:32" },
        { gap: 500, kind: "system", text: "You called Stannard & Lowe. No answer.", step: 0 },
        { gap: 1300, step: 1, clock: "14:33", day: "Day 0, Tue 14:33" },
        { gap: 1500, kind: "in", step: 2, text: "Hi, it's Stannard & Lowe. Sorry we missed you, we're all on site. Is it about an extension, a loft or a kitchen? Reply here and Martin will call you back today." },
        { gap: 2600, kind: "out", step: 3, clock: "14:36", day: "Day 0, Tue 14:36", text: "Rear extension. We've already got drawings" },
        { gap: 1500, kind: "in", step: 4, text: "Thanks, that helps. Martin can call you between 4 and 6 today, or you can book a free site visit here: stannardlowe.example/visit" },
        { gap: 2400, kind: "out", clock: "14:39", day: "Day 0, Tue 14:39", text: "4.30 works" },
        { gap: 1300, kind: "in", step: 5, text: "Done. Martin will ring you at 4.30." },
        { gap: 600, done: true }
      ]
    },
    quote: {
      title: "Quote follow-up",
      lede: "Most quotes go quiet because nobody follows up, not because the price was wrong. Three texts, then it stops, and it stops the moment they reply.",
      steps: [
        { type: "Trigger", title: "Fixed quote sent", detail: "Emailed after the site visit." },
        { type: "Day 1", title: "Did it arrive?", detail: "Plain check-in, with how to opt out." },
        { type: "Day 3", title: "Answer the usual question", detail: "How long you're on site, and the finish date in the contract." },
        { type: "Day 7", title: "Last one, with an easy out", detail: "No pressure. Reply LATER and it checks back in the spring." },
        { type: "Stop", title: "They reply, it stops", detail: "No more automatic texts. A person takes it from here." },
        { type: "Task", title: "Steve: call Thursday 5.30", detail: "Logged on the lead, reminder set." }
      ],
      events: [
        { gap: 600, kind: "sep", text: "Monday 16:10", clock: "16:10", day: "Day 0, Mon 16:10" },
        { gap: 500, kind: "system", text: "Email: your fixed quote from Stannard & Lowe", step: 0 },
        { gap: 1500, kind: "sep", text: "Tuesday 10:00", clock: "10:00", day: "Day 1, Tue 10:00" },
        { gap: 700, kind: "in", step: 1, notify: true, text: "Hi Claire, it's Jo at Stannard & Lowe. Your fixed quote for the rear extension went over yesterday. Any questions at all, just reply here. (Reply STOP and we won't text again.)" },
        { gap: 2800, kind: "sep", text: "Thursday 10:00", clock: "10:00", day: "Day 3, Thu 10:00, no reply" },
        { gap: 700, kind: "in", step: 2, notify: true, text: "Quick one: the thing most people ask is how long we're on site. Yours is 14 weeks, and the finish date goes in the contract. Want Steve, our site manager, to talk you through the build order?" },
        { gap: 3000, kind: "sep", text: "Monday 10:00", clock: "10:00", day: "Day 7, Mon 10:00, no reply" },
        { gap: 700, kind: "in", step: 3, notify: true, text: "Last message from us on this, promise. If the timing's not right, reply LATER and we'll check in again in the spring." },
        { gap: 2600, kind: "out", step: 4, clock: "19:42", day: "Day 7, Mon 19:42, replied", text: "Sorry, mad few weeks. Can Steve call Thursday after 5?" },
        { gap: 1500, kind: "in", step: 5, text: "Of course. Steve will call you Thursday at 5.30." },
        { gap: 600, done: true }
      ]
    },
    review: {
      title: "Review request",
      lede: "Every customer gets the same ask two days after handover. Anything that's not right goes to Steve to fix. Nobody is filtered out.",
      steps: [
        { type: "Trigger", title: "Handover signed", detail: "Job marked complete in the tracker." },
        { type: "Wait", title: "2 days, 6pm", detail: "Time to live in it, at an hour people read texts." },
        { type: "Text", title: "Ask for a Google review", detail: "Same message to everyone, with a way to flag a problem." },
        { type: "Check", title: "Reply mentions a problem", detail: "A snag goes to Steve as a task the same evening." },
        { type: "Text", title: "Thank you, and the fix", detail: "Steve books the visit himself." },
        { type: "Task", title: "Snag booked, review logged", detail: "12-month check already in the diary." }
      ],
      events: [
        { gap: 600, kind: "sep", text: "Tuesday 15:00", clock: "15:00", day: "Day 0, Tue 15:00" },
        { gap: 500, kind: "system", text: "Handover signed: rear extension, Twyford", step: 0 },
        { gap: 1300, kind: "sep", text: "Thursday 18:00", clock: "18:00", day: "Day 2, Thu 18:00", step: 1 },
        { gap: 900, kind: "in", step: 2, notify: true, text: "Hi Claire, Steve here. Hope you're enjoying the new kitchen. If we did a good job, a Google review helps a small firm like ours more than anything: stannardlowe.example/review. And if anything's not right, reply here and I'll sort it." },
        { gap: 2600, kind: "out", step: 3, clock: "20:15", day: "Day 2, Thu 20:15", text: "Love it! One cupboard door sticks a bit but otherwise perfect. Review done" },
        { gap: 1600, kind: "in", step: 4, text: "Thanks Claire, that means a lot. I'll pop round Saturday about 10 to sort the door. That ok?" },
        { gap: 2000, kind: "out", clock: "20:19", day: "Day 2, Thu 20:19", text: "Perfect, see you then" },
        { gap: 900, step: 5 },
        { gap: 600, done: true }
      ]
    }
  };
  const ORDER = ["missed", "quote", "review"];

  const $ = (s) => document.querySelector(s);
  const thread = $("#thread"), flow = $("#flow"), compose = $("#compose"), banner = $("#banner");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search);
  const PLAY_ALL = params.get("play") === "1";

  let current = ORDER.includes(params.get("s")) ? params.get("s") : "missed";
  let token = 0;
  let paused = false;
  let finished = false;

  async function wait(ms, my) {
    let left = reduce ? Math.min(ms, 300) : ms;
    while (left > 0) {
      if (my !== token) throw new Error("stopped");
      await new Promise((r) => setTimeout(r, 50));
      if (!paused) left -= 50;
    }
    if (my !== token) throw new Error("stopped");
  }

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function scrollThread() { thread.scrollTo({ top: thread.scrollHeight, behavior: reduce ? "auto" : "smooth" }); }

  function drawFlow(s) {
    $("#flow-title").textContent = s.title;
    $("#flow-lede").textContent = s.lede;
    flow.innerHTML = "";
    s.steps.forEach((st, i) => {
      const li = el("li", "step");
      li.dataset.i = i;
      li.innerHTML = `<span class="step__type"></span><span class="step__body"><b></b><span></span></span><span class="step__state" aria-hidden="true"></span>`;
      li.querySelector(".step__type").textContent = st.type;
      li.querySelector("b").textContent = st.title;
      li.querySelector(".step__body span").textContent = st.detail;
      flow.appendChild(li);
    });
  }
  function setStep(i) {
    const s = S[current];
    flow.querySelectorAll(".step").forEach((li) => {
      const n = +li.dataset.i;
      li.classList.toggle("is-done", n < i);
      li.classList.toggle("is-active", n === i);
    });
    $("#now-step").innerHTML = `<span>Step ${i + 1} of ${s.steps.length}</span> ${s.steps[i].type}: ${s.steps[i].title}`;
  }
  function allDone() {
    flow.querySelectorAll(".step").forEach((li) => { li.classList.add("is-done"); li.classList.remove("is-active"); });
    $("#now-step").innerHTML = `<span>Done</span> Nobody had to remember to do any of it.`;
  }

  async function typeOut(text, my) {
    compose.classList.add("is-typing");
    compose.textContent = "";
    for (const ch of text) { compose.textContent += ch; await wait(reduce ? 0 : 38 + Math.random() * 30, my); }
    await wait(350, my);
    compose.textContent = "Text message";
    compose.classList.remove("is-typing");
  }
  async function notify(text, my) {
    banner.querySelector("span").textContent = text;
    banner.classList.add("is-on");
    await wait(1700, my);
    banner.classList.remove("is-on");
    await wait(250, my);
  }

  async function run(key, my) {
    current = key;
    const s = S[key];
    document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s === key)));
    thread.innerHTML = "";
    drawFlow(s);
    finished = false;
    $("#playpause").textContent = "Pause";
    for (const ev of s.events) {
      await wait(ev.gap, my);
      if (ev.clock) $("#clock").textContent = ev.clock;
      if (ev.day) $("#sim-day").textContent = ev.day;
      if (ev.step != null && ev.kind !== "out" && ev.kind !== "in") setStep(ev.step);
      if (ev.kind === "sep") { thread.appendChild(el("p", "sep", ev.text)); scrollThread(); }
      if (ev.kind === "system") { thread.appendChild(el("p", "sys", ev.text)); scrollThread(); }
      if (ev.kind === "in") {
        if (ev.notify) await notify(ev.text, my);
        if (ev.step != null) setStep(ev.step);
        const b = el("p", "bub bub--in", ev.text); thread.appendChild(b); scrollThread();
      }
      if (ev.kind === "out") {
        await typeOut(ev.text, my);
        const b = el("p", "bub bub--out", ev.text); thread.appendChild(b); scrollThread();
        if (ev.step != null) setStep(ev.step);
      }
      if (ev.done) allDone();
    }
    finished = true;
    $("#playpause").textContent = "Play again";
  }

  async function start(key) {
    const my = ++token;
    paused = false;
    try {
      if (PLAY_ALL) {
        for (let i = ORDER.indexOf(key); i < ORDER.length; i++) { await run(ORDER[i], my); await wait(2600, my); }
      } else await run(key, my);
    } catch (e) { /* stopped by a tab switch or restart */ }
  }

  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) start(b.dataset.s); });
  $("#restart").addEventListener("click", () => start(current));
  $("#playpause").addEventListener("click", () => {
    if (finished) return start(current);
    paused = !paused;
    $("#playpause").textContent = paused ? "Play" : "Pause";
  });

  drawFlow(S[current]);
  start(current);
})();
