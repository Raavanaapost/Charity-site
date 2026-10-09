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
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  const svg = (d, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const MENU = [
    ["dashboard", "Dashboard", true], ["suggestions", "Suggestions", true], ["projects", "Projects", false],
    ["sponsors", "Sponsors & pledges", false], ["day", "Day preparation", false], ["close", "Close the day", false],
    ["people", "People", false], ["team", "Team & logins", false]
  ];

  let D = null, P = [];
  const toast = msg => { const t = document.getElementById("pt-toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600); };
  const route = () => (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");

  function drawNav(cur) {
    const newCount = D.suggestions.filter(s => s.status === "new").length;
    document.getElementById("pt-nav").innerHTML = MENU.map(([k, l, ready]) => ready
      ? `<a href="#/${k}" class="${cur === k ? "on" : ""}" ${cur === k ? 'aria-current="page"' : ""}>${svg(ICON[k])}<span>${l}</span>${k === "suggestions" && newCount ? `<b class="pt-badge">${newCount}</b>` : ""}</a>`
      : `<span class="soon" title="Designed next">${svg(ICON[k])}<span>${l}</span><small>Next</small></span>`).join("");
    document.getElementById("pt-tabbar").innerHTML = [["dashboard", "Home"], ["suggestions", "Suggestions"], ["projects", "Projects"], ["more", "More"]].map(([k, l]) => {
      const ready = k === "dashboard" || k === "suggestions";
      return ready ? `<a href="#/${k}" class="${cur === k ? "on" : ""}">${svg(ICON[k], 22)}<span>${l}</span>${k === "suggestions" && newCount ? `<b class="pt-badge">${newCount}</b>` : ""}</a>`
        : `<button type="button" class="soon" data-soon>${svg(ICON[k], 22)}<span>${l}</span></button>`;
    }).join("");
    document.querySelectorAll("[data-soon]").forEach(b => b.onclick = () => toast("This screen is designed next."));
  }

  // ---------- Dashboard ----------
  function dashboard() {
    const st = [1, 2, 3].map(n => P.filter(p => stageNum(p) === n));
    const sNew = D.suggestions.filter(s => s.status === "new"), sVisit = D.suggestions.filter(s => s.status === "visit");
    const attention = [];
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
    if (s.status === "visit") return `${b("verified", "Visited · the need is real")}${b("declined", "Not suitable", "ghost danger")}`;
    if (s.status === "verified") return `${b("project", "Turn into a project")}<p class="pt-sub">Creates an Initiated project with these details. You add the picture, story and estimated costs next.</p>${b("declined", "Not suitable", "ghost danger")}`;
    if (s.status === "project") return `<p class="pt-sub">This suggestion is now an Initiated project. The project editor is designed next.</p>`;
    return `<p class="pt-sub">Marked not suitable. A kind reply is sent to the person who suggested it.</p>${b("new", "Reopen", "ghost")}`;
  }
  function wireDetail(id) {
    const s = D.suggestions.find(x => x.id === id); if (!s) return;
    const sel = app.querySelector("[data-assign]");
    sel.onchange = () => { s.assigned = sel.value; addNote(s, sel.value ? `${sel.value} is looking after this.` : "Nobody is looking after this now."); render(); toast("Saved (demo)"); };
    app.querySelectorAll("[data-act]").forEach(btn => btn.onclick = () => {
      const act = btn.dataset.act;
      if (act === "visit") { const v = app.querySelector("[data-visit]").value; s.visit = v; addNote(s, `Visit planned for ${fmtDay(v)}.`); }
      if (act === "verified") addNote(s, "Visited. The need is real.");
      if (act === "declined") addNote(s, "Marked not suitable.");
      if (act === "project") addNote(s, "Turned into an Initiated project.");
      if (act === "new") addNote(s, "Reopened.");
      s.status = act; render(); toast(`${STATUS[act].label} (demo)`);
    });
    app.querySelector(".pt-note-form").onsubmit = e => { e.preventDefault(); const t = e.target.querySelector("textarea").value.trim(); if (!t) return; addNote(s, t); render(); toast("Note added (demo)"); };
  }
  const addNote = (s, text) => s.notes.push({ by: D.user.name, at: NOW.toISOString(), text });

  function render() {
    const [page, id] = route();
    const cur = page === "suggestions" ? "suggestions" : "dashboard";
    drawNav(cur);
    if (page === "suggestions" && id) { app.innerHTML = detail(id); wireDetail(id); }
    else if (page === "suggestions") { app.innerHTML = suggestions(); wireSuggestions(); }
    else app.innerHTML = dashboard();
    document.title = `${page === "suggestions" ? "Suggestions" : "Dashboard"} · Team Portal · Raavanaa`;
  }

  Promise.all([fetch("/portal-demo.json").then(r => r.json()), fetch("/projects.json").then(r => r.json()).catch(() => ({ projects: [] }))])
    .then(([d, p]) => {
      D = d; P = (p.projects || []).filter(x => !x.hidden);
      window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
      render();
    })
    .catch(() => { app.innerHTML = "<p>Could not load the portal preview.</p>"; });
})();
