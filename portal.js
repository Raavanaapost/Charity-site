/* Raavanaa Team Portal: DESIGN PREVIEW.
   Screens: Dashboard and Suggestions inbox (more to come). Uses the real projects.json for the stage numbers
   and portal-demo.json for invented suggestions. Changes live in memory only; a reload resets everything. */
(function () {
  "use strict";
  const app = document.getElementById("pt-app");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  const money = n => "$" + Math.round(n).toLocaleString("en-US");
  const NOW = new Date("2026-10-09T09:00"); // fixed "today" so the demo always reads the same
  const ago = iso => {
    const d = new Date(iso), days = Math.floor((NOW - d) / 864e5);
    if (days <= 0) return "Today"; if (days === 1) return "Yesterday"; if (days < 7) return days + " days ago";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const fmtDay = iso => new Date(/T/.test(iso) ? iso : iso + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const initials = n => String(n).trim().split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // Same stage rules as the public site.
  const budget = p => {
    const goal = num(p.goal) || (p.budget || []).filter(x => x && x.item).reduce((s, x) => s + num(x.amount), 0);
    const raised = (p.funders || []).filter(x => x && x.name).reduce((s, x) => s + num(x.amount), 0);
    return { goal, raised };
  };
  const stageNum = p => {
    if (/complete/i.test(p.status || "")) return 3;
    const b = budget(p); return p.verified && b.goal > 0 && b.raised >= b.goal ? 2 : 1;
  };

  const STATUS = {
    new: { label: "New", c: "s-new" },
    visit: { label: "Visit planned", c: "s-visit" },
    verified: { label: "Verified", c: "s-verified" },
    declined: { label: "Not suitable", c: "s-declined" },
    project: { label: "Became a project", c: "s-project" }
  };
  const ICON = {
    dashboard: '<path d="M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-5H4zM13 4v5h7V4z"/>',
    suggestions: '<path d="M4 6.5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H10l-4 3v-3H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/><path d="M7 10.5h8M7 13.5h5"/>',
    projects: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sponsors: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.2c0 5.6-7.5 10.2-7.5 10.2z"/>',
    day: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    close: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.8-6 6-6s5.5 2 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14c2.7 0 4.4 1.7 5 5"/>',
    team: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    reports: '<path d="M12 3l8 3v6c0 4.6-3.3 8-8 9-4.7-1-8-4.4-8-9V6z"/><path d="M12 8v5M12 16h.01" stroke-width="2.2"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  const svg = (d, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const MENU = [
    ["dashboard", "Dashboard", true], ["suggestions", "Suggestions", true], ["projects", "Projects", true], ["reports", "Reports & feedback", true],
    ["sponsors", "Sponsors & pledges", true], ["day", "Day preparation", false], ["close", "Close the day", false],
    ["people", "People", false], ["team", "Team & logins", false]
  ];

  let D = null, P = [];
  const toast = msg => { const t = document.getElementById("pt-toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600); };
  const route = () => (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");

  function drawNav(cur) {
    const newCount = D.suggestions.filter(s => s.status === "new").length, openRep = D.reports.filter(r => r.status !== "closed").length;
    document.getElementById("pt-nav").innerHTML = MENU.map(([k, l, ready]) => ready
      ? `<a href="#/${k}" class="${cur === k ? "on" : ""}" ${cur === k ? 'aria-current="page"' : ""}>${svg(ICON[k])}<span>${l}</span>${k === "suggestions" && newCount ? `<b class="pt-badge">${newCount}</b>` : k === "reports" && openRep ? `<b class="pt-badge">${openRep}</b>` : ""}</a>`
      : `<span class="soon" title="Designed next">${svg(ICON[k])}<span>${l}</span><small>Next</small></span>`).join("");
    document.getElementById("pt-tabbar").innerHTML = [["dashboard", "Home"], ["suggestions", "Suggestions"], ["projects", "Projects"], ["reports", "Reports"], ["more", "More"]].map(([k, l]) => {
      const ready = k !== "more";
      return ready ? `<a href="#/${k}" class="${cur === k ? "on" : ""}">${svg(ICON[k], 22)}<span>${l}</span>${k === "suggestions" && newCount ? `<b class="pt-badge">${newCount}</b>` : k === "reports" && openRep ? `<b class="pt-badge">${openRep}</b>` : ""}</a>`
        : `<button type="button" class="soon" data-soon>${svg(ICON[k], 22)}<span>${l}</span></button>`;
    }).join("");
    document.querySelectorAll("[data-soon]").forEach(b => b.onclick = () => toast("This screen is designed next."));
  }

  // ---------- Dashboard ----------
  function dashboard() {
    const st = [1, 2, 3].map(n => P.filter(p => stageNum(p) === n));
    const sNew = D.suggestions.filter(s => s.status === "new"), sVisit = D.suggestions.filter(s => s.status === "visit");
    const attention = [];
    D.reports.filter(r => r.status !== "closed").forEach(r => attention.push({ c: "a-report", t: `${r.type === "concern" ? LEVEL[r.level].label : "Feedback needs a look"} · ${r.status === "open" ? "not yet picked up" : "being looked into"}`, s: r.type === "concern" ? `Report: ${r.about}` : "Visit feedback", href: `#/reports/${r.id}` }));
    D.pledges.filter(x => x.status === "pledged").forEach(x => attention.push({ c: "a-fund", t: `Pledge of ${money(x.amount)} · waiting to receive`, s: x.name + " → " + projOf(x.project).title, href: "#/sponsors" }));
    sNew.filter(s => !s.assigned).forEach(s => attention.push({ c: "a-new", t: `New · waiting for someone to take it`, s: s.title, href: `#/suggestions/${s.id}` }));
    sVisit.forEach(s => attention.push({ c: "a-visit", t: `Visit on ${fmtDay(s.visit)} · ${esc(s.assigned)}`, s: s.title, href: `#/suggestions/${s.id}` }));
    P.forEach(p => {
      const n = stageNum(p), b = budget(p);
      if (n === 1 && !p.verified) attention.push({ c: "a-init", t: "Initiated · not visited and verified yet", s: p.title });
      if (n === 1 && b.goal && b.raised < b.goal) attention.push({ c: "a-fund", t: `Initiated · ${money(b.goal - b.raised)} still needed`, s: p.title });
      if (n === 2 && !p.volunteers) attention.push({ c: "a-day", t: "Activated · volunteers not ready", s: p.title });
      if (n === 2 && !p.date_set) attention.push({ c: "a-day", t: "Activated · date not confirmed", s: p.title });
    });
    const funding = st[0].reduce((a, p) => { const b = budget(p); a.goal += b.goal; a.raised += b.raised; return a; }, { goal: 0, raised: 0 });
    const pct = funding.goal ? Math.round(funding.raised / funding.goal * 100) : 0;
    return `
      <header class="pt-head"><div><p class="pt-kicker">Dashboard</p><h1>Hello, ${esc(D.user.name)}</h1></div>
        <a class="pt-btn ghost" href="#/suggestions">Open suggestions</a></header>
      <section class="pt-stats">
        <a class="pt-stat s1" href="#/suggestions"><b>${sNew.length}</b><span>New suggestions</span></a>
        <div class="pt-stat st1"><b>${st[0].length}</b><span>Initiated</span></div>
        <div class="pt-stat st2"><b>${st[1].length}</b><span>Activated</span></div>
        <div class="pt-stat st3"><b>${st[2].length}</b><span>Impact</span></div>
      </section>
      <div class="pt-grid">
        <section class="pt-card">
          <h2>Needs attention <span class="pt-count">${attention.length}</span></h2>
          <ul class="pt-attn">${attention.map(a => `<li class="${a.c}">${a.href ? `<a href="${a.href}">` : "<div>"}<i></i><span><b>${esc(a.s)}</b><small>${a.t}</small></span>${a.href ? "<em>›</em></a>" : "</div>"}</li>`).join("") || `<li class="pt-empty">All clear.</li>`}</ul>
        </section>
        <section class="pt-card">
          <h2>Funding still needed</h2>
          <p class="pt-big"><b>${money(funding.goal - funding.raised)}</b> <span>across ${st[0].length} initiated projects</span></p>
          <div class="pt-bar"><i style="width:${pct}%"></i></div>
          <p class="pt-sub">${money(funding.raised)} pledged of ${money(funding.goal)} · ${pct}%</p>
          <ul class="pt-mini">${st[0].map(p => { const b = budget(p), q = b.goal ? Math.round(b.raised / b.goal * 100) : 0; return `<li><span>${esc(p.title)}</span><b>${b.goal ? q + "%" : "No budget"}</b></li>`; }).join("")}</ul>
        </section>
        <section class="pt-card">
          <h2>Newest suggestions</h2>
          <ul class="pt-list">${D.suggestions.slice(0, 3).map(rowHTML).join("")}</ul>
          <a class="pt-more" href="#/suggestions">See all suggestions →</a>
        </section>
        <section class="pt-card">
          <h2>Recent activity</h2>
          <ul class="pt-feed">${D.activity.map(a => `<li><time>${ago(a.at)}</time><span>${esc(a.text)}</span></li>`).join("")}</ul>
        </section>
      </div>`;
  }

  // ---------- Suggestions ----------
  const rowHTML = s => `<li><a class="pt-row" href="#/suggestions/${s.id}">
      <span class="pt-row-main"><b>${esc(s.title)}</b><small>${esc(s.category)} · ${esc(s.location.split(",")[0])} · ${esc(s.children)} children</small></span>
      <span class="pt-row-side"><span class="pt-pill ${STATUS[s.status].c}">${STATUS[s.status].label}</span><time>${ago(s.received)}</time></span></a></li>`;
  let filter = "new", query = "";
  function suggestions() {
    const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, D.suggestions.filter(s => s.status === k).length]));
    const tabs = [["new", "New"], ["visit", "Visit planned"], ["verified", "Verified"], ["declined", "Not suitable"], ["all", "All"]];
    const list = D.suggestions.filter(s => (filter === "all" || s.status === filter) && (!query || (s.title + " " + s.location + " " + s.category).toLowerCase().includes(query)));
    return `
      <header class="pt-head"><div><p class="pt-kicker">Suggestions</p><h1>Suggestions inbox</h1>
        <p class="pt-sub">Everything sent through the Initiate form on the website.</p></div></header>
      <div class="pt-tools">
        <div class="pt-chips" role="group" aria-label="Show suggestions">${tabs.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${l}${k !== "all" ? ` <b>${counts[k]}</b>` : ""}</button>`).join("")}</div>
        <input class="pt-search" type="search" placeholder="Search title, place or category" value="${esc(query)}" aria-label="Search suggestions">
      </div>
      <ul class="pt-list big">${list.map(rowHTML).join("") || `<li class="pt-empty">Nothing here.</li>`}</ul>`;
  }
  function wireSuggestions() {
    app.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });
    const q = app.querySelector(".pt-search");
    q.oninput = () => { query = q.value.trim().toLowerCase(); const pos = q.selectionStart; render(); const n = app.querySelector(".pt-search"); n.focus(); n.setSelectionRange(pos, pos); };
  }

  function detail(id) {
    const s = D.suggestions.find(x => x.id === id);
    if (!s) return `<p>Not found. <a href="#/suggestions">Back to suggestions</a></p>`;
    const field = (l, v) => v ? `<div><dt>${l}</dt><dd>${v}</dd></div>` : "";
    const step = (k, l) => { const order = ["new", "visit", "verified", "project"], i = order.indexOf(s.status), j = order.indexOf(k); return `<li class="${s.status === "declined" ? "" : j < i ? "done" : j === i ? "now" : ""}"><i></i><span>${l}</span></li>`; };
    return `
      <a class="pt-back" href="#/suggestions">‹ All suggestions</a>
      <header class="pt-head"><div><p class="pt-kicker">Suggestion ${esc(s.id)} · received ${ago(s.received)}</p><h1>${esc(s.title)}</h1>
        <p><span class="pt-pill ${STATUS[s.status].c}">${STATUS[s.status].label}</span>${s.status === "visit" && s.visit ? ` <span class="pt-sub">Visit on ${fmtDay(s.visit)}</span>` : ""}</p></div></header>
      ${s.status === "declined" ? "" : `<ol class="pt-steps">${step("new", "Received")}${step("visit", "Visit")}${step("verified", "Verified")}${step("project", "Project")}</ol>`}
      <div class="pt-detail">
        <section class="pt-card">
          <h2>What they sent</h2>
          <p class="pt-desc">${esc(s.description)}</p>
          <dl class="pt-facts">
            ${field("Category", esc(s.category))}
            ${field("Focus", esc((s.focus || []).join(", ")))}
            ${field("Location", esc(s.location))}
            ${field("Children", esc(s.children))}
            ${field("Contact", esc(s.contact))}
            ${field("Email or phone", `<a href="${/@/.test(s.reach) ? "mailto:" : "tel:"}${esc(s.reach.replace(/\s/g, ""))}">${esc(s.reach)}</a>`)}
            ${field("More", esc(s.additional))}
          </dl>
        </section>
        <div class="pt-col">
          <section class="pt-card">
            <h2>Next step</h2>
            <label class="pt-field">Looked after by
              <select data-assign><option value="">Nobody yet</option>${D.team.map(t => `<option ${s.assigned === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
            <div class="pt-actions">${actionsHTML(s)}</div>
          </section>
          ${visitFeedbackHTML(s)}
          <section class="pt-card">
            <h2>Team notes <span class="pt-count">${s.notes.length}</span></h2>
            <ul class="pt-notes">${s.notes.map(n => `<li><span class="pt-av">${esc(initials(n.by))}</span><div><b>${esc(n.by)}</b> <time>${ago(n.at)}</time><p>${esc(n.text)}</p></div></li>`).join("") || `<li class="pt-empty">No notes yet.</li>`}</ul>
            <form class="pt-note-form"><textarea rows="2" placeholder="Add a note for the team" aria-label="Add a note"></textarea><button class="pt-btn" type="submit">Add note</button></form>
          </section>
        </div>
      </div>`;
  }
  function actionsHTML(s) {
    const b = (act, label, cls = "") => `<button type="button" class="pt-btn ${cls}" data-act="${act}">${label}</button>`;
    if (s.status === "new") return `<div class="pt-visit"><label class="pt-field">Visit date<input type="date" data-visit value="2026-10-20"></label>${b("visit", "Plan a visit")}</div>${b("declined", "Not suitable", "ghost danger")}`;
    if (s.status === "visit") { const ok = onboardDone(s); return `${onboardHTML(s)}<button type="button" class="pt-btn" data-act="verified" ${ok ? "" : "disabled"}>Visited · the need is real</button>${ok ? "" : `<p class="pt-sub">Finish the visit checklist first.</p>`}${b("declined", "Not suitable", "ghost danger")}`; }
    if (s.status === "verified") return `${b("project", "Turn into a project")}<p class="pt-sub">Creates an Initiated project with these details. You add the picture, story and estimated costs next.</p>${b("declined", "Not suitable", "ghost danger")}`;
    if (s.status === "project") return `<p class="pt-sub">This suggestion is now an Initiated project. The project editor is designed next.</p>`;
    return `<p class="pt-sub">Marked not suitable. A kind reply is sent to the person who suggested it.</p>${b("new", "Reopen", "ghost")}`;
  }
  // Visit checklist: before a suggestion can be verified, the visitor must show the requester how everything works
  // and the requester sends a practice feedback message. If they do not use a phone, a trusted contact
  // (family member or someone close) is connected with us instead.
  const OB = [
    ["explained", "Explained the three stages: Initiated, Activated, Impact"],
    ["showed", "Showed how to give feedback and report a concern"],
    ["safety", "Explained: we never ask for money, gifts or favours"]
  ];
  const ob = s => s.onboard || (s.onboard = { contact: "self" });
  const onboardDone = s => { const o = ob(s); return OB.every(([k]) => o[k]) && o.test && (o.contact === "self" || (o.trusted && o.trusted.name && o.trusted.phone)); };
  function onboardHTML(s) {
    const o = ob(s), t = o.trusted || {};
    return `<div class="pt-ob">
      <p class="pt-ob-h">Visit checklist <span>${OB.filter(([k]) => o[k]).length + (o.test ? 1 : 0)}/4</span></p>
      ${OB.map(([k, l]) => `<label class="pt-check"><input type="checkbox" data-ob="${k}" ${o[k] ? "checked" : ""}><span>${l}</span></label>`).join("")}
      <div class="pt-ob-who"><span>Who sends feedback for them?</span>
        <label><input type="radio" name="ob-contact" value="self" ${o.contact === "self" ? "checked" : ""}> They use a phone themselves</label>
        <label><input type="radio" name="ob-contact" value="trusted" ${o.contact === "trusted" ? "checked" : ""}> A trusted contact (family or someone close)</label>
        ${o.contact === "trusted" ? `<div class="pt-ob-trusted">
          <input data-tr="name" placeholder="Name" value="${esc(t.name || "")}" aria-label="Trusted contact name">
          <input data-tr="relation" placeholder="Relation (e.g. son, niece)" value="${esc(t.relation || "")}" aria-label="Relation">
          <input data-tr="phone" placeholder="Phone" inputmode="tel" value="${esc(t.phone || "")}" aria-label="Trusted contact phone"></div>` : ""}
      </div>
      <div class="pt-ob-test ${o.test ? "ok" : ""}">${o.test
        ? `<b>✓ Practice message received</b><span>${esc(o.contact === "trusted" && t.name ? t.name : "They")} sent a test through the feedback form, so they know how it works.</span>`
        : `<b>Practice message</b><span>Help them open the practice form on their phone and press Send. It shows here when it arrives.</span>
           <code>/feedback?ref=${esc(s.id)}&amp;practice=1</code><button type="button" class="pt-btn ghost" data-ob-test>Practice message arrived (demo)</button>`}</div>
    </div>`;
  }
  function wireOnboard(s) {
    const o = ob(s);
    app.querySelectorAll("[data-ob]").forEach(c => c.onchange = () => { o[c.dataset.ob] = c.checked; render(); });
    app.querySelectorAll('input[name="ob-contact"]').forEach(r => r.onchange = () => { o.contact = r.value; render(); });
    app.querySelectorAll("[data-tr]").forEach(i => i.onchange = () => { o.trusted = o.trusted || {}; o.trusted[i.dataset.tr] = i.value.trim(); render(); });
    const t = app.querySelector("[data-ob-test]");
    if (t) t.onclick = () => { o.test = true; addNote(s, "Practice feedback message received. They know how to give feedback and report a concern."); render(); toast("Practice message received (demo)"); };
  }
  function wireDetail(id) {
    const s = D.suggestions.find(x => x.id === id); if (!s) return;
    wireOnboard(s);
    const sel = app.querySelector("[data-assign]");
    sel.onchange = () => { s.assigned = sel.value; addNote(s, sel.value ? `${sel.value} is looking after this.` : "Nobody is looking after this now."); render(); toast("Saved (demo)"); };
    app.querySelectorAll("[data-act]").forEach(btn => btn.onclick = () => {
      const act = btn.dataset.act;
      if (act === "visit") { const v = app.querySelector("[data-visit]").value; s.visit = v; addNote(s, `Visit planned for ${fmtDay(v)}.`); }
      if (act === "verified") addNote(s, "Visited. The need is real. A short \"How did we do?\" form was sent to the requester.");
      if (act === "declined") addNote(s, "Marked not suitable.");
      if (act === "project") {
        addNote(s, "Turned into an Initiated project.");
        const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
        if (!P.some(p => p.slug === slug)) P.unshift({ title: s.title, slug, theme: s.category === "Other" ? "Trips & Events" : s.category, status: "Planning",
          location: s.location.split(",")[0], city: s.location.split(",")[0], reach: s.children ? `About ${s.children} children` : "", organization: "Raavanaa",
          started: "October 2026", verified: true, budget: [], goal: 0, funders: [], steps: [], expectations: [], updates: [], photos: [], media: [],
          summary: s.description, story: `## Summary\n\n${s.description}`, cover: "", fromSuggestion: s.id, isNew: true });
        s.status = act; s.project = slug; location.hash = `#/projects/${slug}`; toast("Project created (demo)"); return;
      }
      if (act === "new") addNote(s, "Reopened.");
      s.status = act; render(); toast(`${STATUS[act].label} (demo)`);
    });
    app.querySelector(".pt-note-form").onsubmit = e => { e.preventDefault(); const t = e.target.querySelector("textarea").value.trim(); if (!t) return; addNote(s, t); render(); toast("Note added (demo)"); };
  }
  const addNote = (s, text) => s.notes.push({ by: D.user.name, at: NOW.toISOString(), text });

  // ---------- Reports & feedback ----------
  // Who can see: only the admin and the independent reviewer. Anyone named in a report is hidden from it.
  const LEVEL = {
    feedback: { label: "Feedback or idea", c: "l-1" }, unhappy: { label: "Something was not right", c: "l-2" },
    serious: { label: "Serious concern", c: "l-3" }, "child-risk": { label: "Child may be at risk", c: "l-4" }
  };
  const RSTATUS = { open: "Received", looking: "Looking into it", closed: "Closed" };
  const fbWorry = r => r.type === "feedback" && (r.asked === "yes" || r.safe === "no" || r.respectful === "no" || r.overall <= 2);
  const stars = n => `<span class="pt-stars" aria-label="${n} out of 5">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`;
  function visitFeedbackHTML(s) {
    const r = D.reports.find(x => x.type === "feedback" && x.ref === s.id);
    if (!r) return s.status === "visit" ? `<section class="pt-card pt-soft"><h2>Visit feedback</h2><p class="pt-sub">After the visit, the requester gets a short "How did we do?" form. Their answers show here, and go to the safeguarding lead, not to the visitor.</p></section>` : "";
    return `<section class="pt-card ${fbWorry(r) ? "pt-warn" : "pt-soft"}"><h2>Visit feedback ${stars(r.overall)}</h2>
      <p class="pt-fb">Respectful: <b>${esc(r.respectful)}</b> · Asked for anything: <b>${esc(r.asked)}</b> · Felt safe: <b>${esc(r.safe)}</b></p>
      ${r.comment ? `<p class="pt-desc">“${esc(r.comment)}”</p>` : ""}<a class="pt-more" href="#/reports/${r.id}">Open feedback →</a></section>`;
  }
  const repRow = r => {
    const title = r.type === "concern" ? r.about : `Visit feedback · ${esc((D.suggestions.find(s => s.id === r.ref) || {}).title || r.ref)}`;
    const tag = r.type === "concern" ? `<span class="pt-pill ${LEVEL[r.level].c}">${LEVEL[r.level].label}</span>` : `<span class="pt-pill ${fbWorry(r) ? "l-3" : "l-ok"}">${stars(r.overall)}</span>`;
    return `<li><a class="pt-row" href="#/reports/${r.id}">
      <span class="pt-row-main"><b>${title}</b><small>${r.type === "concern" ? (r.anonymous ? "Anonymous" : esc(r.name || "Named")) + (r.where ? " · " + esc(r.where) : "") : esc(r.kind === "day" ? "Project day" : "Visit")} · ${RSTATUS[r.status]}</small></span>
      <span class="pt-row-side">${tag}<time>${ago(r.received)}</time></span></a></li>`;
  };
  let rfilter = "open";
  function reports() {
    const list = D.reports.filter(r => rfilter === "all" || (rfilter === "open" ? r.status !== "closed" : rfilter === "concern" ? r.type === "concern" : r.type === "feedback"));
    const fb = D.reports.filter(r => r.type === "feedback"), avg = fb.length ? (fb.reduce((t, r) => t + r.overall, 0) / fb.length).toFixed(1) : "–";
    return `
      <header class="pt-head"><div><p class="pt-kicker">Reports &amp; feedback</p><h1>Safety and trust</h1>
        <p class="pt-sub">Concerns from the website and feedback after every visit and project day.</p></div></header>
      <p class="pt-private">${svg(ICON.team, 16)} Only the admin and the independent reviewer can see this screen. Anyone named in a report never sees it.</p>
      <section class="pt-stats">
        <div class="pt-stat s1"><b>${D.reports.filter(r => r.status !== "closed").length}</b><span>Open</span></div>
        <div class="pt-stat st2"><b>${D.reports.filter(r => r.type === "concern").length}</b><span>Concerns</span></div>
        <div class="pt-stat st1"><b>${avg}</b><span>Average visit rating</span></div>
        <div class="pt-stat st3"><b>${fb.filter(fbWorry).length}</b><span>Worrying answers</span></div>
      </section>
      <div class="pt-tools"><div class="pt-chips" role="group" aria-label="Show">${[["open", "Open"], ["concern", "Concerns"], ["feedback", "Feedback"], ["all", "All"]].map(([k, l]) => `<button type="button" data-rf="${k}" aria-pressed="${rfilter === k}">${l}</button>`).join("")}</div></div>
      <ul class="pt-list big">${list.map(repRow).join("") || `<li class="pt-empty">Nothing open. All reports have been closed.</li>`}</ul>`;
  }
  function reportDetail(id) {
    const r = D.reports.find(x => x.id === id);
    if (!r) return `<p>Not found. <a href="#/reports">Back</a></p>`;
    const steps = ["open", "looking", "closed"].map((k, j, a) => `<li class="${a.indexOf(r.status) > j ? "done" : r.status === k ? "now" : ""}"><i></i><span>${RSTATUS[k]}</span></li>`).join("");
    const what = r.type === "concern" ? `
        <h2>What they told us</h2><p class="pt-desc">${esc(r.what)}</p>
        <dl class="pt-facts"><div><dt>How serious</dt><dd>${LEVEL[r.level].label}</dd></div><div><dt>About</dt><dd>${esc(r.about)}</dd></div>
          ${r.where ? `<div><dt>Where</dt><dd>${esc(r.where)}</dd></div>` : ""}<div><dt>From</dt><dd>${r.anonymous ? "Anonymous" : esc(r.name || "")}${r.reach ? `<br><a href="mailto:${esc(r.reach)}">${esc(r.reach)}</a>` : ""}</dd></div></dl>`
      : `<h2>Their answers ${stars(r.overall)}</h2>
        <dl class="pt-facts"><div><dt>Respectful and kind</dt><dd>${esc(r.respectful)}</dd></div><div><dt>Asked for money, gifts or favours</dt><dd>${esc(r.asked)}</dd></div>
          <div><dt>Felt safe and comfortable</dt><dd>${esc(r.safe)}</dd></div><div><dt>About</dt><dd>${esc((D.suggestions.find(s => s.id === r.ref) || {}).title || r.ref)}</dd></div></dl>
        ${r.comment ? `<p class="pt-desc" style="margin-top:14px">“${esc(r.comment)}”</p>` : ""}`;
    const serious = r.type === "concern" && (r.level === "serious" || r.level === "child-risk");
    return `
      <a class="pt-back" href="#/reports">‹ Reports &amp; feedback</a>
      <header class="pt-head"><div><p class="pt-kicker">${r.type === "concern" ? "Concern" : "Feedback"} ${esc(r.id)} · received ${ago(r.received)}</p>
        <h1>${r.type === "concern" ? esc(r.about) : "Feedback after a visit"}</h1></div></header>
      <ol class="pt-steps">${steps}</ol>
      ${(r.named || []).length ? `<p class="pt-private">${svg(ICON.team, 16)} Hidden from ${esc(r.named.join(", "))}, who ${r.named.length > 1 ? "are" : "is"} named in this.</p>` : ""}
      <div class="pt-detail">
        <section class="pt-card ${fbWorry(r) || serious ? "pt-warn" : ""}">${what}</section>
        <div class="pt-col">
          <section class="pt-card"><h2>Action</h2><div class="pt-actions">
            ${r.status === "open" ? `<button class="pt-btn" data-ra="looking">Pick up and look into it</button>` : ""}
            ${r.status !== "closed" ? `<label class="pt-field">Outcome (shown to the person if they left contact)<textarea data-outcome rows="3" placeholder="What we found and what we did"></textarea></label><button class="pt-btn ghost" data-ra="closed">Close with this outcome</button>` : `<p class="pt-sub"><b>Outcome:</b> ${esc(r.outcome || "Closed. Thank you shared with the team.")}</p><button class="pt-btn ghost" data-ra="open">Reopen</button>`}
            ${r.type === "concern" ? `<button class="pt-btn ghost danger" data-ra="escalate">Escalate to the authorities</button><p class="pt-sub">For a child at risk: call the National Child Protection Authority (1929) or the police (119), then record it here.</p>` : ""}
          </div></section>
          <section class="pt-card"><h2>Private log <span class="pt-count">${r.log.length}</span></h2>
            <ul class="pt-notes">${r.log.map(n => `<li><span class="pt-av">${esc(initials(n.by))}</span><div><b>${esc(n.by)}</b> <time>${ago(n.at)}</time><p>${esc(n.text)}</p></div></li>`).join("") || `<li class="pt-empty">Nothing logged yet.</li>`}</ul>
            <form class="pt-note-form"><textarea rows="2" placeholder="Add to the private log" aria-label="Add to the log"></textarea><button class="pt-btn" type="submit">Add</button></form></section>
        </div>
      </div>`;
  }
  function wireReports() { app.querySelectorAll("[data-rf]").forEach(b => b.onclick = () => { rfilter = b.dataset.rf; render(); }); }
  function wireReport(id) {
    const r = D.reports.find(x => x.id === id); if (!r) return;
    const log = t => r.log.push({ by: D.user.name, at: NOW.toISOString(), text: t });
    app.querySelectorAll("[data-ra]").forEach(b => b.onclick = () => {
      const a = b.dataset.ra;
      if (a === "escalate") { log("Escalated to the authorities."); toast("Escalation logged (demo)"); render(); return; }
      if (a === "closed") { const o = app.querySelector("[data-outcome]").value.trim(); if (!o) { toast("Write the outcome first"); return; } r.outcome = o; log("Closed: " + o); }
      if (a === "looking") log("Picked up and looking into it.");
      if (a === "open") log("Reopened.");
      r.status = a; render(); toast(RSTATUS[a] + " (demo)");
    });
    app.querySelector(".pt-note-form").onsubmit = e => { e.preventDefault(); const t = e.target.querySelector("textarea").value.trim(); if (!t) return; log(t); render(); };
  }

  // ---------- Projects ----------
  // Same rules as the website: the stage and the ring come from the facts on the project.
  const STAGE = { 1: ["Initiated", "st-1"], 2: ["Activated", "st-2"], 3: ["Impact", "st-3"] };
  function ringSteps(p) {
    const b = budget(p), n = stageNum(p);
    if (n === 1) return [["Visited and verified", p.verified ? 1 : 0, "verified"], ["Budget ready", b.goal > 0 ? 1 : 0, null], ["Funded", b.goal ? Math.min(1, b.raised / b.goal) : 0, null]];
    if (n === 2) return [["Date confirmed", p.date_set ? 1 : 0, "date_set"], ["Place and transport booked", p.booked ? 1 : 0, "booked"], ["Volunteers ready", p.volunteers ? 1 : 0, "volunteers"],
      ...(p.steps || []).filter(x => x && x.name).map((x, k) => [x.name, x.done ? 1 : 0, "step:" + k])];
    const ex = (p.expectations || []).filter(x => x && x.text);
    return [["The day happened", 1, null], ["Story shared", (p.updates || []).length || p.story ? 1 : 0, null], ["Money reported", (p.budget || []).some(x => x && x.item) ? 1 : 0, null],
      ["Expectations reviewed", ex.length ? ex.filter(x => x.result).length / ex.length : 0, null]];
  }
  const ringPct = p => { const st = ringSteps(p); return Math.round(st.reduce((t, x) => t + x[1], 0) / st.length * 100); };
  const ringLabel = p => ({ 1: "Activating", 2: "Preparing the day", 3: "Delivered" })[stageNum(p)];
  const ringSVG = (pct, size = 44) => `<svg class="pt-ring" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><circle cx="20" cy="20" r="16" pathLength="100" class="tr"/><circle cx="20" cy="20" r="16" pathLength="100" class="fl" stroke-dasharray="${pct} 100" transform="rotate(-90 20 20)"/></svg>`;
  const cover = p => p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : `<span class="pt-nocover">No picture yet</span>`;
  const nextStep = p => { const st = ringSteps(p).find(x => x[1] < 1); return st ? st[0] : stageNum(p) === 2 ? "Ready for the day" : "All done"; };
  let pfilter = "all";
  function projects() {
    const list = P.filter(p => pfilter === "all" || String(stageNum(p)) === pfilter);
    const c = n => P.filter(p => stageNum(p) === n).length;
    return `
      <header class="pt-head"><div><p class="pt-kicker">Projects</p><h1>All projects</h1>
        <p class="pt-sub">A project's stage moves by itself: verified and fully funded makes it Activated.</p></div>
        <button type="button" class="pt-btn" data-newp>+ New project</button></header>
      <div class="pt-tools"><div class="pt-chips" role="group" aria-label="Show">${[["all", "All", P.length], ["1", "Initiated", c(1)], ["2", "Activated", c(2)], ["3", "Impact", c(3)]].map(([k, l, n]) => `<button type="button" data-pf="${k}" aria-pressed="${pfilter === k}">${l} <b>${n}</b></button>`).join("")}</div></div>
      <ul class="pt-list big">${list.map(p => `<li><a class="pt-row pt-prow" href="#/projects/${esc(p.slug)}">
        <span class="pt-thumb">${cover(p)}</span>
        <span class="pt-row-main"><b>${esc(p.title)}</b><small>${esc(p.theme || "")}${p.city ? " · " + esc(p.city) : ""} · Next: ${esc(nextStep(p))}</small></span>
        <span class="pt-row-side"><span class="pt-pill ${STAGE[stageNum(p)][1]}">${STAGE[stageNum(p)][0]}</span><span class="pt-pct">${ringSVG(ringPct(p), 30)}<b>${ringPct(p)}%</b></span></span></a></li>`).join("") || `<li class="pt-empty">No projects here yet.</li>`}</ul>`;
  }
  function wireProjects() {
    app.querySelectorAll("[data-pf]").forEach(b => b.onclick = () => { pfilter = b.dataset.pf; render(); });
    app.querySelector("[data-newp]").onclick = () => toast("New projects start from a verified suggestion (Suggestions → Turn into a project).");
  }

  let etab = "details";
  const CATS = ["Trips & Events", "Livelihood", "Education"], CITIES = ["Kilinochchi", "Batticaloa", "Jaffna"];
  function editor(slug) {
    const p = P.find(x => x.slug === slug);
    if (!p) return `<p>Not found. <a href="#/projects">Back to projects</a></p>`;
    const n = stageNum(p), b = budget(p), pct = ringPct(p), lines = (p.budget || []);
    const sum = lines.reduce((t, x) => t + num(x.amount), 0);
    const field = (label, inner, hint = "") => `<label class="pt-field">${label}${inner}${hint ? `<small>${hint}</small>` : ""}</label>`;
    const tabs = [["details", "Details"], ["story", "Story"], ["budget", "Budget"], ["checklist", "Checklist"], ["sponsors", "Sponsors"], ["impact", "Expected impact"]];
    const panes = {
      details: `
        <div class="pt-cover">${cover(p)}<button type="button" class="pt-btn ghost" data-demo="Choose a picture from your phone (demo)">Change picture</button></div>
        ${field("Title", `<input data-f="title" value="${esc(p.title)}" maxlength="90">`)}
        <div class="pt-2">${field("Category", `<select data-f="theme">${CATS.map(c => `<option ${p.theme === c ? "selected" : ""}>${c}</option>`).join("")}</select>`)}
          ${field("City", `<select data-f="city"><option value="">Choose</option>${CITIES.map(c => `<option ${p.city === c ? "selected" : ""}>${c}</option>`).join("")}</select>`)}</div>
        <div class="pt-2">${field("Place", `<input data-f="location" value="${esc(p.location || "")}" placeholder="e.g. Casuarina Beach, Karainagar">`)}
          ${field("Who it reaches", `<input data-f="reach" value="${esc(p.reach || "")}" placeholder="e.g. About 25 children">`)}</div>
        ${field("Short summary", `<textarea data-f="summary" rows="3" maxlength="240">${esc(p.summary || "")}</textarea>`, "Shown on the project card. One or two sentences.")}`,
      story: `
        ${field("The story", `<textarea data-f="story" rows="14">${esc(p.story || "")}</textarea>`, "Use ## for a heading and **bold** for bold. Shown on the Story tab of the project page.")}`,
      budget: `
        <p class="pt-sub" style="margin:0 0 10px">${n === 1 ? "Estimated costs. Shown as the breakdown on the project's Budget tab." : n === 2 ? "The plan for the money. Visitors only see the total and Fully funded." : "Real costs after the day. Shown as Where the money went."}</p>
        <ul class="pt-lines">${lines.map((x, k) => `<li><input data-bl="${k}" data-k="item" value="${esc(x.item)}" aria-label="What"><span class="pt-money"><i>$</i><input data-bl="${k}" data-k="amount" value="${esc(x.amount)}" inputmode="decimal" aria-label="Amount"></span><button type="button" class="pt-x" data-delbl="${k}" aria-label="Remove line">✕</button></li>`).join("")}</ul>
        <button type="button" class="pt-btn ghost" data-addbl>+ Add a line</button>
        <p class="pt-total"><span>${n === 3 ? "Total spent" : "Total"}</span><b>${money(sum)}</b></p>
        ${field("Budget goal", `<span class="pt-money"><i>$</i><input data-f="goal" value="${esc(p.goal || sum || "")}" inputmode="decimal"></span>`, sum && num(p.goal) && num(p.goal) !== sum ? `The lines add up to ${money(sum)}. <button type="button" class="pt-link" data-goalsum>Use ${money(sum)}</button>` : "Usually the same as the total of the lines.")}`,
      checklist: `
        <p class="pt-sub" style="margin:0 0 10px">${n === 1 ? "Before a project can be Activated it must be visited and verified, and fully funded." : n === 2 ? "What has to be ready before the day." : "After the day: these fill in from the story, costs and expectations."}</p>
        <ul class="pt-checks">${ringSteps(p).map(([name, done, key]) => `<li class="${done >= 1 ? "done" : done > 0 ? "part" : ""}">
          ${key ? `<label><input type="checkbox" data-ck="${key}" ${done >= 1 ? "checked" : ""}> <span>${esc(name)}</span></label>` : `<span class="pt-auto"><i>${done >= 1 ? "✓" : done > 0 ? Math.round(done * 100) + "%" : "–"}</i>${esc(name)}</span><small>${name === "Funded" ? "From confirmed pledges" : name === "Budget ready" ? "From the Budget tab" : "Automatic"}</small>`}</li>`).join("")}</ul>
        ${n === 2 ? `<form class="pt-addstep"><input placeholder="Add a step, e.g. Permission letter from the home" aria-label="New step"><button class="pt-btn ghost" type="submit">Add</button></form>` : ""}`,
      sponsors: `
        <ul class="pt-spons">${(p.funders || []).map(f => `<li><span class="pt-av">${esc(initials(f.name))}</span><b>${esc(f.name)}</b><em>${money(num(f.amount))}</em></li>`).join("") || `<li class="pt-empty">No pledges yet.</li>`}</ul>
        <p class="pt-total"><span>Pledged</span><b>${money(b.raised)} of ${money(b.goal)}</b></p>
        <p class="pt-sub">Received pledges only. <a href="#/sponsors">Record or confirm pledges →</a></p>`,
      impact: `
        <p class="pt-sub" style="margin:0 0 10px">${n === 3 ? "Mark each one after the day. Visitors see the result." : "What the organizers expect the day to achieve. Closed with a tick after the day."}</p>
        <ul class="pt-exp">${(p.expectations || []).map((x, k) => `<li><input data-ex="${k}" value="${esc(x.text)}" aria-label="Expectation">${n === 3 ? `<select data-exr="${k}" aria-label="Result"><option value="">Not reviewed</option>${[["met", "Met"], ["partly", "Partly met"], ["not", "Not met"]].map(([v, l]) => `<option value="${v}" ${x.result === v ? "selected" : ""}>${l}</option>`).join("")}</select>` : ""}<button type="button" class="pt-x" data-delex="${k}" aria-label="Remove">✕</button></li>`).join("")}</ul>
        <button type="button" class="pt-btn ghost" data-addex>+ Add an expectation</button>`
    };
    return `
      <a class="pt-back" href="#/projects">‹ All projects</a>
      <header class="pt-head"><div><p class="pt-kicker">${p.isNew ? "New project · from suggestion " + esc(p.fromSuggestion) : "Project editor"}</p><h1>${esc(p.title)}</h1>
        <p><span class="pt-pill ${STAGE[n][1]}">${STAGE[n][0]}</span> <span class="pt-sub">${p.published === false || p.isNew ? "Draft · not on the website yet" : "On the website"}</span></p></div>
        <div class="pt-actions-row"><a class="pt-btn ghost" href="/projects/${esc(p.slug)}" target="_blank" rel="noopener">View ↗</a><button type="button" class="pt-btn" data-publish>${p.isNew ? "Publish" : "Save changes"}</button></div></header>
      <ol class="pt-steps">${[1, 2, 3].map(k => `<li class="${k < n ? "done" : k === n ? "now" : ""}"><i></i><span>${STAGE[k][0]}</span></li>`).join("")}</ol>
      <div class="pt-edit">
        <div>
          <div class="pt-etabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${etab === k}" data-et="${k}">${l}</button>`).join("")}</div>
          <section class="pt-card pt-epane">${panes[etab]}</section>
        </div>
        <aside class="pt-preview">
          <p class="pt-kicker">Live preview</p>
          <div class="pt-pcard"><span class="pt-pcover">${cover(p)}</span><div><small>${esc((p.theme || "").toUpperCase())}</small><b>${esc(p.title)}</b><p>${esc(p.summary || "")}</p></div></div>
          <div class="pt-card pt-ringcard"><h2>${ringLabel(p)}</h2><div class="pt-ringrow">${ringSVG(pct, 92)}<b class="pt-ringn">${pct}%</b></div>
            <ul>${ringSteps(p).map(([name, d]) => `<li class="${d >= 1 ? "done" : ""}"><span>${esc(name)}</span><b>${d >= 1 ? "✓" : d > 0 ? Math.round(d * 100) + "%" : "–"}</b></li>`).join("")}</ul></div>
          <div class="pt-card"><h2>Budget</h2><p class="pt-big"><b>${money(b.goal)}</b> <span>${n === 1 ? `· ${b.goal ? Math.round(b.raised / b.goal * 100) : 0}% funded` : "✓ Fully funded"}</span></p></div>
        </aside>
      </div>`;
  }
  function wireEditor(slug) {
    const p = P.find(x => x.slug === slug); if (!p) return;
    const before = stageNum(p);
    const after = () => { const n = stageNum(p); if (n !== before) toast(`Stage changed: now ${STAGE[n][0]}`); render(); };
    const keep = el => { const sel = el.dataset.f ? `[data-f="${el.dataset.f}"]` : null; return sel; };
    app.querySelectorAll("[data-et]").forEach(b => b.onclick = () => { etab = b.dataset.et; render(); });
    app.querySelectorAll("[data-f]").forEach(el => el.onchange = () => { p[el.dataset.f] = el.dataset.f === "goal" ? num(el.value) : el.value; after(); });
    app.querySelectorAll("[data-bl]").forEach(el => el.onchange = () => { const x = p.budget[+el.dataset.bl]; x[el.dataset.k] = el.dataset.k === "amount" ? num(el.value) : el.value; render(); });
    app.querySelectorAll("[data-delbl]").forEach(b => b.onclick = () => { p.budget.splice(+b.dataset.delbl, 1); render(); });
    const ab = app.querySelector("[data-addbl]"); if (ab) ab.onclick = () => { (p.budget = p.budget || []).push({ item: "", amount: 0 }); render(); const l = app.querySelectorAll('[data-k="item"]'); if (l.length) l[l.length - 1].focus(); };
    const gs = app.querySelector("[data-goalsum]"); if (gs) gs.onclick = () => { p.goal = p.budget.reduce((t, x) => t + num(x.amount), 0); after(); };
    app.querySelectorAll("[data-ck]").forEach(c => c.onchange = () => { const k = c.dataset.ck; if (k.startsWith("step:")) p.steps[+k.slice(5)].done = c.checked; else p[k] = c.checked; after(); });
    const as = app.querySelector(".pt-addstep"); if (as) as.onsubmit = e => { e.preventDefault(); const v = e.target.querySelector("input").value.trim(); if (!v) return; (p.steps = p.steps || []).push({ name: v, done: false }); render(); };
    app.querySelectorAll("[data-ex]").forEach(el => el.onchange = () => { p.expectations[+el.dataset.ex].text = el.value; render(); });
    app.querySelectorAll("[data-exr]").forEach(el => el.onchange = () => { p.expectations[+el.dataset.exr].result = el.value; render(); });
    app.querySelectorAll("[data-delex]").forEach(b => b.onclick = () => { p.expectations.splice(+b.dataset.delex, 1); render(); });
    const ae = app.querySelector("[data-addex]"); if (ae) ae.onclick = () => { (p.expectations = p.expectations || []).push({ text: "" }); render(); const l = app.querySelectorAll("[data-ex]"); if (l.length) l[l.length - 1].focus(); };
    app.querySelectorAll("[data-demo]").forEach(b => b.onclick = () => toast(b.dataset.demo));
    app.querySelector("[data-publish]").onclick = () => { if (p.isNew) { p.isNew = false; p.published = true; render(); toast("Published to the website (demo)"); } else toast("Saved (demo)"); };
    void keep;
  }

  // ---------- Sponsors & pledges ----------
  // A pledge counts toward a project's funding only once the money is marked received.
  const fmtD = iso => iso ? new Date(iso + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  const projOf = slug => P.find(p => p.slug === slug) || { title: slug, slug };
  function syncFunders(slug) { // the project's funders = its received pledges
    const p = P.find(x => x.slug === slug); if (!p) return;
    p.funders = D.pledges.filter(x => x.project === slug && x.status === "received").map(x => ({ name: x.public ? x.name : "A friend of Raavanaa", amount: x.amount }));
  }
  let sview = "pledges";
  function sponsors() {
    const recv = D.pledges.filter(x => x.status === "received"), wait = D.pledges.filter(x => x.status === "pledged");
    const tot = a => a.reduce((t, x) => t + num(x.amount), 0);
    const people = {}; D.pledges.forEach(x => { const k = x.name; (people[k] = people[k] || { name: k, total: 0, n: 0, projects: new Set(), contact: x.contact }); people[k].total += x.status === "received" ? num(x.amount) : 0; people[k].n++; people[k].projects.add(projOf(x.project).title); });
    const open = P.filter(p => stageNum(p) === 1 && budget(p).goal > 0);
    const row = x => { const p = projOf(x.project); return `<li class="pt-pl ${x.status}">
        <span class="pt-av">${esc(initials(x.name))}</span>
        <span class="pt-row-main"><b>${esc(x.name)}${x.public ? "" : ' <small class="pt-tag">Anonymous on site</small>'}</b><small>${esc(p.title)} · pledged ${fmtD(x.pledged)}${x.status === "received" ? ` · received ${fmtD(x.received)} by ${esc(x.method)}` : ""}</small></span>
        <span class="pt-row-side"><b class="pt-amt">${money(x.amount)}</b>${x.status === "pledged"
          ? `<button type="button" class="pt-btn sm" data-recv="${x.id}">Mark received</button>`
          : x.thanked ? `<span class="pt-pill st-1">✓ Thanked</span>` : `<button type="button" class="pt-btn ghost sm" data-thank="${x.id}">Send thank-you</button>`}</span></li>`; };
    return `
      <header class="pt-head"><div><p class="pt-kicker">Sponsors &amp; pledges</p><h1>Sponsors &amp; pledges</h1>
        <p class="pt-sub">A pledge counts toward a project only when the money is marked received.</p></div>
        <button type="button" class="pt-btn" data-newpl>+ Record a pledge</button></header>
      <section class="pt-stats">
        <div class="pt-stat st1"><b>${money(tot(recv))}</b><span>Received</span></div>
        <div class="pt-stat st2"><b>${money(tot(wait))}</b><span>Waiting to receive</span></div>
        <div class="pt-stat s1"><b>${Object.keys(people).length}</b><span>Sponsors</span></div>
        <div class="pt-stat st3"><b>${money(open.reduce((t, p) => t + Math.max(0, budget(p).goal - budget(p).raised), 0))}</b><span>Still needed</span></div>
      </section>
      <form class="pt-card pt-plform" id="pt-plform" hidden>
        <h2>Record a pledge</h2>
        ${open.length ? "" : `<p class="pt-sub" style="margin:0 0 10px">No Initiated project is waiting for money right now. Pledges can be recorded once a project has a budget.</p>`}
        <div class="pt-2">
          <label class="pt-field">Project<select name="project" required>${open.map(p => `<option value="${esc(p.slug)}">${esc(p.title)} · ${money(Math.max(0, budget(p).goal - budget(p).raised))} needed</option>`).join("")}</select></label>
          <label class="pt-field">Sponsor<input name="name" list="pt-sponsor-names" required placeholder="Family, person or group"><datalist id="pt-sponsor-names">${Object.keys(people).map(n => `<option value="${esc(n)}">`).join("")}</datalist></label>
          <label class="pt-field">Amount<span class="pt-money"><i>$</i><input name="amount" inputmode="decimal" required></span></label>
          <label class="pt-field">Email or phone<input name="contact" placeholder="For the thank-you and receipt"></label>
        </div>
        <label class="pt-check"><input type="checkbox" name="public" checked><span>Show their name on the website (otherwise "A friend of Raavanaa")</span></label>
        <label class="pt-check"><input type="checkbox" name="received"><span>Money already received</span></label>
        <div class="pt-actions-row" style="margin-top:12px"><button class="pt-btn" type="submit" ${open.length ? "" : "disabled"}>Save pledge</button><button class="pt-btn ghost" type="button" data-cancelpl>Cancel</button></div>
      </form>
      <div class="pt-tools"><div class="pt-chips" role="group" aria-label="Show">${[["pledges", "Pledges"], ["sponsors", "Sponsors"], ["projects", "By project"]].map(([k, l]) => `<button type="button" data-sv="${k}" aria-pressed="${sview === k}">${l}</button>`).join("")}</div></div>
      ${sview === "pledges" ? `
        ${wait.length ? `<h2 class="pt-h2">Waiting to receive <span class="pt-count">${wait.length}</span></h2><ul class="pt-list big">${wait.map(row).join("")}</ul>` : ""}
        <h2 class="pt-h2">Received <span class="pt-count">${recv.length}</span></h2><ul class="pt-list big">${recv.map(row).join("")}</ul>`
      : sview === "sponsors" ? `<ul class="pt-list big">${Object.values(people).sort((a, b) => b.total - a.total).map(x => `<li class="pt-pl"><span class="pt-av">${esc(initials(x.name))}</span>
          <span class="pt-row-main"><b>${esc(x.name)}</b><small>${[...x.projects].map(esc).join(" · ")}${x.contact ? " · " + esc(x.contact) : ""}</small></span>
          <span class="pt-row-side"><b class="pt-amt">${money(x.total)}</b><small class="pt-sub" style="margin:0">${x.n} pledge${x.n > 1 ? "s" : ""}</small></span></li>`).join("")}</ul>`
      : `<div class="pt-grid">${P.filter(p => budget(p).goal > 0).map(p => { const b = budget(p), q = Math.min(100, Math.round(b.raised / b.goal * 100)), pend = tot(wait.filter(x => x.project === p.slug)); return `<section class="pt-card">
          <h2><a href="#/projects/${esc(p.slug)}">${esc(p.title)}</a> <span class="pt-pill ${STAGE[stageNum(p)][1]}">${STAGE[stageNum(p)][0]}</span></h2>
          <p class="pt-big"><b>${money(b.raised)}</b> <span>of ${money(b.goal)}</span></p>
          <div class="pt-bar pt-bar2"><i style="width:${q}%"></i>${pend ? `<i class="pend" style="width:${Math.min(100 - q, Math.round(pend / b.goal * 100))}%"></i>` : ""}</div>
          <p class="pt-sub">${q}% received${pend ? ` · ${money(pend)} waiting` : ""}${b.raised >= b.goal ? " · fully funded" : ""}</p></section>`; }).join("")}</div>`}`;
  }
  function wireSponsors() {
    app.querySelectorAll("[data-sv]").forEach(b => b.onclick = () => { sview = b.dataset.sv; render(); });
    const form = app.querySelector("#pt-plform");
    app.querySelector("[data-newpl]").onclick = () => { form.hidden = false; form.querySelector("[name=name]").focus(); };
    app.querySelector("[data-cancelpl]").onclick = () => { form.hidden = true; };
    form.onsubmit = e => {
      e.preventDefault(); const f = new FormData(form), amt = num(f.get("amount")); if (!amt) { toast("Enter an amount"); return; }
      const today = NOW.toISOString().slice(0, 10), rec = !!f.get("received");
      const p = projOf(f.get("project")), before = stageNum(p);
      D.pledges.unshift({ id: "pl-" + Date.now(), project: f.get("project"), name: String(f.get("name")).trim(), amount: amt, status: rec ? "received" : "pledged", pledged: today, received: rec ? today : "", method: rec ? "e-Transfer" : "", contact: String(f.get("contact") || ""), public: !!f.get("public"), thanked: false });
      if (rec) syncFunders(p.slug);
      render(); toast(stageNum(p) !== before ? `${p.title} is now Activated` : rec ? "Pledge saved as received (demo)" : "Pledge saved (demo)");
    };
    app.querySelectorAll("[data-recv]").forEach(b => b.onclick = () => {
      const x = D.pledges.find(y => y.id === b.dataset.recv), p = projOf(x.project), before = stageNum(p);
      x.status = "received"; x.received = NOW.toISOString().slice(0, 10); x.method = "e-Transfer"; syncFunders(x.project);
      const bb = budget(p); render();
      toast(stageNum(p) !== before ? `${p.title} is now Activated` : bb.raised >= bb.goal && !p.verified ? "Fully funded. It becomes Activated once the visit is verified." : "Marked received (demo)");
    });
    app.querySelectorAll("[data-thank]").forEach(b => b.onclick = () => { D.pledges.find(y => y.id === b.dataset.thank).thanked = true; render(); toast("Thank-you sent (demo)"); });
  }

  function render() {
    const [page, id] = route();
    const cur = ["suggestions", "reports", "projects", "sponsors"].includes(page) ? page : "dashboard";
    drawNav(cur);
    if (page === "suggestions" && id) { app.innerHTML = detail(id); wireDetail(id); }
    else if (page === "suggestions") { app.innerHTML = suggestions(); wireSuggestions(); }
    else if (page === "sponsors") { app.innerHTML = sponsors(); wireSponsors(); }
    else if (page === "projects" && id) { app.innerHTML = editor(id); wireEditor(id); }
    else if (page === "projects") { app.innerHTML = projects(); wireProjects(); }
    else if (page === "reports" && id) { app.innerHTML = reportDetail(id); wireReport(id); }
    else if (page === "reports") { app.innerHTML = reports(); wireReports(); }
    else app.innerHTML = dashboard();
    document.title = `${{ suggestions: "Suggestions", reports: "Reports & feedback", projects: "Projects", sponsors: "Sponsors & pledges" }[page] || "Dashboard"} · Team Portal · Raavanaa`;
  }

  Promise.all([fetch("/portal-demo.json").then(r => r.json()), fetch("/projects.json").then(r => r.json()).catch(() => ({ projects: [] }))])
    .then(([d, p]) => {
      D = d; P = (p.projects || []).filter(x => !x.hidden);
      window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
      render();
    })
    .catch(() => { app.innerHTML = "<p>Could not load the portal preview.</p>"; });
})();
