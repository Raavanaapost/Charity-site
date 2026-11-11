// The endorse page (/e/<link>): someone who knows a requested project vouches for it.
// Data comes from /api/endorse/<link>; ?new=1 is added when the person who sent the request lands here.
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const token = (location.pathname.match(/^\/(?:ta\/)?e\/([a-z0-9]+)/i) || [])[1] || new URLSearchParams(location.search).get("t") || "";
  const params = new URLSearchParams(location.search);
  const isNew = params.get("new") === "1";
  // Tamil (SURESH, 10 Nov 2026): /ta/e/<link> is the same page in Tamil. Same design, only the words change.
  const TA = /^\/ta\//.test(location.pathname);
  if (TA) document.documentElement.lang = "ta";
  const pageUrl = location.origin + (TA ? "/ta/e/" : "/e/") + token;
  const STATIC_TA = {
    loading: "திட்டத்தை ஏற்றுகிறது…",
    missing: "இந்தத் திட்டத்தைக் கண்டுபிடிக்க முடியவில்லை",
    previewbar: "ராவணா குழுவுக்கான முன்னோட்டம். நீங்கள் அனுமதித்ததும் பக்கம் இப்படித் தோன்றும்.",
    newh: "உங்கள் கோரிக்கை கிடைத்தது",
    newp: "எங்கள் குழு முதலில் அதைச் சரிபார்க்கும். அனுமதி கிடைத்ததும், இதைப் பற்றித் தெரிந்த 3 பேருடன் இந்தப் பக்கத்தைப் பகிருங்கள், உதாரணமாக பாடசாலை அதிபர், ஆசிரியர் அல்லது கிராம நிலதாரி. ஒவ்வொரு படியையும் இங்கும் \"எனது கணக்கு\" பகுதியிலும் பார்க்கலாம்.",
    pendh: "ராவணா இந்தக் கோரிக்கையைச் சரிபார்க்கிறது",
    pendp: "ஒவ்வொரு கோரிக்கையையும் எங்கள் குழு முதலில் படிக்கும், சில கேள்விகள் கேட்க அழைக்கலாம். அனுமதி கிடைத்ததும் இந்தப் பக்கத்தில் விவரங்கள் தெரியும், மற்றவர்கள் உறுதிப்படுத்த நீங்கள் பகிரலாம். இதைப் பின்தொடர இந்த இணைப்பை வைத்திருங்கள்.",
    ladder: "இந்தத் தேவை இப்போது எங்கே உள்ளது",
    how: "இது உண்மை என்று எப்படித் தெரியும்",
    budget: "செலவு எவ்வளவு",
    budgetnote: "மக்கள் உறுதிப்படுத்தி, ராவணா தன்னார்வலர் ஒருவர் நேரில் பார்க்கும் வரை எந்தப் பணமும் பெறப்படாது. முடிந்தவரை பேருந்து, உணவு, டிக்கெட்டுகளுக்கு நாங்களே நேரடியாகப் பணம் செலுத்துவோம்.",
    people: "உறுதிப்படுத்தியவர்கள்",
    peoplenote: "கேட்டவர் அல்லாத 3 பேர் தேவை. அவர்களில் குறைந்தது ஒருவர் அதிபர், ஆசிரியர், கிராம நிலதாரி, கோவில் அல்லது அமைப்பு போன்ற பொறுப்பில் இருக்க வேண்டும்.",
    share: "உறுதிப்படுத்த மக்களிடம் கேளுங்கள்",
    wa: "WhatsApp-இல் பகிருங்கள்",
    copy: "இணைப்பை நகலெடு",
    form: "இந்தத் திட்டத்தை உறுதிப்படுத்துங்கள்",
    legend: "இந்தத் திட்டம் பற்றி உங்களுக்கு எப்படித் தெரியும்?",
    r1: "எனக்கு இங்கே ஒரு பொறுப்பு உள்ளது", r1s: "அதிபர், ஆசிரியர், கிராம நிலதாரி, கோவில் அல்லது அமைப்பு",
    r2: "கேட்டவரை எனக்குத் தெரியும்", r2s: "குடும்பம், நண்பர் அல்லது சக ஊழியர்",
    r3: "தேவையை நானே பார்த்திருக்கிறேன்", r3s: "நான் அருகில் வசிக்கிறேன் அல்லது சென்று பார்த்திருக்கிறேன்",
    role: "உங்கள் பொறுப்பு", roles: "திட்டத்தில் காட்டப்படும், உதாரணமாக \"பாடசாலை அதிபர்\"",
    hw: "சில வார்த்தைகளில்", hws: "விருப்பம், உதாரணமாக \"ஏற்பாட்டாளரின் நண்பர்\"",
    name: "உங்கள் பெயர்", names: "திட்டத்தில் காட்டப்படும்",
    phone: "உங்கள் கைபேசி எண்", phones: "ஒருபோதும் காட்டப்படாது. சரிபார்க்க ராவணா தன்னார்வலர் ஒருவர் அழைக்கலாம்.",
    agree: "இந்த விவரங்கள் உண்மை என்று நம்புகிறேன். இந்தத் திட்டத்தை உறுதிப்படுத்துபவராக என் பெயரைக் காட்டலாம்.",
    report: "ஏதாவது சரியில்லையா? ராவணாவிடம் சொல்லுங்கள்",
    thx: "உறுதிப்படுத்தியதற்கு நன்றி",
    thxp: "உங்கள் பெயர் இப்போது இந்தத் திட்டத்துக்குப் பின்னால் நிற்கிறது. 3 பேர் உறுதிப்படுத்தியதும், பணம் பெறுவதற்கு முன் ராவணா தன்னார்வலர் ஒருவர் அதைச் சரிபார்ப்பார்.",
    safe: "இணைப்பு உள்ளவர்கள் மட்டுமே இந்தப் பக்கத்தைப் பார்க்க முடியும். குழந்தைகளின் பெயர்களையோ முகங்களையோ நாங்கள் ஒருபோதும் காட்டுவதில்லை.",
  };
  const t = (en, ta) => (TA ? ta : en);
  if (TA) document.querySelectorAll("[data-t]").forEach((el) => { const v = STATIC_TA[el.dataset.t]; if (v) el.textContent = v; });
  if (TA) { const h = document.querySelector("[data-home]"); if (h) h.href = "/ta/overview"; }
  const sw = document.querySelector("[data-lang]");
  if (sw) {
    sw.textContent = TA ? "English" : "தமிழ்"; sw.lang = TA ? "en" : "ta";
    sw.href = (TA ? "/e/" : "/ta/e/") + token + location.search;
  }
  const api = "/api/endorse/" + encodeURIComponent(token.toLowerCase());
  const RELATION = TA ? { role: "", know: "கேட்டவரைத் தெரியும்", seen: "தேவையை நேரில் பார்த்தவர்" } : { role: "", know: "Knows the person who asked", seen: "Has seen the need" };
  const doneKey = "raavanaa-endorsed-" + token;

  function missing(msg) {
    $("[data-loading]").hidden = true;
    $("[data-missing]").hidden = false;
    if (msg) $("[data-missing-msg]").textContent = msg;
  }

  // Team preview from the portal (?preview=1): the profile being edited is passed through this browser's storage, so the
  // team sees the finished page before approving it. Nothing is saved or shared by previewing.
  const isPreview = params.get("preview") === "1";
  function previewProfile() {
    try { return JSON.parse(localStorage.getItem("raav-preview-" + token.toLowerCase()) || "null"); } catch (_) { return null; }
  }

  // The picture: one of our drawings, picked from what the day is (never a photo of the children).
  const ART = [[/kandy|temple of the tooth|perahera|dalada/i, "kandy"], [/beach|sea|ocean|casuarina/i, "beach"], [/bowl/i, "bowling"], [/zoo|animal|dehiwala/i, "zoo"],
    [/arcade|games|play ?zone|fun ?zone/i, "arcade"], [/mum|mother|women/i, "mums"], [/hill|mountain|waterfall|kovil|picnic|park|garden|trip|bus|excursion/i, "hills"]];
  const artFor = (text) => { for (const [re, n] of ART) if (re.test(text)) return "/img/project-" + n + ".svg"; return "/img/hero-initiated.svg"; };

  const ICON = {
    day: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    place: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    kids: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13.5 20a4 4 0 0 1 8 0"/></svg>',
    when: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  };
  const STEP_ICON = ["✓", "🔍", "🤝", "🏠"];

  // Budget lines: "Bus to Kandy and back: Rs 30,000", one per line (or a list from the server).
  function budgetRows(r) {
    let rows = Array.isArray(r.budget_items) ? r.budget_items.filter((x) => x && (x.item || x.amount)) : [];
    if (!rows.length && r.budget) {
      rows = String(r.budget).split(/\n|;/).map((l) => l.trim()).filter(Boolean).map((l) => {
        const m = l.match(/^(.*?)[:\-–]\s*((?:rs\.?|lkr)?\s*[\d,.]+.*)$/i);
        return m ? { item: m[1].trim(), amount: m[2].trim() } : { item: l, amount: "" };
      });
    }
    return rows;
  }

  function render(r) {
    if (isPreview) {
      const p = previewProfile();
      if (p) r = { ...r, ...p, description: p.summary || r.description, kind: p.activity || r.kind, pending: false };
      $("[data-preview-bar]").hidden = false;
    }
    $("[data-loading]").hidden = true;
    $("[data-page]").hidden = false;
    $("[data-new]").hidden = !isNew;
    $("[data-kicker]").textContent = [t("A day of joy", "மகிழ்ச்சியான ஒரு நாள்"), r.place].filter(Boolean).join(" · ");
    $("[data-title]").textContent = r.title;
    const tagline = r.tagline || (r.description || "").split(/(?<=[.!?])\s/)[0] || "";
    $("[data-tagline]").textContent = tagline;
    $("[data-tagline]").hidden = !tagline || r.pending;
    const received = r.received ? new Date(r.received).toLocaleDateString(TA ? "ta-LK" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
    $("[data-byline]").innerHTML = [r.by ? t(`Asked by <b>${esc(r.by)}</b>`, `கேட்டவர்: <b>${esc(r.by)}</b>`) : "", received ? esc(received) : ""].filter(Boolean).join(" · ");
    $("[data-stage]").textContent = r.pending ? t("Being checked", "சரிபார்க்கப்படுகிறது") : r.ladder.verified ? t("Verified", "சரிபார்க்கப்பட்டது") : "Initiated";
    $("[data-stage]").classList.toggle("check", !!r.pending);
    $("[data-art]").src = artFor([r.title, r.kind, r.place, r.description].join(" "));

    const glance = [["day", t("The day", "நாள்"), r.kind], ["place", t("Where", "எங்கே"), r.place], ["kids", t("Children", "குழந்தைகள்"), r.children ? (/child|kid|pupil|student|குழந்தை|மாணவ/i.test(r.children) ? r.children : r.children + t(" children", " குழந்தைகள்")) : ""], ["when", t("When", "எப்போது"), r.when]].filter((g) => g[2]);
    $("[data-glance]").innerHTML = glance.map(([i, l, v]) => `<li><small>${ICON[i]}${esc(l)}</small><b>${esc(v)}</b></li>`).join("");
    $("[data-glance]").hidden = !glance.length || r.pending;

    const paras = String(r.description || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
    $("[data-story]").innerHTML = paras.map((x) => `<p>${esc(x)}</p>`).join("");
    $("[data-story-card]").hidden = !paras.length || r.pending;

    const rows = budgetRows(r);
    const total = r.budget_total || "";
    $("[data-budget]").innerHTML = rows.map((x) => `<li><span>${esc(x.item)}</span><b>${esc(x.amount)}</b></li>`).join("") + (total ? `<li class="total"><span>${t("In all", "மொத்தம்")}</span><b>${esc(total)}</b></li>` : "");
    $("[data-budget-card]").hidden = (!rows.length && !total) || r.pending;

    $("[data-pending]").hidden = !r.pending;
    $("[data-people-card]").hidden = !!r.pending;
    $("[data-share-card]").hidden = !!r.pending;
    document.title = (r.title ? r.title + " · " : "") + t("Vouch for a project", "திட்டத்தை உறுதிப்படுத்துங்கள்") + " · Raavanaa";

    const n = r.endorsements.length, L = r.ladder;
    const step = (done, num, title, text) => `<li class="${done ? "done" : ""}"><i aria-hidden="true">${done ? "✓" : num}</i><div><b>${esc(title)}</b><span>${esc(text)}</span></div></li>`;
    $("[data-ladder]").innerHTML =
      step(true, 1, t("Request sent", "கோரிக்கை அனுப்பப்பட்டது"), r.by ? t(`${r.by} told us about the children and the day.`, `${r.by} குழந்தைகள் பற்றியும் அந்த நாள் பற்றியும் எங்களிடம் சொன்னார்.`) : t("Someone told us about the children and the day.", "ஒருவர் குழந்தைகள் பற்றியும் அந்த நாள் பற்றியும் எங்களிடம் சொன்னார்.")) +
      step(!r.pending, 2, r.pending ? t("Raavanaa is checking it", "ராவணா சரிபார்க்கிறது") : t("Checked and approved by Raavanaa", "ராவணா சரிபார்த்து அனுமதித்தது"), r.pending ? t("The team reads it and may call with a few questions.", "குழு அதைப் படித்து, சில கேள்விகளுடன் அழைக்கலாம்.") : t("The team read it and approved this page for sharing.", "குழு அதைப் படித்து, இந்தப் பக்கத்தைப் பகிர அனுமதித்தது.")) +
      step(L.backed, 3, L.backed ? t("Backed by the community", "சமூகத்தின் ஆதரவு கிடைத்தது") : t("Waiting for people to vouch", "உறுதிப்படுத்துபவர்களுக்காகக் காத்திருக்கிறது"),
        L.backed ? t(`${n} people vouched, including someone in a role.`, `${n} பேர் உறுதிப்படுத்தினர், பொறுப்பில் உள்ள ஒருவர் உட்பட.`)
          : t(`${n} of ${r.needed} so far`, `இதுவரை ${r.needed}-இல் ${n}`) + (n >= r.needed && !L.hasRole ? t(". Still needs someone in a role, like a principal or teacher.", ". இன்னும் அதிபர் அல்லது ஆசிரியர் போன்ற பொறுப்பில் உள்ள ஒருவர் தேவை.") : ".")) +
      step(L.verified, 4, L.verified ? t("Visited by a Raavanaa volunteer", "ராவணா தன்னார்வலர் நேரில் பார்த்தார்") : t("A Raavanaa volunteer visits", "ராவணா தன்னார்வலர் ஒருவர் வருவார்"),
        L.verified ? t("A volunteer called or visited and confirmed it. It can now take gifts.", "தன்னார்வலர் ஒருவர் அழைத்து அல்லது நேரில் வந்து உறுதிப்படுத்தினார். இப்போது இது அன்பளிப்புகளைப் பெறலாம்.") : t("A volunteer near the children calls or visits. Only then can it take any money.", "குழந்தைகளுக்கு அருகில் உள்ள தன்னார்வலர் ஒருவர் அழைப்பார் அல்லது வருவார். அதன் பிறகுதான் பணம் பெற முடியும்."));

    const at = r.pending ? 1 : !L.backed ? 2 : !L.verified ? 3 : 4;
    const steps = TA ? ["கோரிக்கை", "சரிபார்ப்பு", "ஆதரவு", "வருகை"] : ["Requested", "Checked", "Vouched", "Visited"];
    $("[data-journey]").innerHTML = steps.map((t, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}"><i aria-hidden="true">${i < at ? "✓" : STEP_ICON[i]}</i><span>${t}</span></li>`).join("");
    const V = r.visitor;
    $("[data-journey-note]").innerHTML = TA ? (r.pending
      ? "<b>சரிபார்க்கப்படுகிறது.</b> ஒவ்வொரு கோரிக்கையையும் ராவணா குழு முதலில் படிக்கும், சில கேள்விகளுடன் அழைக்கலாம்."
      : !L.backed ? `<b>உறுதிப்படுத்துபவர்களுக்காகக் காத்திருக்கிறது.</b> இதுவரை ${r.needed}-இல் ${n}. இதைப் பற்றித் தெரிந்தவர்கள் தேவை, அவர்களில் குறைந்தது ஒருவர் அதிபர் அல்லது ஆசிரியர் போன்ற பொறுப்பில் இருக்க வேண்டும்.`
      : !L.verified ? `<b>சமூகத்தின் ஆதரவு கிடைத்தது.</b> அடுத்து, ${V ? `${esc(V.district)} மாவட்ட ராவணா சாம்பியன் ${esc(V.name)}` : "குழந்தைகளுக்கு அருகில் உள்ள ராவணா தன்னார்வலர் ஒருவர்"} அழைப்பார் அல்லது வருவார்.`
      : `<b>நேரில் பார்த்து உறுதிப்படுத்தப்பட்டது.</b> ${V ? `${esc(V.district)} மாவட்ட ராவணா சாம்பியன் ${esc(V.name)}` : "ராவணா தன்னார்வலர் ஒருவர்"} இதை உறுதிப்படுத்தியுள்ளார். இப்போது இது அன்பளிப்புகளைப் பெறலாம்.`)
      : r.pending
      ? "<b>Being checked.</b> The Raavanaa team reads every request first, and may call with a few questions."
      : !L.backed ? `<b>Waiting for people to vouch.</b> ${n} of ${r.needed} so far. It needs people who know about it, and at least one in a role, like a principal or teacher.`
      : !L.verified ? (r.visitor ? `<b>Backed by the community.</b> Next, ${esc(r.visitor.name)}, a Raavanaa Champion from ${esc(r.visitor.district)}, calls or visits.` : "<b>Backed by the community.</b> Next, a Raavanaa volunteer near the children calls or visits.")
      : `<b>Visited and verified.</b> ${r.visitor ? esc(r.visitor.name) + ", a Raavanaa Champion from " + esc(r.visitor.district) + "," : "A Raavanaa volunteer"} has confirmed it. It can now take gifts.`;

    $("[data-count]").textContent = t(`${Math.min(n, r.needed)} of ${r.needed}`, `${r.needed}-இல் ${Math.min(n, r.needed)}`);
    $("[data-bars]").innerHTML = Array.from({ length: r.needed }, (_, i) => `<span class="${i < n ? "on" : ""}"></span>`).join("");
    if (r.pending) { $("[data-form-card]").hidden = true; $("[data-thanks]").hidden = true; return; }
    $("[data-people]").innerHTML = n
      ? r.endorsements.map((e) => `<li><span class="dot" aria-hidden="true">${esc((e.name || "?").trim().charAt(0).toUpperCase())}</span><span class="who"><b>${esc(e.name)}</b><small>${esc(e.role || RELATION[e.relation] || "")}</small></span>${e.relation === "role" ? '<span class="tag">' + t("ROLE", "பொறுப்பு") + '</span>' : ""}</li>`).join("")
      : `<li class="note">${t("Nobody has vouched yet. Be the first.", "இதுவரை யாரும் உறுதிப்படுத்தவில்லை. முதலாவதாக இருங்கள்.")}</li>`;

    const text = TA ? `இதை உறுதிப்படுத்த முடியுமா? "${r.title}"${r.place ? " (" + r.place + ")" : ""}. குழந்தைகளுக்கு மகிழ்ச்சியான ஒரு நாளை வழங்க ராவணா உதவுகிறது. இது உண்மை என்று சொல்ல இதைப் பற்றித் தெரிந்தவர்கள் தேவை: ${pageUrl}` : `Can you vouch for this? "${r.title}"${r.place ? " in " + r.place : ""}. Raavanaa helps give children a day of joy, and needs people who know about it to say it's real: ${pageUrl}`;
    $("[data-wa]").href = "https://wa.me/?text=" + encodeURIComponent(text);
    $("[data-link]").textContent = pageUrl.replace(/^https?:\/\//, "");

    const already = (() => { try { return localStorage.getItem(doneKey) === "1"; } catch (_) { return false; } })();
    const closed = r.closed || L.verified || r.pending || isPreview;
    $("[data-form-card]").hidden = isNew || already || closed;
    $("[data-thanks]").hidden = !already;
  }

  async function load() {
    if (!token) return missing();
    try {
      const res = await fetch(api, { headers: { Accept: "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return missing(TA ? "இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்." : data.error);
      render(data.request);
    } catch (_) { missing(t("We couldn't load this page. Check your connection and try again.", "இந்தப் பக்கத்தை ஏற்ற முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.")); }
  }

  // Role field or "in a few words", depending on how they know about it.
  const form = $("[data-form]");
  const syncRelation = () => {
    const rel = (form.querySelector("input[name=relation]:checked") || {}).value;
    $("[data-role-field]").hidden = rel !== "role";
    $("[data-how-field]").hidden = rel === "role";
  };
  form.querySelectorAll("input[name=relation]").forEach((i) => i.addEventListener("change", syncRelation));
  syncRelation();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-err]"), btn = form.querySelector("button[type=submit]");
    const fd = new FormData(form), data = Object.fromEntries(fd.entries());
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    if (!String(data.name || "").trim()) return fail(t("Please add your name.", "உங்கள் பெயரைச் சேர்க்கவும்."));
    if (data.relation === "role" && !String(data.role || "").trim()) return fail(t("Please add your role, for example Principal of the school.", "உங்கள் பொறுப்பைச் சேர்க்கவும், உதாரணமாக பாடசாலை அதிபர்."));
    if (String(data.phone || "").replace(/\D/g, "").length < 9) return fail(t("Please add a mobile number we can call.", "நாங்கள் அழைக்கக்கூடிய கைபேசி எண்ணைச் சேர்க்கவும்."));
    if (!fd.get("agree")) return fail(t("Please tick the box to confirm.", "உறுதிப்படுத்த பெட்டியில் டிக் செய்யவும்."));
    btn.disabled = true;
    try {
      const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) { btn.disabled = false; return fail(out.error || t("That didn't go through. Please try again.", "அது சேரவில்லை. மீண்டும் முயற்சிக்கவும்.")); }
      try { localStorage.setItem(doneKey, "1"); } catch (_) { /* private mode */ }
      render(out.request);
      $("[data-thanks]").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (_) { btn.disabled = false; fail(t("That didn't go through. Check your connection and try again.", "அது சேரவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.")); }
  });

  $("[data-copy]").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(pageUrl); b.textContent = t("Link copied", "இணைப்பு நகலெடுக்கப்பட்டது"); }
    catch (_) { b.textContent = pageUrl; }
  });

  load();
})();
