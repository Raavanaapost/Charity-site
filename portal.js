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
    ["sponsors", "Sponsors & pledges", true], ["day", "Day preparation", true], ["close", "Close the day", true],
    ["people", "People", true], ["team", "Team & logins", true]
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
        : `<button type="button" class="${["sponsors", "day", "close", "people", "team"].includes(cur) ? "on" : ""}" data-soon>${svg(ICON[k], 22)}<span>${l}</span></button>`;
    }).join("");
    document.querySelectorAll("[data-soon]").forEach(b => b.onclick = () => {
      let m = document.getElementById("pt-more");
      if (m) { m.remove(); return; }
      m = document.createElement("div"); m.id = "pt-more"; m.className = "pt-more-menu";
      m.innerHTML = MENU.filter(([k]) => !["dashboard", "suggestions", "projects", "reports"].includes(k)).map(([k, l]) => `<a href="#/${k}">${svg(ICON[k])}<span>${l}</span></a>`).join("");
      document.body.appendChild(m); m.addEventListener("click", () => m.remove());
    });
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
    if (n === 2) return [["Date confirmed", p.date_set ? 1 : 0, null], ["Place and transport booked", p.booked ? 1 : 0, null], ["Volunteers ready", p.volunteers ? 1 : 0, null],
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
        <p class="pt-sub" style="margin:0 0 10px">${n === 1 ? "Before a project can be Activated it must be visited and verified, and fully funded." : n === 2 ? 'What has to be ready before the day. These also tick themselves from <a href="#/day/' + esc(p.slug) + '">Day preparation</a>.' : "After the day: these fill in from the story, costs and expectations."}</p>
        <ul class="pt-checks">${ringSteps(p).map(([name, done, key]) => `<li class="${done >= 1 ? "done" : done > 0 ? "part" : ""}">
          ${key ? `<label><input type="checkbox" data-ck="${key}" ${done >= 1 ? "checked" : ""}> <span>${esc(name)}</span></label>` : `<span class="pt-auto"><i>${done >= 1 ? "✓" : done > 0 ? Math.round(done * 100) + "%" : "–"}</i>${esc(name)}</span><small>${name === "Funded" ? "From received pledges" : name === "Budget ready" ? "From the Budget tab" : n === 2 ? '<a href="#/day/' + esc(p.slug) + '">From Day preparation</a>' : "Automatic"}</small>`}</li>`).join("")}</ul>
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

  // ---------- Day preparation ----------
  // Everything for an Activated project's day. Date, transport and volunteers tick the project's checklist by themselves.
  const dayOf = slug => D.days[slug] || (D.days[slug] = { date: "", meet: "", place: "", back: "", transport: { what: "", who: "", phone: "", booked: false }, needed: 4, volunteers: [], consent: { children: 0, forms: 0 }, packing: [], plan: [] });
  function syncDay(p) {
    const d = dayOf(p.slug);
    p.date_set = !!d.date; p.booked = !!d.transport.booked;
    p.volunteers = d.volunteers.filter(v => v.ok).length >= d.needed;
  }
  const daysTo = iso => Math.round((new Date(iso + "T12:00") - NOW) / 864e5);
  let dsel = null;
  function dayPrep(slug) {
    const list = P.filter(p => stageNum(p) === 2);
    if (!list.length) return `<header class="pt-head"><div><p class="pt-kicker">Day preparation</p><h1>Day preparation</h1></div></header><p class="pt-empty">No Activated projects right now. A project appears here once it is verified and fully funded.</p>`;
    const p = list.find(x => x.slug === (slug || dsel)) || list[0]; dsel = p.slug;
    const d = dayOf(p.slug); syncDay(p);
    const okV = d.volunteers.filter(v => v.ok).length, packed = d.packing.filter(x => x.done).length;
    const ready = [["Date and times set", !!d.date], ["Transport booked", !!d.transport.booked], [`Volunteers confirmed (${okV}/${d.needed})`, okV >= d.needed],
      [`Consent forms (${d.consent.forms}/${d.consent.children})`, d.consent.children > 0 && d.consent.forms >= d.consent.children], [`Packing (${packed}/${d.packing.length})`, d.packing.length > 0 && packed === d.packing.length]];
    const allReady = ready.every(x => x[1]), left = d.date ? daysTo(d.date) : null;
    return `
      <header class="pt-head"><div><p class="pt-kicker">Day preparation</p><h1>${esc(p.title)}</h1>
        <p>${d.date ? `<span class="pt-pill ${allReady ? "st-1" : "st-2"}">${allReady ? "Ready for the day" : left >= 0 ? `In ${left} day${left === 1 ? "" : "s"}` : "Date passed"}</span> <span class="pt-sub">${new Date(d.date + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>` : `<span class="pt-pill st-2">No date yet</span>`}</p></div>
        ${list.length > 1 ? `<select class="pt-sel" data-dsel aria-label="Project">${list.map(x => `<option value="${esc(x.slug)}" ${x === p ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select>` : ""}</header>
      <div class="pt-readybar">${ready.map(([l, ok]) => `<span class="${ok ? "ok" : ""}"><i>${ok ? "✓" : "•"}</i>${l}</span>`).join("")}</div>
      <div class="pt-grid">
        <section class="pt-card"><h2>When and where</h2>
          <div class="pt-2"><label class="pt-field">Date<input type="date" data-d="date" value="${esc(d.date)}"></label>
          <label class="pt-field">Meeting place<input data-d="place" value="${esc(d.place)}"></label>
          <label class="pt-field">Meet at<input type="time" data-d="meet" value="${esc(d.meet)}"></label>
          <label class="pt-field">Back by<input type="time" data-d="back" value="${esc(d.back)}"></label></div></section>
        <section class="pt-card"><h2>Transport</h2>
          <div class="pt-2"><label class="pt-field">Vehicle<input data-t="what" value="${esc(d.transport.what)}" placeholder="e.g. Van, 30 seats"></label>
          <label class="pt-field">Driver<input data-t="who" value="${esc(d.transport.who)}"></label>
          <label class="pt-field">Driver's phone<input data-t="phone" value="${esc(d.transport.phone)}" inputmode="tel"></label></div>
          <label class="pt-check"><input type="checkbox" data-tbook ${d.transport.booked ? "checked" : ""}><span>Booked and paid</span></label></section>
        <section class="pt-card"><h2>Volunteers <span class="pt-count">${okV}/${d.needed} confirmed</span></h2>
          <ul class="pt-vols">${d.volunteers.map((v, k) => `<li><span class="pt-av">${esc(initials(v.name))}</span><span class="pt-row-main"><b>${esc(v.name)}</b><small>${esc(v.role)}</small></span>
            <button type="button" class="pt-pill ${v.ok ? "st-1" : "st-2"} pt-pillbtn" data-vok="${k}">${v.ok ? "✓ Confirmed" : "Waiting"}</button><button type="button" class="pt-x" data-vdel="${k}" aria-label="Remove">✕</button></li>`).join("")}</ul>
          <form class="pt-addvol"><select name="who" aria-label="Team member">${D.team.map(t => `<option>${esc(t)}</option>`).join("")}</select><input name="role" placeholder="Role, e.g. Water safety" aria-label="Role"><button class="pt-btn ghost" type="submit">Add</button></form>
          <label class="pt-field" style="margin:10px 0 0">Volunteers needed<input type="number" min="1" max="30" data-need value="${d.needed}" style="max-width:90px"></label></section>
        <section class="pt-card"><h2>Children and consent</h2>
          <p class="pt-sub" style="margin:0 0 10px">Only numbers here. Names and forms stay with the home or school.</p>
          <div class="pt-2"><label class="pt-field">Children coming<input type="number" min="0" data-c="children" value="${d.consent.children}"></label>
          <label class="pt-field">Consent forms received<input type="number" min="0" data-c="forms" value="${d.consent.forms}"></label></div>
          <div class="pt-bar"><i style="width:${d.consent.children ? Math.min(100, Math.round(d.consent.forms / d.consent.children * 100)) : 0}%;background:#1f7a47"></i></div></section>
        <section class="pt-card"><h2>Packing list <span class="pt-count">${packed}/${d.packing.length}</span></h2>
          <ul class="pt-pack">${d.packing.map((x, k) => `<li><label class="pt-check"><input type="checkbox" data-pk="${k}" ${x.done ? "checked" : ""}><span>${esc(x.t)}</span></label></li>`).join("")}</ul>
          <form class="pt-addline"><input placeholder="Add an item" aria-label="New item"><button class="pt-btn ghost" type="submit">Add</button></form></section>
        <section class="pt-card"><h2>Plan for the day</h2>
          <ol class="pt-plan">${d.plan.map((x, k) => `<li><time>${esc(x.at)}</time><span>${esc(x.t)}</span><button type="button" class="pt-x" data-pdel="${k}" aria-label="Remove">✕</button></li>`).join("")}</ol>
          <form class="pt-addplan"><input type="time" name="at" aria-label="Time"><input name="t" placeholder="What happens" aria-label="What happens"><button class="pt-btn ghost" type="submit">Add</button></form>
          <button type="button" class="pt-btn ghost" data-share style="margin-top:10px">Share the plan with the team</button></section>
      </div>`;
  }
  function wireDay() {
    const sel = app.querySelector("[data-dsel]"); if (sel) sel.onchange = () => { dsel = sel.value; render(); };
    if (!dsel) return; const p = P.find(x => x.slug === dsel); if (!p) return; const d = dayOf(p.slug);
    const after = msg => { syncDay(p); render(); if (msg) toast(msg); };
    app.querySelectorAll("[data-d]").forEach(el => el.onchange = () => { d[el.dataset.d] = el.value; after(); });
    app.querySelectorAll("[data-t]").forEach(el => el.onchange = () => { d.transport[el.dataset.t] = el.value; after(); });
    app.querySelector("[data-tbook]").onchange = e => { d.transport.booked = e.target.checked; after(e.target.checked ? "Transport booked (demo)" : ""); };
    app.querySelectorAll("[data-vok]").forEach(b => b.onclick = () => { const v = d.volunteers[+b.dataset.vok]; v.ok = !v.ok; after(); });
    app.querySelectorAll("[data-vdel]").forEach(b => b.onclick = () => { d.volunteers.splice(+b.dataset.vdel, 1); after(); });
    app.querySelector(".pt-addvol").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); d.volunteers.push({ name: f.get("who"), role: String(f.get("role") || "Helper").trim() || "Helper", ok: false }); after("Asked to volunteer (demo)"); };
    app.querySelector("[data-need]").onchange = e => { d.needed = Math.max(1, num(e.target.value)); after(); };
    app.querySelectorAll("[data-c]").forEach(el => el.onchange = () => { d.consent[el.dataset.c] = num(el.value); after(); });
    app.querySelectorAll("[data-pk]").forEach(c => c.onchange = () => { d.packing[+c.dataset.pk].done = c.checked; after(); });
    app.querySelector(".pt-addline").onsubmit = e => { e.preventDefault(); const v = e.target.querySelector("input").value.trim(); if (v) { d.packing.push({ t: v, done: false }); after(); } };
    app.querySelectorAll("[data-pdel]").forEach(b => b.onclick = () => { d.plan.splice(+b.dataset.pdel, 1); after(); });
    app.querySelector(".pt-addplan").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target), t = String(f.get("t") || "").trim(); if (!t) return; d.plan.push({ at: f.get("at") || "", t }); d.plan.sort((a, b) => String(a.at).localeCompare(String(b.at))); after(); };
    app.querySelector("[data-share]").onclick = () => toast("Plan sent to the volunteers by email (demo)");
  }

  // ---------- Close the day ----------
  // After the day: what happened, real costs, expectations, the story and pictures. Publishing moves the project to Impact.
  const CL = {};
  const clOf = p => CL[p.slug] || (CL[p.slug] = {
    step: 0, happened: true, children: (dayOf(p.slug).consent || {}).children || "", volunteers: (dayOf(p.slug).volunteers || []).filter(v => v.ok).length || "", families: "", incident: false, notes: "",
    costs: (p.budget || []).map(x => ({ item: x.item, plan: num(x.amount), real: num(x.amount), receipt: false })), leftover: "next",
    exp: (p.expectations || []).map(x => ({ text: x.text, result: x.result || "", note: x.note || "" })),
    title: "", story: "", photos: 0, consent: false, video: "", feedback: true, thank: true
  });
  const CSTEPS = ["The day", "Real costs", "Expectations", "Story & pictures", "Publish"];
  let csel = null;
  function closeDay(slug) {
    const list = P.filter(p => stageNum(p) === 2);
    if (!list.length) return `<header class="pt-head"><div><p class="pt-kicker">Close the day</p><h1>Close the day</h1></div></header><p class="pt-empty">No Activated projects to close. Closed projects are under Impact.</p>`;
    const p = list.find(x => x.slug === (slug || csel)) || list[0]; csel = p.slug;
    const c = clOf(p), d = dayOf(p.slug), future = d.date && daysTo(d.date) > 0;
    const spent = c.costs.reduce((t, x) => t + num(x.real), 0), planned = budget(p).goal || c.costs.reduce((t, x) => t + num(x.plan), 0), diff = planned - spent;
    const done = [c.happened && num(c.children) > 0, c.costs.length > 0 && c.costs.every(x => x.receipt), c.exp.every(x => x.result), c.story.trim().length > 40 && (!c.photos || c.consent), true];
    const pane = [
      `<h2>How did the day go?</h2>
       <label class="pt-check"><input type="checkbox" data-c="happened" ${c.happened ? "checked" : ""}><span>The day happened as planned</span></label>
       <div class="pt-2" style="margin-top:10px">
         <label class="pt-field">Children who came<input type="number" min="0" data-c="children" value="${esc(c.children)}"></label>
         <label class="pt-field">Volunteers who came<input type="number" min="0" data-c="volunteers" value="${esc(c.volunteers)}"></label>
         <label class="pt-field">Families or carers<input type="number" min="0" data-c="families" value="${esc(c.families)}"></label></div>
       <label class="pt-field">Anything the team should know<textarea rows="3" data-c="notes" placeholder="Short notes for the team (not shown on the website)">${esc(c.notes)}</textarea></label>
       <label class="pt-check"><input type="checkbox" data-c="incident" ${c.incident ? "checked" : ""}><span>Something went wrong or someone was hurt</span></label>
       ${c.incident ? `<p class="pt-private">This must be written up as a report so the safeguarding lead can follow it up. <a href="#/reports">Open Reports &amp; feedback →</a></p>` : ""}`,
      `<h2>What was really spent</h2>
       <p class="pt-sub" style="margin:0 0 10px">Planned against real. Tick when the receipt is kept. Visitors see the real costs as "Where the money went".</p>
       <div class="pt-costs"><div class="pt-costs-h"><span>Item</span><span>Planned</span><span>Real</span><span>Receipt</span></div>
       ${c.costs.map((x, k) => `<div class="pt-costs-r"><input data-ci="${k}" data-k="item" value="${esc(x.item)}" aria-label="Item"><span class="pt-planned">${money(x.plan)}</span><span class="pt-money"><i>$</i><input data-ci="${k}" data-k="real" value="${esc(x.real)}" inputmode="decimal" aria-label="Real cost"></span><label class="pt-rc"><input type="checkbox" data-rc="${k}" ${x.receipt ? "checked" : ""} aria-label="Receipt kept"></label></div>`).join("")}</div>
       <button type="button" class="pt-btn ghost" data-addcost>+ Add a cost</button>
       <p class="pt-total"><span>Total spent</span><b>${money(spent)} <small class="pt-sub">of ${money(planned)} raised</small></b></p>
       ${diff > 0 ? `<div class="pt-left"><b>${money(diff)} left over.</b> Where does it go?
         <label class="pt-check"><input type="radio" name="lo" value="next" ${c.leftover === "next" ? "checked" : ""}><span>To the next project (shown on the website)</span></label>
         <label class="pt-check"><input type="radio" name="lo" value="return" ${c.leftover === "return" ? "checked" : ""}><span>Returned to the sponsors</span></label></div>`
       : diff < 0 ? `<p class="pt-private">Spent ${money(-diff)} more than raised. Say who covered it in the team notes.</p>` : ""}`,
      `<h2>Did the day deliver?</h2>
       <p class="pt-sub" style="margin:0 0 10px">The organizers' expectations. Visitors see each result with a short note.</p>
       ${c.exp.length ? c.exp.map((x, k) => `<div class="pt-expc"><p>${esc(x.text)}</p>
         <div class="pt-seg" role="radiogroup">${[["met", "Met"], ["partly", "Partly"], ["not", "Not met"]].map(([v, l]) => `<button type="button" role="radio" aria-checked="${x.result === v}" class="r-${v}" data-er="${k}" data-v="${v}">${l}</button>`).join("")}</div>
         <input data-en="${k}" value="${esc(x.note)}" placeholder="Short note, e.g. what happened" aria-label="Note"></div>`).join("") : `<p class="pt-empty">No expectations were set for this project.</p>`}
       ${c.feedback ? `<p class="pt-sub">The organizers also get the "How did we do?" form today.</p>` : ""}`,
      `<h2>Tell the story</h2>
       <label class="pt-field">Headline<input data-c="title" value="${esc(c.title)}" placeholder="e.g. Twenty-five children saw the sea"></label>
       <label class="pt-field">What happened<textarea rows="7" data-c="story" placeholder="Who came, what they did, the moments to remember.">${esc(c.story)}</textarea><small>${c.story.trim().length < 40 ? "A few sentences at least." : "Looks good."}</small></label>
       <div class="pt-upload"><button type="button" class="pt-btn ghost" data-addph>+ Add pictures</button><span>${c.photos ? `${c.photos} picture${c.photos > 1 ? "s" : ""} added` : "No pictures yet"}</span></div>
       ${c.photos ? `<div class="pt-thumbs">${Array.from({ length: c.photos }, (_, k) => `<span style="background-image:url(${esc(p.cover || "")})"><i>${k + 1}</i></span>`).join("")}</div>
       <label class="pt-check"><input type="checkbox" data-c="consent" ${c.consent ? "checked" : ""}><span>Every child who can be recognised has photo consent</span></label>` : ""}
       <label class="pt-field" style="margin-top:10px">Video link (YouTube)<input data-c="video" value="${esc(c.video)}" placeholder="https://youtu.be/..."></label>`,
      `<h2>Ready to publish</h2>
       <ul class="pt-sum">
         <li class="${done[0] ? "ok" : ""}"><b>${num(c.children) || "?"} children</b>, ${num(c.volunteers) || "?"} volunteers${num(c.families) ? `, ${num(c.families)} families` : ""}</li>
         <li class="${done[1] ? "ok" : ""}"><b>${money(spent)} spent</b> of ${money(planned)}${diff > 0 ? ` · ${money(diff)} ${c.leftover === "next" ? "to the next project" : "returned"}` : ""}${done[1] ? "" : " · receipts missing"}</li>
         <li class="${done[2] ? "ok" : ""}"><b>${c.exp.filter(x => x.result === "met").length} of ${c.exp.length}</b> expectations met</li>
         <li class="${done[3] ? "ok" : ""}"><b>Story</b> ${c.title ? "“" + esc(c.title) + "”" : "not written yet"}${c.photos ? ` · ${c.photos} pictures` : ""}</li></ul>
       <label class="pt-check"><input type="checkbox" data-c="thank" ${c.thank ? "checked" : ""}><span>Email the story to the sponsors with a thank-you</span></label>
       <label class="pt-check"><input type="checkbox" data-c="feedback" ${c.feedback ? "checked" : ""}><span>Send the organizers the "How did we do?" form</span></label>
       <button type="button" class="pt-btn" data-publishday ${done.slice(0, 4).every(Boolean) ? "" : "disabled"} style="margin-top:12px">Publish and move to Impact</button>
       ${done.slice(0, 4).every(Boolean) ? "" : `<p class="pt-sub">Finish the steps marked above first.</p>`}`
    ];
    return `
      <header class="pt-head"><div><p class="pt-kicker">Close the day</p><h1>${esc(p.title)}</h1>
        <p class="pt-sub">${d.date ? new Date(d.date + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : ""}</p></div>
        ${list.length > 1 ? `<select class="pt-sel" data-csel aria-label="Project">${list.map(x => `<option value="${esc(x.slug)}" ${x === p ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select>` : ""}</header>
      ${future ? `<p class="pt-private">The day is in ${daysTo(d.date)} days. You can close it once it has happened (in this preview you can try it now).</p>` : ""}
      <ol class="pt-wiz">${CSTEPS.map((l, k) => `<li><button type="button" data-cs="${k}" class="${k === c.step ? "now" : done[k] && k < 4 ? "done" : ""}"><i>${done[k] && k < 4 ? "✓" : k + 1}</i><span>${l}</span></button></li>`).join("")}</ol>
      <section class="pt-card pt-wpane">${pane[c.step]}
        <div class="pt-wnav">${c.step ? `<button type="button" class="pt-btn ghost" data-cprev>‹ Back</button>` : "<span></span>"}${c.step < 4 ? `<button type="button" class="pt-btn" data-cnext>Next ›</button>` : ""}</div></section>`;
  }
  function wireClose() {
    const sel = app.querySelector("[data-csel]"); if (sel) sel.onchange = () => { csel = sel.value; render(); };
    const p = P.find(x => x.slug === csel); if (!p || stageNum(p) !== 2) return; const c = clOf(p);
    const nums = ["children", "volunteers", "families"];
    app.querySelectorAll("[data-c]").forEach(el => el.onchange = () => { const k = el.dataset.c; c[k] = el.type === "checkbox" ? el.checked : nums.includes(k) ? num(el.value) : el.value; render(); });
    app.querySelectorAll("[data-cs]").forEach(b => b.onclick = () => { c.step = +b.dataset.cs; render(); });
    const nx = app.querySelector("[data-cnext]"); if (nx) nx.onclick = () => { c.step++; render(); window.scrollTo(0, 0); };
    const pv = app.querySelector("[data-cprev]"); if (pv) pv.onclick = () => { c.step--; render(); window.scrollTo(0, 0); };
    app.querySelectorAll("[data-ci]").forEach(el => el.onchange = () => { const x = c.costs[+el.dataset.ci]; x[el.dataset.k] = el.dataset.k === "real" ? num(el.value) : el.value; render(); });
    app.querySelectorAll("[data-rc]").forEach(el => el.onchange = () => { c.costs[+el.dataset.rc].receipt = el.checked; render(); });
    const ac = app.querySelector("[data-addcost]"); if (ac) ac.onclick = () => { c.costs.push({ item: "", plan: 0, real: 0, receipt: false }); render(); };
    app.querySelectorAll('input[name="lo"]').forEach(r => r.onchange = () => { c.leftover = r.value; render(); });
    app.querySelectorAll("[data-er]").forEach(b => b.onclick = () => { c.exp[+b.dataset.er].result = b.dataset.v; render(); });
    app.querySelectorAll("[data-en]").forEach(el => el.onchange = () => { c.exp[+el.dataset.en].note = el.value; });
    const ph = app.querySelector("[data-addph]"); if (ph) ph.onclick = () => { c.photos = Math.min(12, c.photos + 3); render(); toast("Pictures added (demo)"); };
    const pub = app.querySelector("[data-publishday]"); if (pub) pub.onclick = () => {
      const d = dayOf(p.slug);
      p.status = "Complete";
      p.budget = c.costs.filter(x => x.item).map(x => ({ item: x.item, amount: num(x.real) }));
      p.expectations = c.exp.map(x => ({ text: x.text, result: x.result, note: x.note }));
      p.impact = [{ value: String(num(c.children)), label: "children" }, ...(num(c.families) ? [{ value: String(num(c.families)), label: "families" }] : []), { value: String(num(c.volunteers)), label: "volunteers" }];
      p.updates = [{ date: d.date || NOW.toISOString().slice(0, 10), title: c.title || "The day", body: c.story }, ...(p.updates || [])];
      D.activity.unshift({ at: NOW.toISOString(), text: `${p.title} closed and moved to Impact` });
      location.hash = `#/projects/${p.slug}`; toast(`Published: ${p.title} is now under Impact (demo)`);
    };
  }

  // ---------- People (community database) ----------
  // Adults only, and only with their consent. Children are never stored here.
  const ROLES = ["Sponsor", "Volunteer", "Organizer", "Trusted contact", "Subscriber", "Team"];
  const RCLS = { Sponsor: "r-sp", Volunteer: "r-vo", Organizer: "r-or", "Trusted contact": "r-tc", Subscriber: "r-su", Team: "r-te" };
  let pefilter = "All", pequery = "", peopen = null;
  function historyOf(x) { // what this person has done, from the other screens
    const h = [];
    D.pledges.filter(y => y.name === x.name).forEach(y => h.push([y.pledged, `Pledged ${money(y.amount)} to ${projOf(y.project).title}${y.status === "received" ? " · received" : " · waiting"}`]));
    Object.entries(D.days).forEach(([slug, d]) => d.volunteers.filter(v => v.name === x.name || x.name.startsWith(v.name + " ")).forEach(v => h.push([d.date, `Volunteer (${v.role}) · ${projOf(slug).title}`])));
    D.suggestions.filter(s2 => s2.contact === x.name).forEach(s2 => h.push([s2.received.slice(0, 10), `Suggested: ${s2.title}`]));
    h.push([x.joined, `Joined · ${x.how}`]);
    return h.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  }
  function people() {
    const q = pequery.toLowerCase();
    const list = D.people.filter(x => (pefilter === "All" || x.roles.includes(pefilter)) && (!q || (x.name + " " + x.city + " " + x.how).toLowerCase().includes(q)));
    const cnt = r => D.people.filter(x => x.roles.includes(r)).length, post = D.people.filter(x => x.consent.post).length;
    return `
      <header class="pt-head"><div><p class="pt-kicker">People</p><h1>Our community</h1>
        <p class="pt-sub">Everyone who has given, volunteered, suggested a project or signed up. Adults only, and only with their consent.</p></div>
        <div class="pt-actions-row"><button type="button" class="pt-btn ghost" data-export>Download list</button><button type="button" class="pt-btn" data-addpe>+ Add a person</button></div></header>
      <section class="pt-stats">
        <div class="pt-stat st1"><b>${D.people.length}</b><span>People</span></div>
        <div class="pt-stat st2"><b>${cnt("Sponsor")}</b><span>Sponsors</span></div>
        <div class="pt-stat s1"><b>${cnt("Volunteer")}</b><span>Volunteers</span></div>
        <div class="pt-stat st3"><b>${post}</b><span>Get the Raavanaa Post</span></div>
      </section>
      <form class="pt-card pt-plform" id="pt-peform" hidden>
        <h2>Add a person</h2>
        <div class="pt-2">
          <label class="pt-field">Name<input name="name" required></label>
          <label class="pt-field">Email or phone<input name="contact"></label>
          <label class="pt-field">City<input name="city" placeholder="e.g. Toronto, Jaffna"></label>
          <label class="pt-field">How they found us<select name="how"><option>Bowling night</option><option>Friend of a member</option><option>Website</option><option>Visit</option><option>Event</option></select></label>
          <label class="pt-field">Language<select name="lang"><option>English</option><option>Tamil</option></select></label>
        </div>
        <div class="pt-rolepick">${ROLES.filter(r => r !== "Team").map(r => `<label><input type="checkbox" name="roles" value="${r}"><span class="pt-role ${RCLS[r]}">${r}</span></label>`).join("")}</div>
        <label class="pt-check"><input type="checkbox" name="ok" required><span>They agreed that we keep their details to contact them about Raavanaa</span></label>
        <label class="pt-check"><input type="checkbox" name="post"><span>They want the monthly Raavanaa Post</span></label>
        <div class="pt-actions-row" style="margin-top:12px"><button class="pt-btn" type="submit">Save</button><button class="pt-btn ghost" type="button" data-cancelpe>Cancel</button></div>
      </form>
      <div class="pt-tools">
        <div class="pt-chips" role="group" aria-label="Show">${["All", ...ROLES].map(r => `<button type="button" data-pe="${r}" aria-pressed="${pefilter === r}">${r}${r !== "All" ? ` <b>${cnt(r)}</b>` : ""}</button>`).join("")}</div>
        <input class="pt-search" type="search" placeholder="Search name, city or how they found us" value="${esc(pequery)}" aria-label="Search people">
      </div>
      <ul class="pt-list big">${list.map(x => `<li class="pt-person ${peopen === x.id ? "open" : ""}">
        <button type="button" class="pt-row" data-peo="${x.id}" aria-expanded="${peopen === x.id}">
          <span class="pt-av">${esc(initials(x.name))}</span>
          <span class="pt-row-main"><b>${esc(x.name)}</b><small>${esc(x.city)} · ${esc(x.how)}${x.lang === "Tamil" ? " · தமிழ்" : ""}</small></span>
          <span class="pt-roles">${x.roles.map(r => `<span class="pt-role ${RCLS[r]}">${r}</span>`).join("")}</span></button>
        ${peopen === x.id ? `<div class="pt-pdetail">
          <dl class="pt-facts"><div><dt>Contact</dt><dd>${x.contact ? esc(x.contact) : "Not given"}</dd></div><div><dt>Joined</dt><dd>${fmtD(x.joined)}</dd></div>
            <div><dt>May we contact them</dt><dd>${x.consent.contact ? "Yes" : "No"}</dd></div><div><dt>Raavanaa Post</dt><dd><label class="pt-check"><input type="checkbox" data-post="${x.id}" ${x.consent.post ? "checked" : ""}><span>${x.consent.post ? "Subscribed" : "Not subscribed"}</span></label></dd></div></dl>
          <h3 class="pt-h2">History</h3><ul class="pt-feed">${historyOf(x).map(([d2, t]) => `<li><time>${fmtD(d2)}</time><span>${esc(t)}</span></li>`).join("")}</ul>
          <div class="pt-actions-row" style="margin-top:10px">${x.contact && x.consent.contact ? `<a class="pt-btn ghost sm" href="${/@/.test(x.contact) ? "mailto:" : "tel:"}${esc(x.contact.replace(/\s/g, ""))}">Contact</a>` : ""}<button type="button" class="pt-btn ghost danger sm" data-forget="${x.id}">Delete their details</button></div>
        </div>` : ""}</li>`).join("") || `<li class="pt-empty">Nobody matches.</li>`}</ul>`;
  }
  function wirePeople() {
    app.querySelectorAll("[data-pe]").forEach(b => b.onclick = () => { pefilter = b.dataset.pe; render(); });
    const q = app.querySelector(".pt-search");
    q.oninput = () => { pequery = q.value.trim(); const pos = q.selectionStart; render(); const n = app.querySelector(".pt-search"); n.focus(); n.setSelectionRange(pos, pos); };
    app.querySelectorAll("[data-peo]").forEach(b => b.onclick = () => { peopen = peopen === b.dataset.peo ? null : b.dataset.peo; render(); });
    app.querySelectorAll("[data-post]").forEach(c => c.onchange = () => { D.people.find(x => x.id === c.dataset.post).consent.post = c.checked; render(); });
    app.querySelectorAll("[data-forget]").forEach(b => b.onclick = () => { if (!confirm("Delete this person's details? Their pledges stay in the accounts under their name.")) return; D.people = D.people.filter(x => x.id !== b.dataset.forget); peopen = null; render(); toast("Details deleted (demo)"); });
    const form = app.querySelector("#pt-peform");
    app.querySelector("[data-addpe]").onclick = () => { form.hidden = false; form.querySelector("[name=name]").focus(); };
    app.querySelector("[data-cancelpe]").onclick = () => { form.hidden = true; };
    form.onsubmit = e => { e.preventDefault(); const f = new FormData(form); const roles = f.getAll("roles"); if (!roles.length) { toast("Pick at least one role"); return; }
      D.people.unshift({ id: "pe-" + Date.now(), name: String(f.get("name")).trim(), roles, city: String(f.get("city") || ""), contact: String(f.get("contact") || ""), joined: NOW.toISOString().slice(0, 10), how: f.get("how"), lang: f.get("lang"), consent: { contact: true, post: !!f.get("post") } });
      render(); toast("Person added (demo)"); };
    app.querySelector("[data-export]").onclick = () => toast("Downloads a spreadsheet of everyone who agreed to be contacted (demo)");
  }

  // ---------- Team & logins ----------
  const PERMS = [
    ["See the dashboard, suggestions and projects", 1, 1, 0],
    ["Plan visits, edit projects, prepare and close days", 1, 1, 0],
    ["Record pledges and mark money received", 1, 1, 0],
    ["Publish to the website", 1, 0, 0],
    ["See People (contact details)", 1, 1, 0],
    ["See Reports & feedback", 1, 0, 1],
    ["Add or remove team members", 1, 0, 0]
  ];
  function team() {
    const lead = D.safeguard || "", rev = D.reviewer || "";
    return `
      <header class="pt-head"><div><p class="pt-kicker">Team &amp; logins</p><h1>Who can do what</h1>
        <p class="pt-sub">Everyone signs in with their own email. Only the Admin publishes to the website.</p></div></header>
      <div class="pt-grid">
        <section class="pt-card"><h2>Team members <span class="pt-count">${D.members.length}</span></h2>
          <ul class="pt-list">${D.members.map((m, k) => `<li class="pt-pl"><span class="pt-av">${esc(initials(m.name))}</span>
            <span class="pt-row-main"><b>${esc(m.name)}</b><small>${esc(m.email)} · ${m.pending ? "Invite sent" : "Active " + esc(m.active)}${m.twofa ? " · 2-step sign-in on" : ""}</small></span>
            <span class="pt-row-side"><select class="pt-sel sm" data-mrole="${k}" ${m.role === "Admin" ? "disabled" : ""} aria-label="Role">${["Admin", "Team", "Independent reviewer"].map(r => `<option ${m.role === r ? "selected" : ""}>${r}</option>`).join("")}</select>
            ${m.role === "Admin" ? "" : `<button type="button" class="pt-link" data-mdel="${k}">Remove</button>`}</span></li>`).join("")}</ul>
          <form class="pt-invite"><input name="name" placeholder="Name" required aria-label="Name"><input name="email" type="email" placeholder="Email" required aria-label="Email">
            <select name="role" aria-label="Role"><option>Team</option><option>Independent reviewer</option></select><button class="pt-btn" type="submit">Send invite</button></form>
        </section>
        <section class="pt-card"><h2>Safety roles</h2>
          <p class="pt-sub" style="margin:0 0 12px">Named publicly on the Report a concern page. Reports go to these two people.</p>
          <label class="pt-field">Safeguarding lead (from the team)<select data-safe><option value="">Not chosen yet</option>${D.members.filter(m => m.role !== "Independent reviewer").map(m => `<option ${lead === m.name ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label>
          <label class="pt-field">Independent reviewer (outside the project team)<select data-rev><option value="">Not chosen yet</option>${D.members.filter(m => m.role === "Independent reviewer").map(m => `<option ${rev === m.name ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>
            <small>${D.members.some(m => m.role === "Independent reviewer") ? "" : "Invite them first with the role Independent reviewer."}</small></label>
          ${lead && rev ? `<p class="pt-private" style="background:#e2efe6;color:#1f5f3a">Both roles are filled. The website will show their names.</p>` : `<p class="pt-private">Both roles must be filled before the site goes live.</p>`}
        </section>
      </div>
      <section class="pt-card" style="margin-top:14px"><h2>What each role can do</h2>
        <div class="pt-tablewrap"><table class="pt-perms"><thead><tr><th></th><th>Admin</th><th>Team</th><th>Independent reviewer</th></tr></thead>
        <tbody>${PERMS.map(([l, a, t, r]) => `<tr><td>${l}</td>${[a, t, r].map(v => `<td class="${v ? "y" : "n"}">${v ? "✓" : "–"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <p class="pt-sub">Anyone named in a report can never open it, whatever their role. Every change in the portal is logged with who made it.</p></section>`;
  }
  function wireTeam() {
    app.querySelectorAll("[data-mrole]").forEach(s2 => s2.onchange = () => { D.members[+s2.dataset.mrole].role = s2.value; render(); toast("Role changed (demo)"); });
    app.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { const m = D.members[+b.dataset.mdel]; if (!confirm(`Remove ${m.name}'s access?`)) return; D.members.splice(+b.dataset.mdel, 1); render(); toast("Access removed (demo)"); });
    app.querySelector(".pt-invite").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); D.members.push({ name: String(f.get("name")).trim(), email: String(f.get("email")).trim(), role: f.get("role"), active: "", pending: true, twofa: false }); render(); toast("Invite sent (demo)"); };
    app.querySelector("[data-safe]").onchange = e => { D.safeguard = e.target.value; render(); };
    app.querySelector("[data-rev]").onchange = e => { D.reviewer = e.target.value; render(); };
  }

  function render() {
    const [page, id] = route();
    const cur = ["suggestions", "reports", "projects", "sponsors", "day", "close", "people", "team"].includes(page) ? page : "dashboard";
    drawNav(cur);
    if (page === "suggestions" && id) { app.innerHTML = detail(id); wireDetail(id); }
    else if (page === "suggestions") { app.innerHTML = suggestions(); wireSuggestions(); }
    else if (page === "people") { app.innerHTML = people(); wirePeople(); }
    else if (page === "team") { app.innerHTML = team(); wireTeam(); }
    else if (page === "close") { app.innerHTML = closeDay(id); wireClose(); }
    else if (page === "day") { app.innerHTML = dayPrep(id); wireDay(); }
    else if (page === "sponsors") { app.innerHTML = sponsors(); wireSponsors(); }
    else if (page === "projects" && id) { app.innerHTML = editor(id); wireEditor(id); }
    else if (page === "projects") { app.innerHTML = projects(); wireProjects(); }
    else if (page === "reports" && id) { app.innerHTML = reportDetail(id); wireReport(id); }
    else if (page === "reports") { app.innerHTML = reports(); wireReports(); }
    else app.innerHTML = dashboard();
    document.title = `${{ suggestions: "Suggestions", reports: "Reports & feedback", projects: "Projects", sponsors: "Sponsors & pledges", day: "Day preparation", close: "Close the day", people: "People", team: "Team & logins" }[page] || "Dashboard"} · Team Portal · Raavanaa`;
  }

  Promise.all([fetch("/portal-demo.json").then(r => r.json()), fetch("/projects.json").then(r => r.json()).catch(() => ({ projects: [] }))])
    .then(([d, p]) => {
      D = d; P = (p.projects || []).filter(x => !x.hidden);
      P.filter(x => stageNum(x) === 2 && D.days[x.slug]).forEach(syncDay);
      window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
      render();
    })
    .catch(() => { app.innerHTML = "<p>Could not load the portal preview.</p>"; });
})();
