/* Scripted brain for the Patch concept demo. No network, no model: each reply is written by hand
   from clinics/patch/knowledge.md in ~/Code/03_Websites/clinic-assistant, and follows the same hard
   rules as the live assistant (no medical advice, no prescription medicines named, under 18s turned
   away, problems after treatment sent to the phone, never guesses). Patch is fictional. */
(function () {
  const BOOK = "/demo/patch/b/book";
  const PHONE = "01632 960518";

  const config = {
    id: "patch",
    name: "Patch",
    concept: true,
    phone: PHONE,
    phone_href: "tel:+441632960518",
    privacy_url: "",
    booking_url: BOOK,
    theme: { accent: "#4F5A3C", ink: "#18241A", surface: "#FBFBF8", muted: "#E6E8DA", font: "'Rethink Sans', system-ui, -apple-system, sans-serif" },
    greeting: "Hi, I'm the Patch assistant. I'm automated, not a person. Tell me what's bothering you about your skin and I'll tell you what usually helps, what it costs and how to book.",
    suggestions: ["What helps dark marks?", "How much is a skin assessment?", "Are you open in the evening?"]
  };

  const t = (reply, action = "none", treatment = "") => ({ reply, action, treatment, booking_url: BOOK });

  // First match wins, so the safety rules sit at the top.
  const RULES = [
    [(q) => /can'?t breathe|struggling to breathe|vision|allergic reaction|anaphyla/.test(q) ||
      (/swell|swollen|blister|infect|pus|bleed|hurt|pain|burn|itch|rash|red|sore/.test(q) && /(after|since|from) (my|the|a|your|last)? ?(peel|treatment|microneedl|session|facial|appointment|visit|yesterday|week)/.test(q)),
      () => t(`Please call us now on ${PHONE} so a nurse can help. If we're closed, call NHS 111, or 999 if it's an emergency like trouble breathing or a change in your vision. I can't assess this in a chat.`)],
    [/\b(i'?m|i am|she'?s|he'?s|my (daughter|son) is|aged?)\s*(1[0-7]|twelve|thirteen|fourteen|fifteen|sixteen|seventeen)\b|under ?18|under eighteen/,
      () => t("Thanks for asking. We only treat adults aged 18 and over, for every treatment, even with a parent's consent. A GP or pharmacist is a good first stop for skin under 18.")],
    [/botox|botul|toxin|anti.?wrinkle|wrinkle.?relax|tretinoin|retin.?a|roaccutane|isotretinoin|accutane|hydroquinone|ozempic|wegovy|mounjaro|injections? for/,
      () => t("Some treatments are prescription-only, so I can't talk about them here. A Patch nurse can go through every option with you at a skin assessment, which is £30 and comes off your first treatment. Want to book one?", "book_online", "skin-assessment")],
    [/complain|not happy|unhappy|disappointed|refund|went wrong|made it worse/,
      () => t("I'm sorry you've had a bad experience. The best person is Ama Mensah, our clinical lead, and every complaint gets a reply within two working days. I can ask the team to call you.", "handoff")],
    [/\b(real|human|person|bot|robot|ai|automated)\b/,
      () => t("I'm an automated assistant, not a person. If you'd rather talk to one of the nurses, I can ask the team to call you.", "callback")],
    [/pregnan|breastfeed|medication|medicine|tablets|eczema|psoriasis|allerg|is it safe|suitable for me|should i (get|have)/,
      () => t("That's one for a nurse, not me, because it depends on you. They'll go through it properly at your skin assessment, or I can ask the team to call you first.", "callback")],
    [/hurt|painful|pain|feel like|sting|downtime|time off|back to work/,
      () => t("A peel is a warm tingle for a few minutes, with light flaking for a few days. Microneedling starts with a numbing cream, then feels like light scratching, with redness like mild sunburn for a day or two. Most people go straight back to work.")],
    [/filler|lips?\b|jaw|cheek filler|laser hair|hair removal|tattoo/,
      () => t("We don't do that one. Patch is a skin clinic: breakouts, dark marks, texture, redness, early lines and dull skin. If one of those is bothering you, I can tell you what usually helps.")],
    [/dark (mark|spot|patch)|pigment|melasma|sun ?spot|marks? (left|after)|hyperpig|uneven/,
      () => t("Dark marks usually fade with brightening peels and a pigment plan, plus daily sunscreen. Peels are £85 each or £300 for four, and most people see a change by week eight. We never use a harsh laser on darker skin. Ama leads on this.", "book_online", "dark-marks")],
    [/breakout|spot|acne|pimple|blemish|clog/,
      () => t("For spots that keep coming back, it's usually peels and a medical skincare plan, with LED if they're inflamed. Peels are from £85 each, or £230 for three, and most people see a clear change by week six. Tom leads on breakouts.", "book_online", "breakouts")],
    [/scar|texture|pore|bumpy|rough|microneedl/,
      () => t("Bumpy skin, open pores and old scars usually respond to microneedling, three to six sessions from £180 each, over about 12 weeks. Tom leads on scarring.", "book_online", "texture")],
    [/\bred(ness)?\b|rosacea|flush|blush/,
      () => t("Redness usually calms with light treatment and the right skincare, from £150 a session over 4 to 8 weeks. Light treatment isn't used on skin types V and VI, so the nurse suggests other options there. Priya leads on redness.", "book_online", "redness")],
    [/\blines?\b|wrinkle|ageing|aging|tired|crow'?s? feet|forehead/,
      () => t("For the first lines and tired-looking skin, we usually start with skin boosters and a skincare plan. Skin boosters are from £220 a session. Anything prescription-only is talked through at the assessment, not here.", "book_online", "early-lines")],
    [/dull|dry|dehydrat|glow|flat|facial/,
      () => t("Dull or dry skin usually just needs a deep cleanse facial and the right routine. That's from £75, and you'd notice a change in about two weeks.", "book_online", "dull-skin")],
    [/dark(er)? skin|skin of colou?r|black skin|brown skin|type (iv|v|vi|4|5|6)|fitzpatrick/,
      () => t("Yes. Priya leads on skin of colour, we patch test first, and we never use a harsh laser on darker skin. Results on our site are sorted by skin type, so you can see results on skin like yours.", "book_online", "skin-assessment")],
    [/assessment|consult|appointment|book|first visit|how does it work/,
      () => t("A skin assessment is £30 and takes 30 minutes with a nurse. Your skin is read under a lamp, photos are taken, and you leave with a written plan and prices. The £30 comes off your first treatment.", "book_online", "skin-assessment")],
    [/price|cost|how much|£|expensive|cheap|afford/,
      () => t("Most treatments start from £75 to £220 a session, depending on the concern. Every plan starts with a £30 skin assessment, which comes off your first treatment. Tell me what's bothering you and I'll give you the right price.", "book_online", "skin-assessment")],
    [/\bopen\b|hours|evening|late|weekend|saturday|sunday|tonight|after work/,
      () => t("We're open Monday to Friday 10am to 8pm, so evening appointments every weekday, and Saturday 9am to 5pm. We're closed on Sundays and bank holidays. You can book online any time.", "book_online", "skin-assessment")],
    [/where|address|located|location|park|station|train|bus|directions/,
      () => t("We're at Kennet Yard, Reading RG1, five minutes' walk from the station. There's no parking at the clinic, but there are pay and display car parks nearby.")],
    [/who|nurse|qualified|doctor|staff|team/,
      () => t("Three registered nurses: Ama Mensah, our clinical lead and a nurse prescriber, Tom Hartley for breakouts and scarring, and Priya Lal for skin of colour and redness. Their NMC numbers are on the team page.")],
    [/cancel|resched|move my/,
      () => t("Cancelling is free up to 24 hours before. Inside 24 hours, the £30 assessment fee is kept. You can move a booking from your confirmation email, or the team can do it.", "callback")],
    [/call me|ring me|phone me|call back|callback|speak to someone|talk to someone/,
      () => t("Of course. Leave your name and number and the team will call you during opening hours.", "callback")],
    [/^(hi|hello|hey|hiya|morning|evening|afternoon)\b/,
      () => t("Hi. What's bothering you about your skin? Spots, dark marks, redness, texture, early lines or dullness are the usual ones.")],
    [/thank|cheers|great|perfect|lovely/,
      () => t("You're welcome. If you want to go ahead, you can book a skin assessment any time.", "book_online", "skin-assessment")]
  ];

  function reply(messages) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    const q = (last ? last.content : "").toLowerCase();
    for (const [test, fn] of RULES) if (typeof test === "function" ? test(q) : test.test(q)) return fn();
    return t("I don't have that one in my notes, so I won't guess. The team can answer it: I can ask them to call you, or you can ring " + PHONE + ".", "handoff");
  }

  function lead(body) {
    const first = (body.name || "").trim().split(" ")[0] || "there";
    // Hand the made-up lead to the tracker demo in this tab only (sessionStorage, never a URL).
    try {
      sessionStorage.setItem("forvr-demo:patch-lead", JSON.stringify({ name: body.name, phone: body.phone, when: body.preferred_time, treatment: body.treatment, at: Date.now() }));
    } catch {}
    return {
      demo: true,
      note: `Concept demo, nothing was sent. In a live build, ${first}'s request lands in Patch's lead tracker as a new lead from chat, with the conversation attached, and the team gets a call-back task.`,
      link: { href: "/demo/patch-leads", label: "See it in the lead tracker" }
    };
  }

  window.FORVR_ASSISTANT_SCRIPTED = { config, reply, lead };
})();
