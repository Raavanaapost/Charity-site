/* Raavanaa Team Portal: DESIGN PREVIEW.
   Screens: Dashboard and Suggestions inbox (more to come). Uses the real projects.json for the stage numbers
   and portal-demo.json for invented suggestions. Changes live in memory only; a reload resets everything. */
(function () {
  "use strict";
  const app = document.getElementById("pt-app");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };
  const money = n => "$" + Math.round(n).toLocaleString("en-US");
  let NOW = new Date("2026-10-09T09:00"); // fixed "today" so the demo always reads the same
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
    approved: { label: "Approved", c: "s-approved" },
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
    circles: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="5" r="2"/><circle cx="5.5" cy="15" r="2"/><circle cx="18.5" cy="15" r="2"/>',
    volunteers: '<path d="M12 20s-6.5-4-6.5-9a3.6 3.6 0 0 1 6.5-2 3.6 3.6 0 0 1 6.5 2c0 5-6.5 9-6.5 9z"/><path d="M3 21h18"/>',
    champions: '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>',
    reports: '<path d="M12 3l8 3v6c0 4.6-3.3 8-8 9-4.7-1-8-4.4-8-9V6z"/><path d="M12 8v5M12 16h.01" stroke-width="2.2"/>',
    traffic: '<path d="M4 19V11M9.3 19V6M14.6 19v-5M20 19V9"/><path d="M3 21h18"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  const svg = (d, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const MENU = [
    ["dashboard", "Dashboard", true], ["suggestions", "Suggestions", true], ["projects", "Projects", true], ["reports", "Reports & feedback", true],
    ["sponsors", "Sponsors & pledges", true], ["day", "Day preparation", true], ["close", "Close the day", true],
    ["people", "People", true], ["champions", "Champions", true], ["volunteers", "Volunteers", true], ["circles", "Family circles", true], ["traffic", "Traffic", true], ["team", "Team & logins", true]
  ];

  let D = null, P = [], C = { list: [], districts: [] }, chDistrict = "All", chEdit = null;
  // People who filled in "I'd like to give" on the website (live only; null in the demo).
  let ASKS = null;
  const toast = msg => { const t = document.getElementById("pt-toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600); };
  const route = () => (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");

  function drawNav(cur) {
    const newCount = D.suggestions.filter(s => s.status === "new").length, openRep = D.reports.filter(r => r.status !== "closed").length;
    const newAsk = ASKS ? ASKS.filter(x => x.status === "new").length : 0;
    const so = document.querySelector(".pt-site");
    // Laptop sidebar foot (20 Nov 2026): who is signed in, View the website and Sign out kept together and lined up.
    if (so && LIVE && !document.getElementById("pt-signout")) {
      const foot = document.createElement("div"); foot.className = "pt-sidefoot";
      foot.innerHTML = `<span class="pt-who">${esc(ME.name)}<small>${ME.admin ? "Admin" : "Team"}</small></span>`;
      so.replaceWith(foot); foot.appendChild(so);
      const b = document.createElement("button"); b.id = "pt-signout"; b.type = "button"; b.className = "pt-site pt-signout"; b.innerHTML = `${svg('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>', 16)}<span>Sign out</span>`; b.onclick = signOut; foot.appendChild(b);
    }
    document.getElementById("pt-nav").innerHTML = MENU.map(([k, l, ready]) => ready
      ? `<a href="#/${k}" class="${cur === k ? "on" : ""}" ${cur === k ? 'aria-current="page"' : ""}>${svg(ICON[k])}<span>${l}</span>${k === "sponsors" && newAsk ? `<b class="pt-badge">${newAsk}</b>` : k === "suggestions" && newCount ? `<b class="pt-badge">${newCount}</b>` : k === "reports" && openRep ? `<b class="pt-badge">${openRep}</b>` : ""}</a>`
      : `<span class="soon" title="Designed next">${svg(ICON[k])}<span>${l}</span><small>Next</small></span>`).join("");
    document.getElementById("pt-tabbar").innerHTML = [["dashboard", "Home"], ["suggestions", "Suggestions"], ["projects", "Projects"], ["reports", "Reports"], ["more", "More"]].map(([k, l]) => {
      const ready = k !== "more";
      return ready ? `<a href="#/${k}" class="${cur === k ? "on" : ""}">${svg(ICON[k], 22)}<span>${l}</span>${k === "sponsors" && newAsk ? `<b class="pt-badge">${newAsk}</b>` : k === "suggestions" && newCount ? `<b class="pt-badge">${newCount}</b>` : k === "reports" && openRep ? `<b class="pt-badge">${openRep}</b>` : ""}</a>`
        : `<button type="button" class="${["sponsors", "day", "close", "people", "champions", "volunteers", "circles", "traffic", "team"].includes(cur) ? "on" : ""}" data-soon>${svg(ICON[k], 22)}<span>${l}</span></button>`;
    }).join("");
    document.querySelectorAll("[data-soon]").forEach(b => b.onclick = () => {
      let m = document.getElementById("pt-more");
      if (m) { m.remove(); return; }
      m = document.createElement("div"); m.id = "pt-more"; m.className = "pt-more-menu";
      m.innerHTML = MENU.filter(([k]) => !["dashboard", "suggestions", "projects", "reports"].includes(k)).map(([k, l]) => `<a href="#/${k}">${svg(ICON[k])}<span>${l}</span></a>`).join("") + (LIVE ? `<a href="#" data-so>${svg(ICON.team)}<span>Sign out</span></a>` : "");
      const so2 = m.querySelector("[data-so]"); if (so2) so2.onclick = e => { e.preventDefault(); signOut(); };
      document.body.appendChild(m); m.addEventListener("click", () => m.remove());
    });
  }

  // ---------- Dashboard ----------
  function dashboard() {
    const st = [1, 2, 3].map(n => P.filter(p => stageNum(p) === n));
    const sNew = D.suggestions.filter(s => s.status === "new"), sVisit = D.suggestions.filter(s => s.status === "visit");
    const attention = [];
    D.reports.filter(r => r.status !== "closed").forEach(r => attention.push({ c: "a-report", t: `${r.type === "concern" ? LEVEL[r.level].label : "Feedback needs a look"} · ${r.status === "open" ? "not yet picked up" : "being looked into"}`, s: r.type === "concern" ? `Report: ${r.about}` : "Visit feedback", href: `#/reports/${r.id}` }));
    if (ASKS) ASKS.filter(x => x.status === "new").forEach(x => attention.push({ c: "a-fund", t: `${esc(x.name)} would like to give · waiting for a personal reply`, s: `${x.amount || "Amount not said"} → ${x.kind === "member" ? "every month" : x.project ? projOf(x.project).title : "the Raavanaa Fund"}`, href: "#/sponsors" }));
    D.pledges.filter(x => x.status === "pledged").forEach(x => attention.push({ c: "a-fund", t: `Pledge of ${money(x.amount)} · waiting to receive`, s: x.name + " → " + projOf(x.project).title, href: "#/sponsors" }));
    sNew.filter(s => !s.assigned).forEach(s => attention.push({ c: "a-new", t: `New · waiting for someone to take it`, s: s.title, href: `#/suggestions/${s.id}` }));
    sVisit.forEach(s => attention.push({ c: "a-visit", t: `Visit on ${fmtDay(s.visit)} · ${esc(s.assigned)}`, s: s.title, href: `#/suggestions/${s.id}` }));
    sNew.filter(s => s.assigned).forEach(s => { const d = callDue(s); if (d) attention.push({ c: d.late ? "a-report" : "a-new", t: `${d.text} · ${esc(s.assigned)}`, s: det(s).title || s.title, href: `#/suggestions/${s.id}` }); });
    D.suggestions.filter(s => s.status === "verified").forEach(s => attention.push({ c: "a-init", t: `Verified by ${esc(s.verifiedBy || s.assigned || "the team")} · waiting for approval`, s: det(s).title || s.title, href: `#/suggestions/${s.id}` }));
    D.suggestions.filter(s => s.status === "approved").forEach(s => attention.push({ c: "a-fund", t: planDone(s) ? "Approved · ready to create the project" : "Approved · add the budget and expectations", s: det(s).title || s.title, href: `#/suggestions/${s.id}` }));
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
        <div class="pt-actions-row"><a class="pt-btn ghost" href="#/suggestions">Open suggestions</a><a class="pt-btn ghost" href="#/traffic">${svg(ICON.traffic, 18)} Traffic</a></div></header>
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
  const howMany = v => /^\d+$/.test(String(v || "")) ? `${v} children` : String(v || "");
  const rowHTML = s => { const d = callDue(s), m = s.status === "new" && s.called ? callMissing(s) : [];
    return `<li><a class="pt-row" href="#/suggestions/${s.id}">
      <span class="pt-row-main"><b>${esc(det(s).title || s.title)}</b><small>${esc(s.category || s.kind || "")} · ${esc(s.village || s.location.split(",")[0])} · ${esc(howMany(s.children))}</small>
        ${d ? `<em class="pt-due ${d.late ? "late" : ""}">${d.text}</em>` : ""}${m.length ? `<em class="pt-miss">Missing ${m.length}</em>` : ""}${(s.endorsements || []).length ? `<em class="pt-due">${vouch(s).backed ? "Community-backed" : `Vouched ${s.endorsements.length} of ${s.vouchesNeeded || 3}`}</em>` : ""}</span>
      <span class="pt-row-side"><span class="pt-pill ${STATUS[s.status].c}">${STATUS[s.status].label}</span><time>${ago(s.received)}</time></span></a></li>`; };
  let filter = "new", query = "";
  function suggestions() {
    const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, D.suggestions.filter(s => s.status === k).length]));
    const tabs = [["new", "New"], ["visit", "Visit planned"], ["verified", "Waiting for approval"], ["approved", "Approved"], ["declined", "Not suitable"], ["all", "All"]];
    const list = D.suggestions.filter(s => (filter === "all" || s.status === filter) && (!query || (s.title + " " + s.location + " " + s.category).toLowerCase().includes(query)));
    return `
      <header class="pt-head"><div><p class="pt-kicker">Suggestions</p><h1>Suggestions inbox</h1>
        <p class="pt-sub">Everything sent through the Create a Moment form. Six steps take each one to an Initiated project.</p></div></header>
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

  // ---------- Request check: files by kind, the AI draft, what's missing, and approval for sharing ----------
  const KINDS = [["document", "Documents"], ["image", "Images"], ["video", "Video"], ["audio", "Voice notes"]];
  const AI_LABEL = { "": ["Not checked yet", "gray"], running: ["AI check running…", "amber"], done: ["AI draft ready", "blue"], failed: ["AI check failed", "red"] };
  const profileOf = s => {
    const p = s.profile || {}, d = (s.ai && s.ai.draft) || {};
    const lines = (d.budget_items || []).map(x => `${x.item}: ${x.amount}`).join("\n");
    return { title: p.title || d.title || s.title || "", tagline: p.tagline || d.tagline || "", summary: p.summary || d.full_story || s.description || d.summary || "", impact: p.impact || d.impact || "", activity: p.activity || d.activity || s.kind || "",
      place: p.place || d.place || [s.village, s.city].filter(Boolean).join(", "), children: p.children || d.children || howMany(s.children), when: p.when || d.when || "",
      budget: p.budget || lines, budget_total: p.budget_total || d.budget_total || "" };
  };
  const reviewHTML = s => {
    const ai = s.ai || { status: "", draft: {} }, d = ai.draft || {}, files = s.files || [];
    const [lab, tone] = s.shareOk ? ["Approved for sharing", "green"] : AI_LABEL[ai.status] || AI_LABEL[""];
    const counts = KINDS.map(([k, l]) => { const n = files.filter(f => (f.kind || "document") === k).length; return `<span class="pt-kind ${n ? "" : "none"}">${l} <b>${n}</b></span>`; }).join("");
    const miss = d.missing || [], conc = d.concerns || [], pf = profileOf(s);
    const inp = (k, l, area) => `<label class="pt-pf"><span>${l}</span>${area ? `<textarea rows="4" data-pf="${k}">${esc(pf[k])}</textarea>` : `<input data-pf="${k}" value="${esc(pf[k])}">`}</label>`;
    return `<section class="pt-card pt-review">
      <h2>Request check <span class="pt-pill ${tone}">${lab}</span></h2>
      <div class="pt-kinds">${counts}</div>
      ${ai.status === "failed" ? `<p class="pt-flag red">${esc(ai.error || "The AI check did not finish.")}</p>` : ""}
      ${ai.status === "running" ? `<p class="pt-sub">Gemini is reading the request and its files. This can take up to 5 minutes. Reload the page to see the result.</p>` : ""}
      <p><button type="button" class="pt-btn ${ai.status === "done" ? "ghost" : ""}" data-ai ${ai.status === "running" && ai.mine ? "disabled" : ""}>${ai.status === "done" ? "Run the AI check again" : "Run the AI check"}</button>
        ${ai.at && ai.status === "done" ? `<span class="pt-sub">Checked ${ago(ai.at)}${d._model ? ` · ${esc(d._model)}` : ""}</span>` : ""}</p>
      ${ai.status === "done" ? `
        <h3>Missing <span class="pt-count">${miss.length}</span></h3>
        ${miss.length ? `<ul class="pt-flags">${miss.map(m => `<li class="pt-flag red"><b>${esc(m.field)}</b> ${esc(m.why)}</li>`).join("")}</ul>` : `<p class="pt-sub">Nothing missing.</p>`}
        ${conc.length ? `<h3>Concerns</h3><ul class="pt-flags">${conc.map(c => `<li class="pt-flag amber">${esc(c)}</li>`).join("")}</ul>` : ""}
        ${(d.files || []).length ? `<h3>What the files show</h3><ul class="pt-what">${d.files.map(f => `<li><b>${esc(f.name)}</b> <small>${esc(f.kind)}</small><br>${esc(f.what)}</li>`).join("")}</ul>` : ""}
        ${(d._skipped || []).length ? `<p class="pt-flag amber">Too big for the AI check, please look yourself: ${esc(d._skipped.join(", "))}</p>` : ""}
        ${(d.transcripts || []).map(t => `<details class="pt-tr"><summary>Voice note: ${esc(t.file)} (${esc(t.language)})</summary><p>${esc(t.english)}</p>${t.original && t.original !== t.english ? `<p class="pt-sub">${esc(t.original)}</p>` : ""}</details>`).join("")}
        ${(d.people || []).length ? `<h3>People named</h3><p class="pt-sub">${d.people.map(x => `${esc(x.name)} (${esc(x.role)})`).join(" · ")}</p>` : ""}` : ""}
      <h3>The page people will see</h3>
      <p class="pt-sub">Check every line. No children's names. The school's name is fine.</p>
      <div class="pt-pfs">${inp("title", "Title")}${inp("tagline", "One line under the title")}${inp("summary", "The story: everything they wrote, without children's names (a blank line starts a new paragraph)", true)}${inp("impact", "The impact it will make (2 to 4 sentences, from what they wrote)", true)}${inp("activity", "The day")}${inp("place", "Place")}${inp("children", "Children")}${inp("when", "When")}${inp("budget", "Budget, one item per line, e.g. Bus: Rs 30,000", true)}${inp("budget_total", "Total, e.g. Rs 61,000")}</div>
      ${s.openVouch ? approveHTML(s) : s.shareOk
        ? `<p class="pt-sub">Approved by ${esc(s.shareOkBy || "the team")}${s.shareOkAt ? ` ${ago(s.shareOkAt)}` : ""}. The requester can share it now.</p>
           <p><button type="button" class="pt-btn" data-share="save">Save changes</button> <button type="button" class="pt-btn ghost" data-share="stop">Stop sharing</button></p>`
        : `<p><button type="button" class="pt-btn" data-share="yes">Approve page for sharing</button></p>`}
      ${s.openVouch ? "" : goLiveHTML(s)}
      ${messagesHTML(s)}
      ${s.endorseLink ? `<p><button type="button" class="pt-btn ghost" data-preview>Preview the page</button></p>
        <p class="pt-sub">Page: <a href="${esc(s.endorseLink)}" target="_blank" rel="noopener">raavanaa.org${esc(s.endorseLink)}</a></p>` : ""}
    </section>`;
  };
  // The simple path (SURESH 20 Nov 2026): make the page, send it to the person in charge, their vouch puts it live.
  // Open requests (nobody to vouch): an admin presses Publish now.
  const digits = v => String(v || "").replace(/\D/g, "").replace(/^0(?=7\d{8}$)/, "94");
  // While one vouch is enough (request-project.mts switch), the old six steps and, for open requests, the vouch card
  // are hidden: make the page, then Publish now or wait for the person in charge (SURESH 20 Nov 2026).
  const simpleFlow = s => s.openVouch || (s.vouchesNeeded === 1 && !s.vouchNeedsRole);
  // "We received your request" and "Your project is listed" (SURESH 21 Nov 2026). Email goes by itself once email
  // sending is on; WhatsApp is a tap here until there is an automatic WhatsApp sender.
  function messagesHTML(s) {
    const m = s.messages || {}; if (!m.received) return "";
    const row = x => `<li><b>${esc(x.to.name || x.to.who)}</b> <small>${esc(x.to.who)}</small>
      <span class="pt-golive-btns">${x.to.phone ? `<a class="pt-btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${digits(x.to.phone)}?text=${encodeURIComponent(x.text)}">WhatsApp</a>` : ""}
      ${x.to.email ? ` <a class="pt-btn ghost sm" href="mailto:${esc(x.to.email)}?subject=${encodeURIComponent(x.subject)}&body=${encodeURIComponent(x.text)}">Email</a>` : ""}</span>
      <details class="pt-tr"><summary>Read the message</summary><p style="white-space:pre-line">${esc(x.text)}</p></details></li>`;
    const block = (h, list) => list.length ? `<h3>${h}</h3><ul class="pt-what">${list.map(row).join("")}</ul>` : "";
    return `<div class="pt-golive"><h3>Messages to them</h3>
      <p class="pt-sub">${m.emailOn ? "Emails go out by themselves. " : "Automatic email is off for now, so use the Email button. "}WhatsApp: tap the button and press send. The notes below show what has gone out.</p>
      ${block("1. We received your request", m.received)}${block("2. Your project is listed", m.listed)}</div>`;
  }
  // Approve and post (SURESH 22 Nov 2026: "Give me the approval directly from now. So I can customize and create the
  // page and post it."). Nothing goes live by itself: an admin reads the boxes above, changes anything, and posts it.
  // Anyone can vouch, before or after (open vouching), so the page can also be shared first.
  function approveHTML(s) {
    const admin = /admin/i.test(D.user.role || ""), live = s.projectSlug || s.status === "project";
    const ic = s.incharge || {}, ref = s.requestType === "referred" && ic.name;
    const who = ref ? ic.name : (s.contact || "").split(/[,(]/)[0].trim();
    const phone = ref ? ic.phone : ((s.reach || "").match(/\+?[\d][\d\s-]{7,}/) || [""])[0];
    const email = ref ? ic.email : ((s.reach || "").match(/[^\s,]+@[^\s,]+/) || [""])[0];
    const link = live ? `${location.origin}/projects/${s.projectSlug}` : s.endorseLink ? location.origin + s.endorseLink : "";
    const msg = `Hello ${who.split(" ")[0]}, Raavanaa has made the page for the need you told us about: ${link} Please check it, and vouch for it if it is right. Anyone who knows about it can vouch too, so please share the link.`;
    const n = (s.endorsements || []).length;
    return `<div class="pt-golive pt-approve">
      ${live ? `<div class="pt-live"><b>✓ Live on Projects</b> <a href="/projects/${esc(s.projectSlug || "")}" target="_blank" rel="noopener">Open the project page →</a></div>
        <p class="pt-sub">Change anything in the boxes above, then press Update the live page.</p>`
      : `<h3>Your approval</h3><p class="pt-sub">Nothing goes live by itself. Read the page above, change anything you like, then press Approve and post. It goes on Projects as an Initiated project straight away.</p>`}
      ${admin ? `<p><button type="button" class="pt-btn" data-approve>${live ? "Update the live page" : "Approve and post"}</button>
        ${!live && !s.shareOk ? ` <button type="button" class="pt-btn ghost" data-share="yes">Save, share for vouching first</button>` : !live ? ` <button type="button" class="pt-btn ghost" data-share="save">Save changes</button>` : ""}</p>`
      : `<p class="pt-sub">Only an admin can approve and post. ${s.shareOk ? "" : `<button type="button" class="pt-btn ghost" data-share="yes">Save, share for vouching</button>`}</p>`}
      <p class="pt-sub">Vouches so far: <b>${n}</b>. Anyone can vouch, as many people as like, before or after it is live.</p>
      ${(s.shareOk || live) && link ? `<p class="pt-golive-btns">${phone ? `<a class="pt-btn ghost" target="_blank" rel="noopener" href="https://wa.me/${digits(phone)}?text=${encodeURIComponent(msg)}">Send to ${esc(who.split(" ")[0] || "them")} on WhatsApp</a>` : ""}${email ? ` <a class="pt-btn ghost" href="mailto:${esc(email)}?subject=${encodeURIComponent("Your Raavanaa project page")}&body=${encodeURIComponent(msg)}">Send by email</a>` : ""}</p>` : ""}
    </div>`;
  }
  function goLiveHTML(s) {
    if (s.projectSlug || s.status === "project") return `<div class="pt-live"><b>✓ Live on Projects</b> <a href="/projects/${esc(s.projectSlug || "")}" target="_blank" rel="noopener">Open the project page →</a></div>`;
    const ic = s.incharge || {}, ref = s.requestType === "referred" && ic.name;
    const who = ref ? ic.name : (s.contact || "").split(/[,(]/)[0].trim();
    const phone = ref ? ic.phone : ((s.reach || "").match(/\+?[\d][\d\s-]{7,}/) || [""])[0];
    const email = ref ? ic.email : ((s.reach || "").match(/[^\s,]+@[^\s,]+/) || [""])[0];
    const link = s.endorseLink ? location.origin + s.endorseLink : "";
    const msg = `Hello ${who.split(" ")[0]}, Raavanaa has made the page for the need you told us about: ${link} Please check it. If anything needs changing, reply to this message. If it is right, press Vouch, and it goes live on raavanaa.org.`;
    const admin = /admin/i.test(D.user.role || "");
    return `<div class="pt-golive">
      <h3>${ref ? "Person in charge" : "Open request"}</h3>
      <p class="pt-sub">${ref ? `Sent for <b>${esc(ic.name)}</b>${ic.phone ? ` · <a href="tel:${esc(digits(ic.phone))}">${esc(ic.phone)}</a>` : ""}${ic.email ? ` · <a href="mailto:${esc(ic.email)}">${esc(ic.email)}</a>` : ""}. When the page is ready, send it to them. Their vouch puts it live.` : "Sent by the person in charge, or by someone who doesn't know anyone there. No vouch needed: an admin publishes it."}</p>
      ${s.shareOk && link ? `<p class="pt-golive-btns">${phone ? `<a class="pt-btn ghost" target="_blank" rel="noopener" href="https://wa.me/${digits(phone)}?text=${encodeURIComponent(msg)}">Send on WhatsApp</a>` : ""}${email ? ` <a class="pt-btn ghost" href="mailto:${esc(email)}?subject=${encodeURIComponent("Your Raavanaa project page")}&body=${encodeURIComponent(msg)}">Send by email</a>` : ""}</p>` : `<p class="pt-sub">First make the page above and press Approve page for sharing.</p>`}
      ${admin && s.shareOk ? `<p><button type="button" class="pt-btn" data-publish>Publish now</button> <span class="pt-sub">${ref ? "Or wait for their vouch." : "It goes on Projects as an Initiated project."}</span></p>` : ""}
    </div>`;
  }
  function wireReview(s) {
    const ap = app.querySelector("[data-approve]");
    if (ap) ap.onclick = async () => {
      const profile = {}; app.querySelectorAll("[data-pf]").forEach(i => profile[i.dataset.pf] = i.value.trim());
      if (!profile.title) { toast("Give the page a title first"); return; }
      const live = !!(s.projectSlug || s.status === "project");
      if (!LIVE) { Object.assign(s, { profile, shareOk: true, status: "project", projectSlug: s.projectSlug || "demo-project" }); render(); toast((live ? "Live page updated" : "Approved and posted") + " (demo)"); return; }
      ap.disabled = true;
      try {
        const r = await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}/publish`, { method: "POST", body: JSON.stringify({ profile }) });
        Object.assign(s, { profile, shareOk: true, status: "project", projectSlug: r.slug }); render();
        toast(r.updated ? "Live page updated" : "Approved and posted. It is on Projects now.");
      } catch (e) { ap.disabled = false; toast(e.message || "Could not post"); }
    };
    const pub = app.querySelector("[data-publish]");
    if (pub) pub.onclick = async () => {
      if (!LIVE) { toast("Publishing works on the real portal only"); return; }
      pub.disabled = true;
      try {
        const r = await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}/publish`, { method: "POST", body: "{}" });
        Object.assign(s, { status: "project", projectSlug: r.slug }); render(); toast("Live on Projects");
      } catch (e) { pub.disabled = false; toast(e.message || "Could not publish"); }
    };
    const aiBtn = app.querySelector("[data-ai]");
    if (aiBtn) aiBtn.onclick = async () => {
      if (!LIVE) { toast("The AI check works on the real portal only"); return; }
      aiBtn.disabled = true; s.ai = { ...(s.ai || {}), status: "running", mine: true }; render();
      try { await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}/analyse`, { method: "POST", body: "{}" }); }
      catch (e) { s.ai = { ...s.ai, status: "failed", error: e.message }; render(); toast("AI check failed"); return; }
      const t0 = Date.now();
      const poll = async () => {
        try {
          const r = await api("/api/portal/suggestions"), n = (r.suggestions || []).find(x => x.id === s.id);
          if (n) Object.assign(s, n);
        } catch (e) { /* try again */ }
        if (s.ai && s.ai.status === "running" && Date.now() - t0 < 6 * 60e3) { setTimeout(poll, 6000); return; }
        if (s.ai && s.ai.status === "running") s.ai = { ...s.ai, status: "failed", error: "No answer yet. Try again in a few minutes." };
        render(); toast(s.ai.status === "done" ? "AI draft ready" : "AI check failed");
      };
      setTimeout(poll, 8000);
    };
    // Preview: the page as people will see it, with what is in the boxes now (nothing is saved or shared).
    const pv = app.querySelector("[data-preview]");
    if (pv) pv.onclick = () => {
      const profile = {}; app.querySelectorAll("[data-pf]").forEach(i => profile[i.dataset.pf] = i.value.trim());
      const token = (s.endorseLink || "").split("/").pop().toLowerCase();
      try { localStorage.setItem("raav-preview-" + token, JSON.stringify(profile)); } catch (e) { /* private mode */ }
      window.open(s.endorseLink + "?preview=1", "_blank", "noopener");
    };
    app.querySelectorAll("[data-share]").forEach(b => b.onclick = async () => {
      const profile = {}; app.querySelectorAll("[data-pf]").forEach(i => profile[i.dataset.pf] = i.value.trim());
      const share = b.dataset.share !== "stop";
      if (share && !profile.title) { toast("Give the page a title first"); return; }
      if (!LIVE) { Object.assign(s, { shareOk: share, profile, shareOkBy: D.user.name, shareOkAt: NOW.toISOString() }); render(); toast((share ? "Approved" : "Stopped") + " (demo)"); return; }
      b.disabled = true;
      try {
        const r = await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}`, { method: "PATCH", body: JSON.stringify({ share, profile, note: share ? (b.dataset.share === "yes" ? "Page approved for sharing and vouching." : "") : "Sharing stopped." }) });
        Object.assign(s, r.suggestion); render(); toast(share ? "Saved. The requester can share the page." : "Sharing stopped");
      } catch (e) { b.disabled = false; toast(e.message || "Could not save"); }
    });
    app.querySelectorAll("[data-vouch-ok]").forEach(b => b.onclick = async () => {
      const ok = b.dataset.vouchOk === "yes";
      if (!LIVE) { Object.assign(s, { vouchOkBy: ok ? D.user.name : "" }); render(); toast((ok ? "Marked as vouched" : "Undone") + " (demo)"); return; }
      b.disabled = true;
      try {
        const r = await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}`, { method: "PATCH", body: JSON.stringify({ vouchOk: ok, note: ok ? "Admin: one vouch is enough. Marked as vouched." : "Vouched mark taken off; waiting for 3 vouches again." }) });
        Object.assign(s, r.suggestion); render(); toast(ok ? "Marked as vouched" : "Undone");
      } catch (e) { b.disabled = false; toast(e.message || "Could not save"); }
    });
  }

  // Community endorsement: people who vouched through the request's share link. 3, one of them in a role = backed.
  const vouch = s => { const e = s.endorsements || [], need = s.vouchesNeeded || 3, roleOk = !s.vouchNeedsRole && s.vouchesNeeded ? true : e.some(x => x.relation === "role"), over = !!s.vouchOkBy && e.length >= 1; return { n: e.length, need, role: e.some(x => x.relation === "role"), over, backed: over || (e.length >= need && roleOk) }; };
  const REL = { role: "Role", know: "Knows them", seen: "Seen the need" };
  // Open vouching (SURESH 22 Nov 2026): anyone can vouch, no target, no role. Phones stay private to the team.
  const openVouchHTML = s => {
    const e = s.endorsements || [];
    if (!e.length && !s.endorseLink) return "";
    return `<section class="pt-card">
      <h2>Vouched for by <span class="pt-count">${e.length}</span></h2>
      <p class="pt-sub">Anyone who knows about it can vouch. There is no limit. Call one of them if you want to check. Vouches made on the live project page are under Vouches &amp; ratings.</p>
      <ul class="pt-notes">${e.map(x => `<li><span class="pt-av">${esc(initials(x.name))}</span><div><b>${esc(x.name)}</b> <time>${ago(x.at)}</time><p>${esc(x.role || REL[x.relation] || "")} · <a href="tel:${esc(String(x.phone).replace(/\s/g, ""))}">${esc(x.phone)}</a> <small>(private)</small></p></div></li>`).join("") || `<li class="pt-empty">Nobody yet.</li>`}</ul>
      ${s.endorseLink ? `<p class="pt-sub">Share link: <a href="${esc(s.endorseLink)}" target="_blank" rel="noopener">raavanaa.org${esc(s.endorseLink)}</a></p>` : ""}
    </section>`;
  };
  const vouchHTML = s => {
    const e = s.endorsements || [], v = vouch(s);
    if (!e.length && !s.endorseLink) return "";
    return `<section class="pt-card">
      <h2>Vouched for by <span class="pt-count">${e.length} of ${v.need}</span></h2>
      <p class="pt-sub">${v.over ? `Vouched. ${esc(s.vouchOkBy)} (admin) said ${e.length === 1 ? "one vouch is" : "these vouches are"} enough.` : v.backed ? "Backed by the community. Call one of them before the visit." : e.length >= 3 ? "Still needs someone in a role (principal, teacher, Grama Niladhari…)." : "Waiting for people to vouch through the share link."}</p>
      <ul class="pt-notes">${e.map(x => `<li><span class="pt-av">${esc(initials(x.name))}</span><div><b>${esc(x.name)}</b> <time>${ago(x.at)}</time><p>${esc(x.role || REL[x.relation] || "")} · <a href="tel:${esc(String(x.phone).replace(/\s/g, ""))}">${esc(x.phone)}</a> <small>(private)</small></p></div></li>`).join("") || `<li class="pt-empty">Nobody yet.</li>`}</ul>
      ${/admin/i.test(D.user.role || "") && e.length && (v.over || !v.backed) ? `<p><button type="button" class="pt-btn ${v.over ? "ghost" : ""}" data-vouch-ok="${v.over ? "no" : "yes"}">${v.over ? "Undo: wait for 3 vouches again" : `Mark as vouched (${e.length === 1 ? "one vouch is" : "these are"} enough)`}</button></p><p class="pt-sub">Admins only. The page then shows Vouched.</p>` : ""}
      ${s.endorseLink ? `<p class="pt-sub">Share link: <a href="${esc(s.endorseLink)}" target="_blank" rel="noopener">raavanaa.org${esc(s.endorseLink)}</a></p>` : ""}
    </section>`;
  };

  function detail(id) {
    const s = D.suggestions.find(x => x.id === id);
    if (!s) return `<p>Not found. <a href="#/suggestions">Back to suggestions</a></p>`;
    const field = (l, v) => v ? `<div><dt>${l}</dt><dd>${v}</dd></div>` : "";
    // Evidence: private files, only the team sees them (served by /api/portal/files/:id).
    const evidenceHTML = s => {
      const files = s.files || [];
      if (!files.length) return s.noEvidence || LIVE ? `<div class="pt-ev"><h3>Evidence</h3><p class="pt-sub">${s.noEvidence ? "No evidence yet – they will show it at the visit." : "No files."}</p></div>` : "";
      const order = { document: 0, image: 1, video: 2, audio: 3 };
      files.sort((a, b) => (order[a.kind] ?? 0) - (order[b.kind] ?? 0));
      return `<div class="pt-ev"><h3>Evidence <small>private · team only</small></h3><ul>${files.map(f => {
        const u = `/api/portal/files/${f.id}`;
        if (/^image\//.test(f.type)) return `<li><a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="${esc(f.name)}" loading="lazy"></a></li>`;
        if (/^video\//.test(f.type)) return `<li><video src="${u}" controls preload="metadata" playsinline></video></li>`;
        if (/^audio\//.test(f.type)) return `<li class="pt-ev-audio"><audio src="${u}" controls preload="metadata"></audio><small>${esc(f.name)} · voice note, to turn into text</small></li>`;
        return `<li><a class="pt-ev-doc" href="${u}" target="_blank" rel="noopener">📄 ${esc(f.name)}</a></li>`;
      }).join("")}</ul></div>`;
    };
    const F = flowState(s), cur = F.findIndex(x => !x.done);
    const step = (k, l) => { const j = F.findIndex(x => x.key === k); return `<li class="${s.status === "declined" ? "" : F[j].done ? "done" : j === cur ? "now" : ""}"><i></i><span>${l}</span></li>`; };
    return `
      <a class="pt-back" href="#/suggestions">‹ All suggestions</a>
      <header class="pt-head"><div><p class="pt-kicker">Suggestion ${esc(s.id)} · received ${ago(s.received)}</p><h1>${esc(det(s).title || s.title)}</h1>
        <p><span class="pt-pill ${STATUS[s.status].c}">${STATUS[s.status].label}</span>${s.status === "visit" && s.visit ? ` <span class="pt-sub">Visit on ${fmtDay(s.visit)}</span>` : ""}</p></div></header>
      ${s.status === "declined" || s.openVouch ? "" : `<ol class="pt-steps six">${step("take", "Taken")}${step("call", "Called")}${step("visit", "Visited")}${step("approve", "Approved")}${step("budget", "Budget")}${step("create", "Initiated")}</ol>`}
      <div class="pt-detail">
        <section class="pt-card">
          <h2>What they sent</h2>
          <p class="pt-desc">${esc(s.description)}</p>
          <dl class="pt-facts">
            ${field("Moment", esc(s.kind || ""))}
            ${field("Category", esc(s.category))}
            ${field("Focus", esc((s.focus || []).join(", ")))}
            ${s.village || s.city ? `${field("Village", esc(s.village || ""))}${field("City or district", esc(s.city || ""))}` : field("Location", esc(s.location))}
            ${field("How many", esc(howMany(s.children)))}
            ${field("Contact", esc(s.contact))}
            ${field("Member account", esc(s.memberEmail || ""))}
            ${field("Email or phone", `<a href="${/@/.test(s.reach) ? "mailto:" : "tel:"}${esc(s.reach.replace(/\s/g, ""))}">${esc(s.reach)}</a>`)}
            ${field("More", esc(s.additional))}
          </dl>
          ${evidenceHTML(s)}
        </section>
        <div class="pt-col">
          ${reviewHTML(s)}
          ${s.openVouch ? openVouchHTML(s) : simpleFlow(s) && s.requestType !== "referred" ? "" : vouchHTML(s)}
          ${simpleFlow(s) ? "" : flowHTML(s, F, cur)}
          ${visitFeedbackHTML(s)}
          <section class="pt-card">
            <h2>Team notes <span class="pt-count">${s.notes.length}</span></h2>
            <ul class="pt-notes">${s.notes.map(n => `<li><span class="pt-av">${esc(initials(n.by))}</span><div><b>${esc(n.by)}</b> <time>${ago(n.at)}</time><p>${esc(n.text)}</p></div></li>`).join("") || `<li class="pt-empty">No notes yet.</li>`}</ul>
            <form class="pt-note-form"><textarea rows="2" placeholder="Add a note for the team" aria-label="Add a note"></textarea><button class="pt-btn" type="submit">Add note</button></form>
          </section>
        </div>
      </div>`;
  }
  // ---------- From request to Initiated: six steps ----------
  // 1 Take it · 2 First call (collect the details the short form doesn't ask) · 3 Visit and verify
  // 4 Approve (an admin; not the person who visited) · 5 Budget and expectations · 6 Create the Initiated project
  const CALL_DAYS = 2;
  const rs = n => "Rs " + Math.round(n).toLocaleString("en-US"); // projects are in Sri Lankan rupees
  const det = s => { if (!s.details) s.details = {}; return s.details; };
  const plan = s => { if (!s.plan) s.plan = { lines: [], expect: [] }; return s.plan; };
  const callMissing = s => { const d = det(s), o = ob(s), m = [];
    if (!d.title) m.push("Title"); if (!d.story) m.push("Story"); if (!d.place) m.push("Exact place of the day");
    if (o.contact === "trusted" && !(o.trusted && o.trusted.name && o.trusted.phone)) m.push("Trusted contact");
    return m; };
  const evidenceOk = s => (s.files || []).length > 0 || !!det(s).evidenceSeen;
  const after = (st, k) => { const order = ["new", "visit", "verified", "approved", "project"]; return order.indexOf(st) >= order.indexOf(k); };
  const planDone = s => { const q = plan(s); return q.lines.some(x => x.item && num(x.amount) > 0) && q.expect.some(Boolean); };
  const callDue = s => {
    if (s.status !== "new" || s.called) return null;
    const due = new Date(new Date(s.received).getTime() + CALL_DAYS * 864e5), late = NOW > due;
    return { late, text: late ? `First call overdue (was due ${fmtDay(due.toISOString())})` : `First call by ${fmtDay(due.toISOString())}` };
  };
  const flowState = s => [
    { key: "take", done: !!s.assigned },
    { key: "call", done: !!s.called && !callMissing(s).length },
    { key: "visit", done: after(s.status, "verified") },
    { key: "approve", done: after(s.status, "approved") },
    { key: "budget", done: planDone(s) },
    { key: "create", done: s.status === "project" }
  ];
  function flowHTML(s, F, cur) {
    if (s.status === "declined") return `<section class="pt-card"><h2>Not suitable</h2><p class="pt-sub">Call the person and explain kindly. You can reopen it if things change.</p><button type="button" class="pt-btn ghost" data-act="new">Reopen</button></section>`;
    const d = det(s), o = ob(s), t = o.trusted || {}, q = plan(s), miss = callMissing(s), due = callDue(s);
    const admin = /admin/i.test(D.user.role || ""), own = s.verifiedBy && s.verifiedBy === D.user.name;
    const total = q.lines.reduce((a, x) => a + num(x.amount), 0);
    const box = (i, title, summary, body) => { const st = F[i].done ? "done" : i === cur ? "now" : "next";
      return `<details class="pt-step ${st}" ${i === cur || (F[i].done && openStep === F[i].key) ? "open" : ""} data-step="${F[i].key}"><summary><i>${F[i].done ? "✓" : i + 1}</i><span><b>${title}</b>${summary ? `<small>${summary}</small>` : ""}</span></summary><div class="pt-step-body">${body}</div></details>`; };
    const STEPS = [
      box(0, "Take it", s.assigned ? `${esc(s.assigned)}${s.takenAt ? " · " + fmtDay(s.takenAt) : ""}` : "Nobody yet",
        `<label class="pt-field">Looked after by<select data-assign><option value="">Nobody yet</option>${D.team.map(m => `<option ${s.assigned === m ? "selected" : ""}>${esc(m)}</option>`).join("")}</select></label>
         <p class="pt-sub">The person who takes it makes the first call and usually does the visit.</p>`),
      box(1, "First call", F[1].done ? `Called ${fmtDay(s.called)} · all details in` : due ? `<span class="pt-due ${due.late ? "late" : ""}">${due.text}</span>` : miss.length ? `Missing: ${miss.join(", ")}` : "",
        `<p class="pt-sub">Call ${esc(s.contact || "them")} on <a href="${/@/.test(s.reach || "") ? "mailto:" : "tel:"}${esc(String(s.reach || "").replace(/\s/g, ""))}">${esc(s.reach || "")}</a>. Ask for what the short form didn't.</p>
         <label class="pt-field">Title for the project <input data-d="title" value="${esc(d.title || "")}" placeholder="e.g. Sports day at the Paranthan girls' home"></label>
         <label class="pt-field">The story: the need and the plan <textarea data-d="story" rows="4" placeholder="Who the children are, what they need, what the day will be">${esc(d.story || "")}</textarea></label>
         <label class="pt-field">Organisation <small>(optional)</small><input data-d="org" value="${esc(d.org || "")}" placeholder="e.g. a children's home"></label>
         <label class="pt-field">Exact place of the day <small>(private, team only)</small><input data-d="place" value="${esc(d.place || "")}" placeholder="Home, school or hall, and the address"></label>
         <div class="pt-ob-who"><span>Who sends feedback for them?</span>
           <label><input type="radio" name="ob-contact" value="self" ${o.contact === "self" ? "checked" : ""}> They use a phone themselves</label>
           <label><input type="radio" name="ob-contact" value="trusted" ${o.contact === "trusted" ? "checked" : ""}> A trusted contact (family or someone close)</label>
           ${o.contact === "trusted" ? `<div class="pt-ob-trusted">
             <input data-tr="name" placeholder="Name" value="${esc(t.name || "")}" aria-label="Trusted contact name">
             <input data-tr="relation" placeholder="Relation (e.g. son, niece)" value="${esc(t.relation || "")}" aria-label="Relation">
             <input data-tr="phone" placeholder="Phone" inputmode="tel" value="${esc(t.phone || "")}" aria-label="Trusted contact phone"></div>` : ""}
         </div>
         <div class="pt-row2"><label class="pt-field">Called on<input type="date" data-called value="${esc((s.called || NOW.toISOString()).slice(0, 10))}"></label>
           <button type="button" class="pt-btn" data-save-call>${s.called ? "Save changes" : "Save the call"}</button></div>
         ${miss.length ? `<p class="pt-miss-line">Still missing: ${miss.join(" · ")}</p>` : ""}`),
      box(2, "Visit and verify", after(s.status, "verified") ? `Verified by ${esc(s.verifiedBy || s.assigned || "the team")}${s.verifiedAt ? " · " + fmtDay(s.verifiedAt) : ""}` : [s.status === "visit" && s.visit && `Visit on ${fmtDay(s.visit)}`, chById(s.champion) && `Champion: ${esc(chById(s.champion).name)}`].filter(Boolean).join(" · "),
        `${champPick(s)}` + (s.status === "new"
          ? `<div class="pt-visit"><label class="pt-field">Visit date<input type="date" data-visit value="${esc(s.visit || "2026-10-20")}"></label><button type="button" class="pt-btn" data-act="visit">Plan the visit</button></div>
             ${!F[1].done ? `<p class="pt-sub">Best after the first call, so you know where you are going.</p>` : ""}`
          : after(s.status, "verified") ? `<p class="pt-sub">The visit checklist was completed${o.contact === "trusted" && t.name ? `, with ${esc(t.name)} as trusted contact` : ""}.</p>`
          : `${onboardHTML(s, true)}
             <label class="pt-check"><input type="checkbox" data-evseen ${evidenceOk(s) ? "checked" : ""} ${(s.files || []).length ? "disabled" : ""}><span>${(s.files || []).length ? "Evidence received with the request" : "Evidence seen at the visit (add a photo to Notes if you can)"}</span></label>
             <button type="button" class="pt-btn" data-act="verified" ${onboardDone(s) && evidenceOk(s) && F[1].done ? "" : "disabled"}>Visited · the need is real</button>
             ${onboardDone(s) && evidenceOk(s) && F[1].done ? "" : `<p class="pt-sub">Needs: ${[!F[1].done && "the first call details", !onboardDone(s) && "the visit checklist", !evidenceOk(s) && "evidence"].filter(Boolean).join(", ")}.</p>`}`)),
      box(3, "Approve", after(s.status, "approved") ? `Approved by ${esc(s.approvedBy || "")}${s.approvedAt ? " · " + fmtDay(s.approvedAt) : ""}${s.approvedOverride ? " (also the visitor)" : ""}` : "",
        !after(s.status, "verified") ? `<p class="pt-sub">After the visit. Only an admin approves, and not the person who visited.</p>`
          : after(s.status, "approved") ? `<p class="pt-sub">Approved. Next: the budget and what the organisers hope for.</p>`
          : !admin ? `<p class="pt-sub">Waiting for an admin to approve.</p>`
          : own ? `<p class="pt-sub">You verified this visit, so another admin should approve it.</p>
                   <label class="pt-check"><input type="checkbox" data-override><span>I did both (early weeks). Approve anyway; this is noted.</span></label>
                   <button type="button" class="pt-btn" data-approve disabled>Approve</button>`
          : `<p class="pt-sub">Verified by ${esc(s.verifiedBy || s.assigned || "the team")}. Read the notes and the visit feedback, then approve.</p><button type="button" class="pt-btn" data-approve>Approve</button>`),
      box(4, "Budget and expectations", F[4].done ? `${rs(total)} · ${q.expect.filter(Boolean).length} expectation${q.expect.filter(Boolean).length === 1 ? "" : "s"}` : "",
        `<p class="pt-sub">Estimated costs, line by line. They show on the website as estimates until the day.</p>
         <ul class="pt-lines">${q.lines.map((x, k) => `<li><input data-li="${k}" data-f="item" value="${esc(x.item)}" placeholder="e.g. Van hire" aria-label="Item"><span class="pt-cur">Rs</span><input data-li="${k}" data-f="amount" value="${esc(x.amount)}" inputmode="decimal" placeholder="0" aria-label="Amount"><button type="button" data-rm="${k}" aria-label="Remove">✕</button></li>`).join("")}</ul>
         <div class="pt-row2"><button type="button" class="pt-btn ghost" data-addline>+ Add a line</button><p class="pt-total">Total <b>${rs(total)}</b></p></div>
         <p class="pt-field-h">What the organisers hope for <small>(ticked off after the day)</small></p>
         ${[0, 1, 2].map(k => `<input class="pt-exp" data-ex="${k}" value="${esc(q.expect[k] || "")}" placeholder="${["e.g. Every child plays at least one game", "e.g. A hot lunch for everyone", "e.g. Each family takes home a photo"][k]}">`).join("")}
         <button type="button" class="pt-btn" data-save-plan>Save budget and expectations</button>`),
      box(5, "Create the Initiated project", s.status === "project" ? "On the website as an Initiated project" : "",
        s.status === "project" ? `<p class="pt-sub">Done. <a href="/projects/${esc(s.project || "")}" target="_blank" rel="noopener">Open the project page →</a></p>`
          : `<div class="pt-preview"><p class="pt-preview-h">On the website it will show</p>
              <b>${esc((s.profile && s.profile.title) || d.title || s.title)}</b><small>Initiated · ${esc([s.village, s.city].filter(Boolean).join(", ") || s.location)} · Budget ${rs(total)}</small>
              <ol><li>Requested by ${esc(s.contact || "")}${d.org ? ", " + esc(d.org) : ""}</li><li>Verified by ${esc(s.verifiedBy || "…")}</li><li>Approved by ${esc(s.approvedBy || "…")}</li></ol></div>
             <button type="button" class="pt-btn" data-act="project" ${after(s.status, "approved") && F[4].done ? "" : "disabled"}>Create the Initiated project</button>
             ${after(s.status, "approved") && F[4].done ? "" : `<p class="pt-sub">Needs approval and a budget with expectations first.</p>`}`)
    ];
    return `<section class="pt-card pt-flow"><h2>From request to Initiated <span class="pt-count">${F.filter(x => x.done).length}/6</span></h2>${STEPS.join("")}
      <button type="button" class="pt-btn ghost danger pt-decline" data-act="declined">Not suitable</button></section>`;
  }
  let openStep = "";
  function wireFlow(s) {
    app.querySelectorAll(".pt-step").forEach(dd => dd.addEventListener("toggle", () => { if (dd.open) openStep = dd.dataset.step; }));
    const callBtn = app.querySelector("[data-save-call]");
    if (callBtn) callBtn.onclick = () => {
      const d = { ...det(s) }; app.querySelectorAll("[data-d]").forEach(i => d[i.dataset.d] = i.value.trim());
      const o = { ...ob(s), trusted: { ...(ob(s).trusted || {}) } };
      app.querySelectorAll("[data-tr]").forEach(i => o.trusted[i.dataset.tr] = i.value.trim());
      const was = !!s.called; openStep = "call";
      save(s, { details: d, onboard: o, called: app.querySelector("[data-called]").value }, was ? "" : `First call done. ${callMissing({ ...s, details: d, onboard: o }).length ? "Some details still missing." : "All details in."}`, "Call saved");
    };
    app.querySelectorAll('input[name="ob-contact"]').forEach(r => r.onchange = () => { ob(s).contact = r.value; openStep = "call"; render(); });
    const ev = app.querySelector("[data-evseen]");
    if (ev) ev.onchange = () => save(s, { details: { ...det(s), evidenceSeen: ev.checked } });
    const ov = app.querySelector("[data-override]"), ap = app.querySelector("[data-approve]");
    if (ov) ov.onchange = () => { ap.disabled = !ov.checked; };
    if (ap) ap.onclick = () => save(s, LIVE ? { status: "approved", override: !!(ov && ov.checked) } : { status: "approved", approvedBy: D.user.name, approvedAt: NOW.toISOString(), approvedOverride: !!(ov && ov.checked) },
      `Approved${ov && ov.checked ? " (also did the visit; early-weeks override)" : ""}.`, "Approved");
    const q = plan(s), readPlan = () => {
      app.querySelectorAll("[data-li]").forEach(i => { q.lines[+i.dataset.li][i.dataset.f] = i.value.trim(); });
      q.expect = [...app.querySelectorAll("[data-ex]")].map(i => i.value.trim());
    };
    const add = app.querySelector("[data-addline]"); if (add) add.onclick = () => { readPlan(); q.lines.push({ item: "", amount: "" }); openStep = "budget"; render(); const ins = app.querySelectorAll("[data-li][data-f=item]"); if (ins.length) ins[ins.length - 1].focus(); };
    app.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { readPlan(); q.lines.splice(+b.dataset.rm, 1); openStep = "budget"; render(); });
    app.querySelectorAll("[data-li][data-f=amount]").forEach(i => i.oninput = () => { readPlan(); const t = app.querySelector(".pt-total b"); if (t) t.textContent = rs(q.lines.reduce((a, x) => a + num(x.amount), 0)); });
    const sp = app.querySelector("[data-save-plan]"); if (sp) sp.onclick = () => { readPlan(); q.lines = q.lines.filter(x => x.item || x.amount); openStep = "budget"; save(s, { plan: q }, "Budget and expectations saved.", "Saved"); };
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
  const ob = s => { if (!s.onboard) s.onboard = {}; if (!s.onboard.contact) s.onboard.contact = "self"; return s.onboard; };
  const onboardDone = s => { const o = ob(s); return OB.every(([k]) => o[k]) && o.test && (o.contact === "self" || (o.trusted && o.trusted.name && o.trusted.phone)); };
  function onboardHTML(s, noWho) {
    const o = ob(s), t = o.trusted || {};
    return `<div class="pt-ob">
      <p class="pt-ob-h">Visit checklist <span>${OB.filter(([k]) => o[k]).length + (o.test ? 1 : 0)}/4</span></p>
      ${OB.map(([k, l]) => `<label class="pt-check"><input type="checkbox" data-ob="${k}" ${o[k] ? "checked" : ""}><span>${l}</span></label>`).join("")}
      <div class="pt-ob-who" ${noWho ? "hidden" : ""}><span>Who sends feedback for them?</span>
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
  // Live mode: every change is saved through the portal API; the saved suggestion comes back and replaces the local one.
  // Champions: trusted local volunteers who call or visit a request (SURESH, 10 Nov 2026).
  const chById = id => C.list.find(c => c.id === id);
  function champPick(s) {
    const cur = chById(s.champion), active = C.list.filter(c => c.active || c.id === s.champion);
    if (!active.length) return `<p class="pt-sub">No Champions yet. <a href="#/champions">Add the volunteers who visit</a>, then pick one here.</p>`;
    const where = [s.city, s.location, s.village].filter(Boolean).join(" ").toLowerCase(), near = c => where.includes(c.district.toLowerCase()) ? 0 : 1;
    const opts = [...active].sort((a, b) => near(a) - near(b) || a.district.localeCompare(b.district) || a.name.localeCompare(b.name));
    return `<label class="pt-field">Champion who visits<select data-champ><option value="">Not chosen yet</option>${opts.map(c => `<option value="${c.id}" ${c.id === s.champion ? "selected" : ""}>${esc(c.name)} · ${esc(c.district)}${c.active ? "" : " (paused)"}</option>`).join("")}</select></label>
      ${cur ? `<p class="pt-sub">Call ${esc(cur.name.split(" ")[0])} on <a href="tel:${esc(cur.phone.replace(/\s/g, ""))}">${esc(cur.phone)}</a>. The vouching page shows their first name and district only.</p>` : ""}`;
  }
  function champions() {
    const ds = ["All", ...new Set(C.list.map(c => c.district))];
    const list = C.list.filter(c => chDistrict === "All" || c.district === chDistrict);
    const form = (c = {}) => `<form class="pt-card pt-champ-form" data-chform="${c.id || ""}">
        <h2>${c.id ? "Edit Champion" : "Add a Champion"}</h2>
        <div class="pt-row2"><label class="pt-field">Name<input name="name" required maxlength="80" value="${esc(c.name || "")}"></label>
          <label class="pt-field">Phone<input name="phone" required inputmode="tel" maxlength="40" value="${esc(c.phone || "")}"></label></div>
        <div class="pt-row2"><label class="pt-field">District<select name="district" required><option value="">Choose</option>${C.districts.map(d => `<option ${c.district === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
          <label class="pt-field">Email (optional)<input name="email" type="email" maxlength="120" value="${esc(c.email || "")}"></label></div>
        <label class="pt-field">Villages or towns they can reach<input name="areas" maxlength="300" placeholder="Pussellawa, Gampola, Nawalapitiya" value="${esc(c.areas || "")}"></label>
        <label class="pt-field">Note for the team<textarea name="note" rows="2" maxlength="500">${esc(c.note || "")}</textarea></label>
        <div class="pt-actions-row"><button class="pt-btn">${c.id ? "Save changes" : "Add Champion"}</button>${c.id ? `<button type="button" class="pt-btn ghost" data-chcancel>Cancel</button>` : ""}</div></form>`;
    return `
      <header class="pt-head"><div><p class="pt-kicker">Champions</p><h1>Volunteers who visit</h1>
        <p class="pt-sub">Trusted local people who call or visit a request before it can take gifts. Their phone stays inside the team; the vouching page shows only a first name and district.</p></div></header>
      <section class="pt-stats">
        <div class="pt-stat st1"><b>${C.list.filter(c => c.active).length}</b><span>Active</span></div>
        <div class="pt-stat st2"><b>${new Set(C.list.filter(c => c.active).map(c => c.district)).size}</b><span>Districts</span></div>
        <div class="pt-stat st3"><b>${C.list.reduce((a, c) => a + (c.visits || 0), 0)}</b><span>Requests given</span></div>
      </section>
      ${ds.length > 2 ? `<div class="pt-chips">${ds.map(d => `<button type="button" aria-pressed="${d === chDistrict}" data-chd="${esc(d)}">${esc(d)}</button>`).join("")}</div>` : ""}
      <section class="pt-champs">${list.length ? list.map(c => chEdit === c.id ? form(c) : `
        <article class="pt-card pt-champ ${c.active ? "" : "off"}">
          <div><h3>${esc(c.name)}</h3><p class="pt-sub">${esc(c.district)}${c.areas ? " · " + esc(c.areas) : ""}</p>
            <p class="pt-champ-meta"><a href="tel:${esc(c.phone.replace(/\s/g, ""))}">${esc(c.phone)}</a>${c.email ? ` · ${esc(c.email)}` : ""} · ${c.visits || 0} request${c.visits === 1 ? "" : "s"}${c.active ? "" : " · paused"}</p>
            ${c.note ? `<p class="pt-sub">${esc(c.note)}</p>` : ""}</div>
          <div class="pt-actions-row"><button type="button" class="pt-btn ghost" data-chedit="${c.id}">Edit</button><button type="button" class="pt-btn ghost" data-chact="${c.id}">${c.active ? "Pause" : "Make active"}</button></div>
        </article>`).join("") : `<p class="pt-sub">No Champions${chDistrict === "All" ? " yet" : " in " + esc(chDistrict)}.</p>`}</section>
      ${chEdit ? "" : form()}`;
  }
  // Family circles that chose a project (13 Nov 2026). "Being funded by <name>'s circle" shows on the website only
  // after the team approves the hold here; a hold not approved lapses after 7 days. Approve once the first gift is in.
  let HOLDS = null;
  function circles() {
    if (HOLDS === null) { loadHolds(); return `<header class="pt-head"><div><p class="pt-kicker">Family circles</p><h1>Projects chosen by families</h1></div></header><p class="pt-sub">Loading…</p>`; }
    const when = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
    const waiting = HOLDS.filter(h => !h.approved);
    return `
      <header class="pt-head"><div><p class="pt-kicker">Family circles</p><h1>Projects chosen by families</h1>
        <p class="pt-sub">When a family circle chooses a project, it waits here. Approve it once you know the family (ideally after their first gift). Only then does the website say “Being funded by … circle”, and no other circle can take it. A hold you do not approve lapses after 7 days.</p></div></header>
      <section class="pt-stats">
        <div class="pt-stat st1"><b>${waiting.length}</b><span>Waiting</span></div>
        <div class="pt-stat st2"><b>${HOLDS.length - waiting.length}</b><span>Approved</span></div>
      </section>
      <section class="pt-champs">${HOLDS.length ? HOLDS.map(h => `
        <article class="pt-card pt-champ">
          <div><h3>${esc(h.name)}’s circle <small>${h.approved ? "· approved" + (h.approvedBy ? " by " + esc(h.approvedBy) : "") : "· waiting"}</small></h3>
            <p class="pt-sub">${esc((h.words ? h.words + " " : "") + h.name)} · project <a href="/projects/${esc(h.project)}" target="_blank" rel="noopener">${esc(h.project)}</a></p>
            <p class="pt-champ-meta">Chosen ${when(h.since)}${h.lapses ? ` · lapses ${when(h.lapses)}` : ""} · ${h.gifts} gift${h.gifts === 1 ? "" : "s"} · ${h.members} in the circle · organiser ${esc(h.from || "")} ${h.owner ? `&lt;${esc(h.owner)}&gt;` : ""} · <a href="/m/${esc(h.code)}" target="_blank" rel="noopener">family page</a></p></div>
          <div class="pt-actions-row">${h.approved ? "" : `<button type="button" class="pt-btn" data-hold="approve" data-code="${esc(h.code)}">Approve</button>`}<button type="button" class="pt-btn ghost" data-hold="release" data-code="${esc(h.code)}">Release</button></div>
        </article>`).join("") : `<p class="pt-sub">No family circle has chosen a project yet.</p>`}</section>`;
  }
  async function loadHolds() {
    await null; // let render() finish drawing "Loading" first
    if (!LIVE) { HOLDS = [{ code: "abc234", name: "Amma", words: "In loving memory of", project: "pussellawa-kandy-trip", since: new Date().toISOString(), approved: false, gifts: 1, members: 4, from: "Ravi", owner: "ravi@example.com", lapses: new Date(Date.now() + 7 * 864e5).toISOString() }]; render(); return; }
    try { HOLDS = (await api("/api/circle-team")).holds || []; } catch (e) { HOLDS = []; toast(e.message || "Could not load."); }
    render();
  }
  function wireCircles() {
    app.querySelectorAll("[data-hold]").forEach(b => b.onclick = async () => {
      const action = b.dataset.hold, code = b.dataset.code;
      if (!LIVE) { HOLDS = action === "release" ? HOLDS.filter(h => h.code !== code) : HOLDS.map(h => h.code === code ? { ...h, approved: true } : h); render(); toast((action === "approve" ? "Approved" : "Released") + " (demo)"); return; }
      b.disabled = true;
      try { HOLDS = (await api("/api/circle-team", { method: "POST", body: JSON.stringify({ code, action }) })).holds || []; render(); toast(action === "approve" ? "Approved: the website now shows it" : "Released: other circles can choose it"); }
      catch (e) { b.disabled = false; toast(e.message || "Could not save."); }
    });
  }
  // Volunteers (17 Nov 2026): everyone who joined through Join Raavanaa or the Volunteer form, with their contact
  // details for the team. "On the page" = they ticked "Show me" and the team has not hidden them (/volunteers).
  let VOLS = null;
  function volunteers() {
    if (VOLS === null) { loadVols(); return `<header class="pt-head"><div><p class="pt-kicker">Volunteers</p><h1>Everyone who joined</h1></div></header><p class="pt-sub">Loading…</p>`; }
    const when = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
    const shown = VOLS.filter(v => v.show_public && !v.hidden);
    return `
      <header class="pt-head"><div><p class="pt-kicker">Volunteers</p><h1>Everyone who joined</h1>
        <p class="pt-sub">People who joined through Join Raavanaa (/spark) or the Volunteer form. Reply to each one personally. Those who ticked “Show me” are on the public <a href="/volunteers" target="_blank" rel="noopener">Volunteers page</a> (first name, town and skills only); hide anyone who should not be there.</p></div></header>
      <section class="pt-stats">
        <div class="pt-stat st1"><b>${VOLS.length}</b><span>Joined</span></div>
        <div class="pt-stat st2"><b>${shown.length}</b><span>On the page</span></div>
        <div class="pt-stat st3"><b>${VOLS.filter(v => v.member_email).length}</b><span>Members too</span></div>
      </section>
      <section class="pt-champs">${VOLS.length ? VOLS.map(v => `
        <article class="pt-card pt-champ ${v.hidden ? "off" : ""}">
          <div><h3>${esc(v.name)} <small>${v.show_public ? (v.hidden ? "· hidden from the page" : "· on the page") : "· not listed (did not tick)"}${v.member_email ? " · member" : ""}</small></h3>
            <p class="pt-sub">${esc(v.city || "No town given")} · joined ${when(v.created_at)} from ${v.source === "spark" ? "Join Raavanaa" : v.source === "volunteers" ? "the Volunteers page" : "the Volunteer form"}</p>
            <p class="pt-champ-meta">${esc(v.contact)}${v.phone ? " · " + esc(v.phone) : ""}${v.availability ? " · free " + esc(v.availability) : ""}</p>
            ${(v.skills || []).length ? `<p class="pt-sub">${(v.skills || []).map(esc).join(", ")}</p>` : ""}
            ${v.message ? `<p class="pt-sub">“${esc(v.message)}”</p>` : ""}</div>
          ${v.show_public ? `<div class="pt-actions-row"><button type="button" class="pt-btn ghost" data-vhide="${v.id}" data-on="${v.hidden ? "" : "1"}">${v.hidden ? "Show on the page" : "Hide from the page"}</button></div>` : ""}
        </article>`).join("") : `<p class="pt-sub">Nobody has joined through the website yet.</p>`}</section>`;
  }
  async function loadVols() {
    await null;
    if (!LIVE) { VOLS = [{ id: 1, name: "Priya Sivakumar", contact: "priya@example.com", phone: "", city: "Toronto, Canada", skills: ["Social media", "Photos and video"], source: "spark", member_email: "priya@example.com", show_public: true, hidden: false, created_at: new Date().toISOString(), availability: "", message: "" }]; render(); return; }
    try { VOLS = (await api("/api/volunteers/team")).volunteers || []; } catch (e) { VOLS = []; toast(e.message || "Could not load."); }
    render();
  }
  function wireVolunteers() {
    app.querySelectorAll("[data-vhide]").forEach(b => b.onclick = async () => {
      const id = Number(b.dataset.vhide), hidden = !!b.dataset.on;
      if (!LIVE) { VOLS = VOLS.map(v => v.id === id ? { ...v, hidden } : v); render(); toast((hidden ? "Hidden" : "Shown") + " (demo)"); return; }
      b.disabled = true;
      try { VOLS = (await api("/api/volunteers/team", { method: "PATCH", body: JSON.stringify({ id, hidden }) })).volunteers || []; render(); toast(hidden ? "Hidden from the Volunteers page" : "Back on the Volunteers page"); }
      catch (e) { b.disabled = false; toast(e.message || "Could not save."); }
    });
  }
  async function chSave(url, method, body, done) {
    if (!LIVE) {
      if (method === "POST") C.list.push({ id: Date.now(), active: true, visits: 0, ...body });
      else { const c = chById(Number(url.split("/").pop())); if (c) Object.assign(c, body); }
      chEdit = null; render(); toast(done + " (demo)"); return;
    }
    try { const r = await api(url, { method, body: JSON.stringify(body) }); C.list = r.champions; chEdit = null; render(); toast(done); }
    catch (e) { toast(e.message || "Could not save."); }
  }
  function wireChampions() {
    app.querySelectorAll("[data-chd]").forEach(b => b.onclick = () => { chDistrict = b.dataset.chd; render(); });
    app.querySelectorAll("[data-chedit]").forEach(b => b.onclick = () => { chEdit = Number(b.dataset.chedit); render(); });
    app.querySelectorAll("[data-chcancel]").forEach(b => b.onclick = () => { chEdit = null; render(); });
    app.querySelectorAll("[data-chact]").forEach(b => b.onclick = () => { const c = chById(Number(b.dataset.chact)); chSave(`/api/portal/champions/${c.id}`, "PATCH", { active: !c.active }, c.active ? "Paused" : "Active again"); });
    app.querySelectorAll("[data-chform]").forEach(f => f.onsubmit = e => {
      e.preventDefault(); const b = Object.fromEntries(new FormData(f)); const id = f.dataset.chform;
      chSave(id ? `/api/portal/champions/${id}` : "/api/portal/champions", id ? "PATCH" : "POST", b, id ? "Saved" : "Champion added");
    });
  }

  const PREVIEW_KEYS = ["details", "called", "takenAt", "verifiedBy", "verifiedAt", "approvedBy", "approvedAt", "approvedOverride", "plan"];
  async function save(s, patch, note, done) {
    if (!LIVE) { if (note) addNote(s, note); Object.assign(s, patch); render(); if (done) toast(done + " (demo)"); return true; }
    try {
      const r = await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}`, { method: "PATCH", body: JSON.stringify({ ...patch, note: note || "" }) });
      const i = D.suggestions.findIndex(x => x.id === s.id);
      if (i >= 0) { const old = D.suggestions[i], nw = r.suggestion; PREVIEW_KEYS.forEach(k => { if (old[k] !== undefined && nw[k] === undefined) nw[k] = old[k]; }); D.suggestions[i] = nw; }
      render(); if (done) toast(done); return true;
    } catch (e) { toast(e.message || "Could not save. Check your connection."); render(); return false; }
  }
  function wireOnboard(s) {
    const o = JSON.parse(JSON.stringify(ob(s)));
    const put = () => save(s, { onboard: o });
    app.querySelectorAll("[data-ob]").forEach(c => c.onchange = () => { o[c.dataset.ob] = c.checked; put(); });

    const t = app.querySelector("[data-ob-test]");
    if (t) t.onclick = () => { o.test = true; save(s, { onboard: o }, "Practice feedback message received. They know how to give feedback and report a concern.", "Practice message received"); };
  }
  function wireDetail(id) {
    const s = D.suggestions.find(x => x.id === id); if (!s) return;
    wireOnboard(s); wireFlow(s); wireReview(s);
    const cp = app.querySelector("[data-champ]");
    if (cp) cp.onchange = () => { const c = chById(Number(cp.value)); save(s, { champion: c ? c.id : null }, c ? `${c.name} (${c.district}) will visit.` : "No Champion chosen now.", "Saved"); };
    const sel = app.querySelector("[data-assign]");
    if (sel) sel.onchange = () => { s.takenAt = sel.value ? NOW.toISOString() : ""; save(s, { assigned: sel.value }, sel.value ? `${sel.value} is looking after this.` : "Nobody is looking after this now.", "Saved"); };
    app.querySelectorAll("[data-act]").forEach(btn => btn.onclick = () => {
      const act = btn.dataset.act;
      if (act === "visit") { const v = app.querySelector("[data-visit]").value; return save(s, { status: "visit", visit: v }, `Visit planned for ${fmtDay(v)}.`, "Visit planned"); }
      if (act === "verified") { s.verifiedBy = D.user.name; s.verifiedAt = NOW.toISOString(); }
      if (act === "verified") return save(s, { status: "verified" }, LIVE ? "Visited. The need is real." : "Visited. The need is real. A short \"How did we do?\" form was sent to the requester.", "Verified");
      if (act === "declined") return save(s, { status: "declined" }, "Marked not suitable.", "Not suitable");
      if (act === "new") return save(s, { status: "new" }, "Reopened.", "Reopened");
      if (act === "project") {
        const d0 = det(s), q0 = plan(s);
        if (LIVE) {
          btn.disabled = true;
          api(`/api/portal/suggestions/${encodeURIComponent(s.id)}/project`, { method: "POST", body: "{}" })
            .then(r => { s.status = "project"; s.project = r.slug; addNote(s, "Turned into an Initiated project."); render(); toast("Project created. It is on the website now."); })
            .catch(e => { btn.disabled = false; toast(e.message || "Could not create the project"); });
          return;
        }
        const slug = (d0.title || s.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
        save(s, { status: "project" }, "Turned into an Initiated project.", LIVE ? "Marked as a project. The project editor goes live in the next step." : "").then(ok => {
          if (!ok || LIVE) return;
          if (!P.some(p => p.slug === slug)) P.unshift({ title: d0.title || s.title, slug, theme: s.category === "Other" ? "Trips & Events" : s.category, status: "Planning",
            location: [s.village, s.city].filter(Boolean).join(", ") || s.location.split(",")[0], city: s.city || s.location.split(",")[0], reach: howMany(s.children), organization: d0.org || "Raavanaa",
            started: "October 2026", verified: true, budget: q0.lines.map(x => ({ item: x.item, amount: num(x.amount) })), goal: q0.lines.reduce((a, x) => a + num(x.amount), 0), funders: [], steps: [],
            expectations: q0.expect.filter(Boolean).map(text => ({ text })), updates: [], photos: [], media: [],
            people: { requested_by: [s.contact, d0.org].filter(Boolean).join(", "), requested_on: s.received.slice(0, 10), verified_by: s.verifiedBy || "", verified_on: (s.verifiedAt || "").slice(0, 10), approved_by: s.approvedBy || "", approved_on: (s.approvedAt || "").slice(0, 10) },
            summary: (d0.story || s.description).split("\n")[0], story: `## The need and the plan\n\n${d0.story || s.description}`, cover: "", fromSuggestion: s.id, isNew: true });
          s.project = slug; location.hash = `#/projects/${slug}`; toast("Project created (demo)");
        });
      }
    });
    app.querySelector(".pt-note-form").onsubmit = async e => {
      e.preventDefault(); const t = e.target.querySelector("textarea").value.trim(); if (!t) return;
      if (!LIVE) { addNote(s, t); render(); toast("Note added (demo)"); return; }
      try { const r = await api(`/api/portal/suggestions/${encodeURIComponent(s.id)}/notes`, { method: "POST", body: JSON.stringify({ text: t }) });
        const i = D.suggestions.findIndex(x => x.id === s.id); if (i >= 0) D.suggestions[i] = r.suggestion; render(); toast("Note added");
      } catch (err) { toast(err.message || "Could not save the note."); }
    };
  }
  const addNote = (s, text) => s.notes.push({ by: D.user.name, at: NOW.toISOString(), text });

  // ---------- Sign in (Netlify Identity) ----------
  let LIVE = false, ME = null;
  async function api(url, opts = {}) {
    const r = await fetch(url, { credentials: "same-origin", ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
    let j = {}; try { j = await r.json(); } catch (e) { /* not JSON */ }
    if (!r.ok) { const err = new Error(j.error || `Error ${r.status}`); err.status = r.status; throw err; }
    return j;
  }
  const identity = () => import("https://esm.sh/@netlify/identity");
  // Call the first function the Identity library provides from a list of names (guards against small API differences).
  const idCall = (id, names, ...args) => { const n = names.find(k => typeof id[k] === "function"); if (!n) throw new Error("This sign-in step is not available. Ask the admin for help."); return id[n](...args); };
  function signIn(msg = "", mode = "login", token = "") {
    document.body.classList.add("pt-signedout");
    app.innerHTML = `<section class="pt-login">
      <img src="/img/logo.webp?v=6" alt="Raavanaa" width="900" height="298">
      <span class="pt-ribbon">Team</span>
      <h1 data-rot="title">${mode === "invite" ? "Welcome to the <em>team</em>" : mode === "recovery" ? "Choose a new <em>password</em>" : "Team <em>sign in</em>"}</h1>
      <p class="pt-sub" data-rot="sub">${mode === "invite" ? "Choose a password for your new portal account." : mode === "recovery" ? "Type your new password." : "For the Raavanaa team only."}</p>
      <figure class="pt-login-hero"><picture><source srcset="/img/members-bridge.webp" type="image/webp"><img src="/img/members-bridge.jpg" alt="" width="941" height="395"></picture>
        <figcaption data-rot="cap">A bridge between people who need a hand and people ready to give one.</figcaption></figure>
      ${mode === "login" ? `<div class="pt-tabs2" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="in">Sign in</button><button type="button" role="tab" aria-selected="false" data-tab="join">Join</button></div>` : ""}
      <form class="pt-card" id="pt-login">
        ${mode === "login" ? `<label class="pt-field">Email<input name="email" type="email" autocomplete="username" required></label>` : ""}
        <label class="pt-field">Password<input name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="8" required></label>
        <button class="pt-btn" type="submit">${mode === "login" ? "Sign in" : "Save password"}</button>
        ${mode === "login" ? `<button class="pt-btn ghost pt-google" type="button" data-google>Continue with Google</button>` : ""}
        <p class="pt-login-msg" role="status">${esc(msg)}</p>
      </form>
      ${mode === "login" ? `<form class="pt-card pt-paste" id="pt-paste" hidden>
        <p class="pt-join-note">An admin adds your email in the portal. Then make your account at <a href="/members">raavanaa.org/members</a> with that same email (or Continue with Google) and come back here. Got an invite email instead? Paste its link here.</p>
        <label class="pt-field">Invite or password email link<input name="link" placeholder="Long-press the button in the email, Copy link, paste" autocomplete="off"></label>
        <button class="pt-btn ghost" type="submit">Continue</button>
      </form>
      <p class="pt-sub"><button type="button" class="pt-link" data-forgot>Forgot your password?</button> · <a href="?demo=1">Look around the demo</a></p>` : ""}
    </section>`;
    const f = document.getElementById("pt-login"), out = f.querySelector(".pt-login-msg");
    f.onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(f); out.textContent = "One moment...";
      try {
        const id = await identity();
        if (mode === "invite") await idCall(id, ["acceptInvite"], token, fd.get("password"));
        else if (mode === "recovery") {
          if (typeof id.recoverPassword === "function") await id.recoverPassword(token, fd.get("password"));
          else { await idCall(id, ["handleAuthCallback"]); await idCall(id, ["updateUser"], { password: fd.get("password") }); }
        }
        else await idCall(id, ["login"], fd.get("email"), fd.get("password"));
        location.replace("/portal#/dashboard"); location.reload();
      } catch (err) { out.textContent = err && err.message ? err.message : "That did not work. Check the email and password."; }
    };
    // Three messages take turns at the top and under the picture (SURESH, 10 Nov 2026).
    if (mode === "login" && window.raavRotate) window.raavRotate(app, [
      { title: "Team <em>sign in</em>", sub: "For the Raavanaa team only.", cap: "A bridge between people who need a hand and people ready to give one." },
      { title: "Thank you for <em>showing up</em>", sub: "Every request you check brings a child closer to a day of joy.", cap: "Behind every smile is someone who said yes." },
      { title: "Welcome <em>back</em>", sub: "Calls, visits and approvals for the requests waiting today.", cap: "Small steps, done with care, make big days happen." },
    ]);
    app.querySelectorAll("[data-tab]").forEach(t => t.onclick = () => {
      const join = t.dataset.tab === "join";
      app.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", String(x === t)));
      document.getElementById("pt-login").hidden = join; document.getElementById("pt-paste").hidden = !join;
      const fp = app.querySelector("[data-forgot]"); if (fp) fp.closest("p").hidden = join;
    });
    const pf = document.getElementById("pt-paste");
    if (pf) pf.onsubmit = e => {
      e.preventDefault(); const v = String(new FormData(pf).get("link") || "");
      const inv = v.match(/invite_token=([^&\s]+)/), rec = v.match(/recovery_token=([^&\s]+)/);
      if (inv) signIn("", "invite", decodeURIComponent(inv[1]));
      else if (rec) signIn("", "recovery", decodeURIComponent(rec[1]));
      else out.textContent = "That link has no invite or reset code. Copy the link from the button in the email.";
    };
    // Google sign-in (20 Nov 2026): cousins and friends who joined with Google have no password.
    const gg = app.querySelector("[data-google]");
    if (gg) gg.onclick = async () => { try { const id = await identity(); id.oauthLogin("google"); } catch (err) { if (!/Redirecting/i.test(String(err && err.message))) out.textContent = "Google sign-in is not available right now."; } };
    const fg = app.querySelector("[data-forgot]");
    if (fg) fg.onclick = async () => {
      const email = f.querySelector("[name=email]").value.trim(); if (!email) { out.textContent = "Type your email first, then tap Forgot."; return; }
      try { const id = await identity(); await idCall(id, ["requestPasswordRecovery", "sendPasswordRecovery", "requestRecovery"], email); out.textContent = "If that email is on the team, a reset link is on its way."; }
      catch (err) { out.textContent = "Could not send the reset email. Ask the admin to send you a reset link from Netlify."; }
    };
  }
  async function signOut() { try { const id = await identity(); await idCall(id, ["logout"]); } catch (e) { /* ignore */ } location.replace("/portal"); }
  // Links from Identity emails (invite, password reset, email confirmation) arrive with a token in the address.
  async function handleTokens() {
    const h = location.hash;
    const inv = h.match(/invite_token=([^&]+)/); if (inv) { history.replaceState(null, "", "/portal"); signIn("", "invite", decodeURIComponent(inv[1])); return true; }
    const rec = h.match(/recovery_token=([^&]+)/); if (rec) { history.replaceState(null, "", "/portal"); signIn("", "recovery", decodeURIComponent(rec[1])); return true; }
    if (/access_token=|error=/.test(h)) { // back from "Continue with Google"
      try { const id = await identity(); await id.handleAuthCallback(); } catch (e) { /* the sign-in form shows below */ }
      history.replaceState(null, "", "/portal#/dashboard"); return false;
    }
    if (/(confirmation_token|email_change_token)=/.test(h)) {
      try { const id = await identity(); const res = await id.handleAuthCallback(); history.replaceState(null, "", "/portal");
        void res; }
      catch (e) { history.replaceState(null, "", "/portal"); signIn("That link has expired. Ask for a new one."); return true; }
    }
    return false;
  }

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
      <ol class="pt-howto">${steps}</ol>
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
    if (n === 1) return [["Visited and verified", p.verified ? 1 : 0, "verified"], ["Budgeted", b.goal > 0 ? 1 : 0, null], ["Funded", b.goal ? Math.min(1, b.raised / b.goal) : 0, null]];
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
  const CATS = ["Trips & Events", "Livelihood", "Education"], CITIES = ["Kilinochchi", "Batticaloa", "Jaffna", "Kandy"];
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
          ${key ? `<label><input type="checkbox" data-ck="${key}" ${done >= 1 ? "checked" : ""}> <span>${esc(name)}</span></label>` : `<span class="pt-auto"><i>${done >= 1 ? "✓" : done > 0 ? Math.round(done * 100) + "%" : "–"}</i>${esc(name)}</span><small>${name === "Funded" ? "From received pledges" : name === "Budgeted" ? "From the Budget tab" : n === 2 ? '<a href="#/day/' + esc(p.slug) + '">From Day preparation</a>' : "Automatic"}</small>`}</li>`).join("")}</ul>
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
      <ol class="pt-howto">${[1, 2, 3].map(k => `<li class="${k < n ? "done" : k === n ? "now" : ""}"><i></i><span>${STAGE[k][0]}</span></li>`).join("")}</ol>
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
  // "I'd like to give" (SURESH, 12 Nov 2026): no money is taken on the website. Each person here asked to give;
  // a volunteer replies to them personally (bank details only in that reply) and marks what happened.
  const ASK_ST = { new: ["New", "amber"], replied: ["Replied", "blue"], received: ["Gift received", "green"], closed: ["Closed", "gray"] };
  function asksHTML() {
    if (!ASKS) return "";
    const open = ASKS.filter(x => x.status === "new" || x.status === "replied"), done = ASKS.filter(x => x.status === "received" || x.status === "closed");
    const what = x => x.kind === "member" ? "a gift every month" : x.project ? projOf(x.project).title : "the Raavanaa Fund";
    const reach = c => /@/.test(c) ? `<a href="mailto:${esc(c)}">${esc(c)}</a>` : `<a href="tel:${esc(c.replace(/[^\d+]/g, ""))}">${esc(c)}</a>`;
    const row = x => { const st = ASK_ST[x.status] || ASK_ST.new, t = x.tribute; return `<li class="pt-pl pt-ask ${esc(x.status)}">
        <span class="pt-av">${esc(initials(x.name))}</span>
        <span class="pt-row-main"><b>${esc(x.name)} <span class="pt-pill ${st[1]}">${st[0]}</span></b>
          <small>${esc(x.id)} · ${fmtDay(String(x.at))} · ${reach(String(x.contact || ""))}${x.lang === "ta" ? " · wrote in Tamil" : ""}</small>
          <small><b>${esc(x.amount || "Amount not said")}</b> for ${esc(what(x))}${t ? ` · ${esc(t.words)} ${esc(t.name)}${t.note ? ` (“${esc(t.note)}”)` : ""}${t.day ? ` · remind every year before ${esc(t.day)}` : ""}` : ""}${x.moment ? ` · family page /m/${esc(x.moment)}` : ""}</small>
          <small>List the gift as: <b>${x.listing === "own" && x.listAs ? "“" + esc(x.listAs) + "”" : x.listing === "anonymous" ? "A friend of Raavanaa (anonymous)" : x.listing === "name" ? esc(x.name) + ", without the amount" : esc(x.name) + ", with the amount"}</b></small>
          ${x.message ? `<small class="pt-ask-msg">“${esc(x.message)}”</small>` : ""}
          ${x.by && x.status !== "new" ? `<small>${st[0]} · ${esc(x.by)}${x.handledAt ? " · " + fmtDay(String(x.handledAt)) : ""}</small>` : ""}</span>
        <span class="pt-row-side">${x.status === "new" ? `<button type="button" class="pt-btn sm" data-ask="${esc(x.id)}" data-to="replied">I have replied</button>` : ""}${x.status === "replied" ? `<button type="button" class="pt-btn sm" data-ask="${esc(x.id)}" data-to="received">Gift received</button>` : ""}${x.status === "new" || x.status === "replied" ? `<button type="button" class="pt-btn ghost sm" data-ask="${esc(x.id)}" data-to="closed">Close</button>` : `<button type="button" class="pt-btn ghost sm" data-ask="${esc(x.id)}" data-to="new">Reopen</button>`}</span></li>`; };
    return `<section class="pt-card pt-asks"><h2>People who want to give <span class="pt-count">${open.length}</span></h2>
      <p class="pt-sub">From the “I'd like to give” form on the website. Reply to each person yourself, from the official email or by WhatsApp, and send bank details only in that reply. When the gift arrives, mark it here and add it to the project's sponsors, listed the way the giver asked.</p>
      ${open.length ? `<ul class="pt-list big">${open.map(row).join("")}</ul>` : `<p class="pt-sub"><b>Nobody is waiting for a reply.</b></p>`}
      ${done.length ? `<details class="pt-asks-done"><summary>Finished (${done.length})</summary><ul class="pt-list big">${done.map(row).join("")}</ul></details>` : ""}</section>`;
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
      ${asksHTML()}
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
    app.querySelectorAll("[data-ask]").forEach(b => b.onclick = async () => {
      b.disabled = true;
      try { const r = await api(`/api/portal/pledges/${encodeURIComponent(b.dataset.ask)}`, { method: "PATCH", body: JSON.stringify({ status: b.dataset.to }) }); ASKS = r.pledges; render(); toast("Saved"); }
      catch (e) { toast(e.message || "Could not save"); b.disabled = false; }
    });
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
  // Live Team & logins (SURESH, 20 Nov 2026): add cousins and friends by email so they can see the dashboard.
  let ACCESS = null;
  const ROLE_NAME = { admin: "Admin", team: "Team" };
  function liveTeam() {
    if (!ACCESS) { api("/api/portal/access").then(a => { ACCESS = a; render(); }).catch(e => { ACCESS = { people: [], canEdit: false, error: e.message }; render(); }); return `<p class="pt-loading">Loading…</p>`; }
    const A = ACCESS, invite = "I've added you to the Raavanaa team dashboard. Open https://raavanaa.org/members, tap Join and use this email (or Continue with Google). Once you're signed in, it opens the dashboard.";
    return `
      <header class="pt-head"><div><p class="pt-kicker">Team &amp; logins</p><h1>Who can open the dashboard</h1>
        <p class="pt-sub">Add someone's email here. When they sign in on raavanaa.org with that email, they see this dashboard.</p></div></header>
      ${A.error ? `<p class="pt-private">${esc(A.error)}</p>` : ""}
      <div class="pt-grid">
        <section class="pt-card"><h2>People with access <span class="pt-count">${A.people.length}</span></h2>
          <ul class="pt-list">${A.people.map(m => `<li class="pt-pl"><span class="pt-av">${esc(initials(m.name || m.email))}</span>
            <span class="pt-row-main"><b>${m.email === A.me ? "You" : esc(m.name || m.email.split("@")[0])}</b><small>${esc(m.email)} · ${m.owner ? "Owner" : ROLE_NAME[m.role] || "Team"}${m.addedBy ? " · added by " + esc(m.addedBy.split("@")[0]) : ""}</small></span>
            <span class="pt-row-side">${A.canEdit && !m.owner && m.email !== A.me ? `<select class="pt-sel sm" data-arole="${esc(m.email)}" aria-label="Role"><option value="admin" ${m.role === "admin" ? "selected" : ""}>Admin</option><option value="team" ${m.role === "team" ? "selected" : ""}>Team</option></select>
              <button type="button" class="pt-link" data-adel="${esc(m.email)}">Remove</button>` : ""}</span></li>`).join("") || `<li class="pt-empty">Only people given a role in Netlify so far.</li>`}</ul>
          ${A.canEdit ? `<form class="pt-invite" data-addaccess><input name="name" placeholder="Name" aria-label="Name"><input name="email" type="email" placeholder="Their email" required aria-label="Email">
            <select name="role" aria-label="Role"><option value="admin">Admin</option><option value="team">Team</option></select><button class="pt-btn" type="submit">Add</button></form>` : `<p class="pt-sub">Only an admin can add people.</p>`}
        </section>
        <section class="pt-card"><h2>How they get in</h2>
          <ol class="pt-howto"><li>Add their email here.</li><li>They open <b>raavanaa.org/members</b>, tap <b>Join</b> with that email, or <b>Continue with Google</b>.</li><li>Once signed in, they land on this dashboard. Next time they can also use <b>raavanaa.org/portal</b>.</li></ol>
          <p class="pt-sub">Send them this message:</p>
          <p class="pt-private" style="background:#f4efe2;color:#3b3226">${esc(invite)}</p>
          <p><button type="button" class="pt-btn ghost" data-copyinvite>Copy message</button> <a class="pt-btn ghost" href="https://wa.me/?text=${encodeURIComponent(invite)}" target="_blank" rel="noopener">Send on WhatsApp</a></p>
        </section>
      </div>
      <section class="pt-card" style="margin-top:14px"><h2>What each role can do</h2>
        <div class="pt-tablewrap"><table class="pt-perms"><thead><tr><th></th><th>Admin</th><th>Team</th></tr></thead>
        <tbody>${[["See the dashboard, suggestions, projects and traffic", 1, 1], ["Plan visits, add notes, mark pledges", 1, 1], ["Approve a verified request", 1, 0], ["Add or remove people here", 1, 0]].map(([l, a, t]) => `<tr><td>${l}</td>${[a, t].map(v => `<td class="${v ? "y" : "n"}">${v ? "✓" : "–"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
  }
  function wireLiveTeam() {
    const send = async (method, url, body, done) => { try { await api(url, { method, body: body ? JSON.stringify(body) : undefined }); ACCESS = null; render(); toast(done); } catch (e) { toast(e.message); } };
    const f = app.querySelector("[data-addaccess]");
    if (f) f.onsubmit = e => { e.preventDefault(); const d = new FormData(f); send("POST", "/api/portal/access", { name: d.get("name"), email: d.get("email"), role: d.get("role") }, "Added. Send them the message."); };
    app.querySelectorAll("[data-arole]").forEach(s2 => s2.onchange = () => { const m = ACCESS.people.find(x => x.email === s2.dataset.arole); send("POST", "/api/portal/access", { email: m.email, name: m.name, role: s2.value }, "Role changed"); });
    app.querySelectorAll("[data-adel]").forEach(b => b.onclick = () => { const em = b.dataset.adel; if (!confirm(`Take dashboard access away from ${em}?`)) return; send("DELETE", "/api/portal/access/" + encodeURIComponent(em), null, "Access removed"); });
    const c = app.querySelector("[data-copyinvite]");
    if (c) c.onclick = () => { const t = c.closest("section").querySelector(".pt-private").textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Message copied"), () => toast(t)); };
  }
  function wireTeam() {
    app.querySelectorAll("[data-mrole]").forEach(s2 => s2.onchange = () => { D.members[+s2.dataset.mrole].role = s2.value; render(); toast("Role changed (demo)"); });
    app.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { const m = D.members[+b.dataset.mdel]; if (!confirm(`Remove ${m.name}'s access?`)) return; D.members.splice(+b.dataset.mdel, 1); render(); toast("Access removed (demo)"); });
    app.querySelector(".pt-invite").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); D.members.push({ name: String(f.get("name")).trim(), email: String(f.get("email")).trim(), role: f.get("role"), active: "", pending: true, twofa: false }); render(); toast("Invite sent (demo)"); };
    app.querySelector("[data-safe]").onchange = e => { D.safeguard = e.target.value; render(); };
    app.querySelector("[data-rev]").onchange = e => { D.reviewer = e.target.value; render(); };
  }

  // ---------- Traffic (SURESH, 16 Nov 2026) ----------
  // The site's own visit record (track.js -> /api/hit -> site_hits). Free, no cookies, nothing personal.
  // Netlify keeps only 7 days; this keeps everything, and a nightly GitHub job saves a daily copy (branch traffic-record).
  let TR = null, trBusy = false;
  const trDay = d => d.toISOString().slice(0, 10);
  let trRange = (() => { const to = new Date(); return { key: "7", from: trDay(new Date(to.getTime() - 6 * 864e5)), to: trDay(to) }; })();
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } })();
  const SOURCES = {
    whatsapp: ["WhatsApp", "From a WhatsApp campaign link or WhatsApp's own browser"], facebook: ["Facebook", ""], instagram: ["Instagram", ""],
    google: ["Google", "Google search or the Google app"], search: ["Other search engines", "Bing, DuckDuckGo, Yahoo…"], x: ["X (Twitter)", ""],
    youtube: ["YouTube", ""], tiktok: ["TikTok", ""], linkedin: ["LinkedIn", ""], raavanaapost: ["RaavanaaPost", "Links on our news site"],
    email: ["Email", ""], sms: ["Text message", ""], print: ["Poster or QR code", ""], other: ["Other websites", ""],
    direct: ["Direct or WhatsApp (unknown)", "Typed in, a saved link, or an app that hides itself (WhatsApp does). Use campaign links to see these."]
  };
  const SHARE_NAMES = { wa: "WhatsApp", fb: "Facebook", x: "X", link: "Copy link", ig: "Instagram story", more: "Phone share menu", phone: "Phone share (memory pages)" };
  const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pageName = path => {
    const p = String(path || "").replace(/^\/ta(?=\/|$)/, ""), ta = /^\/ta(\/|$)/.test(path) ? " (Tamil)" : "";
    const fixed = { "": "Home", "/": "Home", "/overview": "Home", "/moment": "Gift a Moment", "/projects": "All projects", "/initiate": "Start a project (request)", "/create": "Create a Moment",
      "/members": "Sign in / Join", "/about": "About", "/contact": "Contact", "/give": "Give form", "/fund": "Raavanaa Fund", "/smile-map": "Smile Map", "/how-it-works": "How it works",
      "/initiated": "Initiated projects", "/activated": "Activated projects", "/impact": "Impact projects", "/privacy": "Privacy", "/thank-you": "Thank you" };
    if (p in fixed) return fixed[p] + ta;
    let m = p.match(/^\/projects\/([^/]+)(\/money)?$/);
    if (m) { const pr = P.find(x => x.slug === m[1]); return (pr ? pr.title : m[1]) + (m[2] ? " · money page" : "") + ta; }
    if (/^\/m\//.test(p)) return "Memory page " + p.slice(3) + ta;
    if (/^\/e\//.test(p)) return "Vouching page" + ta;
    return p + ta;
  };
  const country = c => { if (c === "??") return "Unknown"; try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c) || c; } catch (e) { return c; } };
  const flag = c => /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0))) : "🌐";
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const change = (a, b) => {
    if (!b && !a) return `<small class="tr-ch">no change</small>`;
    if (!b) return `<small class="tr-ch up">new</small>`;
    const c = Math.round((a - b) / b * 100);
    return `<small class="tr-ch ${c > 0 ? "up" : c < 0 ? "down" : ""}">${c > 0 ? "▲" : c < 0 ? "▼" : ""} ${Math.abs(c)}% <span>vs before</span></small>`;
  };
  const acted = t => (t.give || 0) + (t.memory || 0) + (t.request || 0) + (t.vouch || 0);

  // Invented numbers for the design preview (no sign-in). The live portal never shows these.
  function trDemo() {
    const from = new Date(trRange.from + "T00:00:00Z"), to = new Date(trRange.to + "T00:00:00Z"), days = Math.round((to - from) / 864e5) + 1;
    let seed = 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const daily = [...Array(days)].map((_, i) => { const v = Math.round(18 + i * 0.6 + r() * 22 + (i % 7 === 5 ? 25 : 0)); return { day: trDay(new Date(from.getTime() + i * 864e5)), visits: v, views: Math.round(v * 2.6), actions: Math.round(v * 0.05 + r()), shares: Math.round(v * 0.12) }; });
    const visits = daily.reduce((a, d) => a + d.visits, 0), views = daily.reduce((a, d) => a + d.views, 0);
    const split = (list) => list.map(([key, share, act, sh, pg]) => ({ key, visits: Math.round(visits * share), acted: Math.round(visits * share * act), shares: Math.round(visits * share * sh), pages: pg }));
    return {
      demo: true, tz: TZ,
      now: { views, visits, shares: Math.round(visits * 0.12), give: Math.round(visits * 0.02), memory: Math.round(visits * 0.015), request: Math.round(visits * 0.01), vouch: Math.round(visits * 0.008), install: Math.round(visits * 0.006), app_visits: Math.round(visits * 0.04) },
      before: { views: Math.round(views * 0.8), visits: Math.round(visits * 0.78), shares: Math.round(visits * 0.09), give: Math.round(visits * 0.015), memory: Math.round(visits * 0.01), request: Math.round(visits * 0.01), vouch: 2, install: 1 },
      daily,
      sources: split([["direct", .44, .03, .1, 2.1], ["whatsapp", .22, .08, .2, 3.2], ["facebook", .16, .05, .12, 2.6], ["google", .08, .04, .02, 2.4], ["instagram", .05, .06, .1, 2.2], ["raavanaapost", .03, .1, .05, 3.8], ["other", .02, 0, 0, 1.4]]),
      campaigns: split([["wa-kandy-trip", .14, .1, .22, 3.4], ["fb-memory-launch", .09, .06, .14, 2.8], ["ig-bio", .03, .05, .1, 2.0], ["qr-temple-poster", .01, .2, 0, 4.1]]),
      pages: [["/overview", .3], ["/moment", .17], ["/projects/pussellawa-kandy-trip", .14], ["/projects", .09], ["/initiate", .06], ["/projects/pussellawa-kandy-trip/money", .05], ["/m/demo4x8k", .04], ["/about", .03]].map(([key, s]) => ({ key, views: Math.round(views * s), visits: Math.round(visits * s * 1.3) })),
      countries: [["CA", .46], ["GB", .14], ["LK", .12], ["US", .08], ["CH", .06], ["DE", .05], ["AU", .04], ["FR", .03], ["??", .02]].map(([key, s]) => ({ key, visits: Math.round(visits * s) })),
      devices: [["phone", .71], ["computer", .22], ["app", .05], ["tablet", .02]].map(([key, s]) => ({ key, visits: Math.round(visits * s) })),
      hours: [...Array(24)].map((_, h) => ({ key: h, views: Math.round(views / 40 * (0.3 + Math.max(0, Math.sin((h - 6) / 24 * Math.PI * 2)) + (h >= 19 && h <= 22 ? 0.9 : 0))) })),
      weekdays: [1, 2, 3, 4, 5, 6, 7].map(d => ({ key: d, views: Math.round(views / 9 * (d >= 6 ? 1.5 : 1)) })),
      shares: [["wa", .55], ["link", .2], ["fb", .12], ["phone", .08], ["ig", .05]].map(([key, s]) => ({ key, shares: Math.round(visits * 0.12 * s) })),
      refs: [{ key: "l.facebook.com", visits: 40 }, { key: "www.google.com", visits: 22 }, { key: "raavanaapost.raavanaa.org", visits: 9 }]
    };
  }
  async function loadTraffic() {
    await null;
    if (trBusy) return; trBusy = true;
    if (!LIVE) { TR = trDemo(); trBusy = false; render(); return; }
    try { TR = await api(`/api/portal/traffic?from=${trRange.from}&to=${trRange.to}&tz=${encodeURIComponent(TZ)}`); }
    catch (e) { TR = { error: e.message || "Could not load the traffic record." }; }
    trBusy = false; render();
  }
  const bars = (rows, val, label, title, cls = "") => {
    const max = Math.max(1, ...rows.map(val));
    return `<div class="tr-bars ${cls}" role="img" aria-label="${esc(label)}">${rows.map(r => `<span class="tr-b" title="${esc(title(r))}"><i style="height:${Math.max(val(r) ? 3 : 0, Math.round(val(r) / max * 100))}%"></i></span>`).join("")}</div>`;
  };
  const rank = (rows, name, val, extra = () => "", note = () => "") => {
    const max = Math.max(1, ...rows.map(val));
    return rows.length ? `<ol class="tr-rank">${rows.map(r => `<li><div class="tr-rk"><span class="tr-nm">${name(r)}${note(r) ? `<small>${note(r)}</small>` : ""}</span><b>${val(r).toLocaleString("en-US")}</b>${extra(r)}</div><span class="tr-bar"><i style="width:${Math.max(2, Math.round(val(r) / max * 100))}%"></i></span></li>`).join("")}</ol>`
      : `<p class="pt-sub">Nothing counted in this period yet.</p>`;
  };
  function traffic() {
    let off = false; try { off = localStorage.getItem("raav-notrack") === "1"; } catch (e) { /* storage blocked */ }
    const chips = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["365", "1 year"]];
    const head = `
      <header class="pt-head"><div><p class="pt-kicker">Traffic</p><h1>Who is visiting Raavanaa</h1>
        <p class="pt-sub">raavanaa.org's own record of visits: where people came from, what they looked at, and what it led to. Free, no cookies, nothing personal. Kept for good, with a daily copy saved in GitHub.</p></div></header>
      <div class="tr-period">
        <div class="pt-chips">${chips.map(([k, l]) => `<button type="button" data-trp="${k}" aria-pressed="${trRange.key === k}">${l}</button>`).join("")}</div>
        <form class="tr-dates" data-trdates><label>From <input type="date" name="from" value="${trRange.from}" required></label><label>To <input type="date" name="to" value="${trRange.to}" required></label><button class="pt-btn ghost" type="submit">Show</button></form>
      </div>`;
    if (!TR) { loadTraffic(); return head + `<p class="pt-sub">Loading…</p>`; }
    if (TR.error) return head + `<p class="pt-sub">${esc(TR.error)}</p>`;
    const n = TR.now, b = TR.before || {}, days = TR.daily || [];
    const visitsTotal = (TR.sources || []).reduce((a, s) => a + s.visits, 0) || 1;
    const srcName = k => (SOURCES[k] || [k])[0];
    const srcNote = k => (SOURCES[k] || [, ""])[1];
    const actedCol = r => `<span class="tr-x">${[r.acted ? `${r.acted} led to something (${pct(r.acted, r.visits)}%)` : "", r.shares ? `${r.shares} share${r.shares === 1 ? "" : "s"}` : "", r.pages ? `${r.pages} pages each` : ""].filter(Boolean).join(" · ")}</span>`;
    const allDays = (() => { const out = [], from = new Date(trRange.from + "T00:00:00Z"), to = new Date(trRange.to + "T00:00:00Z"); const by = new Map(days.map(d => [d.day, d])); for (let t = from.getTime(); t <= to.getTime(); t += 864e5) { const k = trDay(new Date(t)); out.push(by.get(k) || { day: k, visits: 0, views: 0, actions: 0, shares: 0 }); } return out; })();
    const hours = [...Array(24)].map((_, h) => (TR.hours || []).find(x => x.key === h) || { key: h, views: 0 });
    const wk = [1, 2, 3, 4, 5, 6, 7].map(d => (TR.weekdays || []).find(x => x.key === d) || { key: d, views: 0 });
    const topHour = hours.reduce((a, h) => h.views > a.views ? h : a, hours[0]), topDay = wk.reduce((a, d) => d.views > a.views ? d : a, wk[0]);
    const hh = h => `${String(h).padStart(2, "0")}:00`;
    return head + `
      ${TR.demo ? `<p class="tr-demo">Design preview with invented numbers. Signed in on raavanaa.org, this screen shows the real record.</p>` : ""}
      <section class="pt-stats tr-stats">
        <div class="pt-stat st1"><b>${n.visits.toLocaleString("en-US")}</b><span>Visits</span>${change(n.visits, b.visits)}</div>
        <div class="pt-stat st1"><b>${n.views.toLocaleString("en-US")}</b><span>Pages seen</span>${change(n.views, b.views)}</div>
        <div class="pt-stat st3"><b>${acted(n)}</b><span>Led to something</span>${change(acted(n), acted(b))}</div>
        <div class="pt-stat st2"><b>${n.shares}</b><span>Shares</span>${change(n.shares, b.shares)}</div>
      </section>
      <section class="pt-card tr-card"><h2>Visits each day</h2>
        ${bars(allDays, d => d.visits, "Visits each day", d => `${fmtDay(d.day)}: ${d.visits} visits, ${d.views} pages, ${d.actions} led to something, ${d.shares} shares`, allDays.length > 60 ? "dense" : "")}
        <div class="tr-axis"><span>${fmtDay(allDays[0].day)}</span><span>${fmtDay(allDays[allDays.length - 1].day)}</span></div>
        <p class="pt-sub">“Before” means the same number of days just before this period, so a campaign can be compared with the weeks before it: pick its dates above.</p></section>
      <div class="pt-grid">
        <section class="pt-card tr-card"><h2>Where visitors came from</h2>
          ${rank(TR.sources || [], r => esc(srcName(r.key)), r => r.visits, r => `<span class="tr-x">${pct(r.visits, visitsTotal)}% of visits</span>` + actedCol(r), r => esc(srcNote(r.key)))}
          ${(TR.refs || []).length ? `<details class="tr-more"><summary>Exact websites</summary>${rank(TR.refs, r => esc(r.key), r => r.visits)}</details>` : ""}</section>
        <section class="pt-card tr-card"><h2>Campaigns</h2>
          ${(TR.campaigns || []).length ? rank(TR.campaigns, r => esc(r.key), r => r.visits, actedCol) : `<p class="pt-sub">No campaign links used yet. Make one below and use it in a WhatsApp group, post or poster.</p>`}
          <form class="tr-maker" data-trmaker>
            <h3>Make a campaign link</h3>
            <label>Where it will be posted <select name="where" class="pt-sel">
              <option value="wa">WhatsApp group or chat</option><option value="fb">Facebook</option><option value="ig">Instagram</option><option value="email">Email</option>
              <option value="qr">Poster or QR code</option><option value="sms">Text message</option><option value="rp">RaavanaaPost</option><option value="other">Somewhere else</option></select></label>
            <label>Name of the campaign or group <input name="name" placeholder="kandy trip, toronto temple group" maxlength="40" required></label>
            <label>Page it opens <select name="page" class="pt-sel"><option value="/">Home</option><option value="/moment">Gift a Moment</option><option value="/projects">All projects</option>
              ${P.map(p => `<option value="/projects/${esc(p.slug)}">${esc(p.title)}</option>`).join("")}<option value="/initiate">Start a project</option></select></label>
            <button class="pt-btn" type="submit">Make the link</button>
            <p class="tr-link" data-trlink hidden></p>
          </form></section>
      </div>
      <div class="pt-grid">
        <section class="pt-card tr-card"><h2>What visits led to</h2>
          ${rank([["give", "“I'd like to give” sent"], ["memory", "Pages made in someone's memory"], ["request", "Project requests sent"], ["vouch", "Vouches for a request"], ["install", "App installed"]].map(([k, l]) => ({ key: k, l, v: n[k] || 0, was: b[k] || 0 })), r => esc(r.l), r => r.v, r => `<span class="tr-x">${r.was} the period before</span>`)}
        </section>
        <section class="pt-card tr-card"><h2>Share buttons pressed</h2>
          ${rank(TR.shares || [], r => esc(SHARE_NAMES[r.key] || r.key), r => r.shares)}
          <p class="pt-sub">People who press Share are spreading the word for us.</p></section>
      </div>
      <div class="pt-grid">
        <section class="pt-card tr-card"><h2>Pages people looked at</h2>
          ${rank(TR.pages || [], r => { const p = String(r.key); const link = /^\/e\//.test(p) ? "" : p; return link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(pageName(p))}</a>` : esc(pageName(p)); }, r => r.views, r => `<span class="tr-x">${r.visits} visits</span>`)}</section>
        <section class="pt-card tr-card"><h2>Countries</h2>
          ${rank(TR.countries || [], r => `${flag(r.key)} ${esc(country(r.key))}`, r => r.visits, r => `<span class="tr-x">${pct(r.visits, n.visits)}%</span>`)}</section>
      </div>
      <div class="pt-grid">
        <section class="pt-card tr-card"><h2>Phone, computer or the app</h2>
          ${rank(TR.devices || [], r => esc({ phone: "Phone", computer: "Computer", tablet: "Tablet", app: "The Raavanaa app" }[r.key] || r.key), r => r.visits, r => `<span class="tr-x">${pct(r.visits, n.visits)}%</span>`)}</section>
        <section class="pt-card tr-card"><h2>Busiest times</h2>
          <p class="pt-sub">In your time (${esc(TR.tz || TZ)}). ${topHour.views ? `Busiest around <b>${hh(topHour.key)}</b> and on <b>${DAYS[topDay.key]}</b>: a good time to post in the groups.` : ""}</p>
          ${bars(hours, h => h.views, "Pages seen by hour", h => `${hh(h.key)}: ${h.views} pages`, "hours")}
          <div class="tr-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
          ${bars(wk, d => d.views, "Pages seen by weekday", d => `${DAYS[d.key]}: ${d.views} pages`, "week")}
          <div class="tr-axis week">${wk.map(d => `<span>${DAYS[d.key]}</span>`).join("")}</div></section>
      </div>
      <section class="pt-card tr-card tr-foot">
        <label class="tr-opt"><input type="checkbox" data-notrack ${off ? "checked" : ""}> Don't count visits from this device (tick it on your own phone and computer so the team's visits don't fill the record)</label>
        <p class="pt-sub">The record started when this was published. Older visits are only in Netlify's own 7-day view. A visit is one browser tab; no IP address, cookie, name or exact place is kept. A copy of each day's totals is saved every night in GitHub (Charity-site, branch <code>traffic-record</code>).</p>
      </section>`;
  }
  function wireTraffic() {
    app.querySelectorAll("[data-trp]").forEach(btn => btn.onclick = () => {
      const k = btn.dataset.trp, to = new Date();
      trRange = { key: k, from: trDay(new Date(to.getTime() - (Number(k) - 1) * 864e5)), to: trDay(to) }; TR = null; render();
    });
    const df = app.querySelector("[data-trdates]");
    if (df) df.onsubmit = e => { e.preventDefault(); const f = new FormData(df); const a = String(f.get("from")), z = String(f.get("to")); if (a > z) { toast("“From” must be before “To”."); return; } trRange = { key: "", from: a, to: z }; TR = null; render(); };
    const mk = app.querySelector("[data-trmaker]");
    if (mk) mk.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(mk), name = String(f.get("name")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
      if (!name) { toast("Give the campaign a name."); return; }
      const page = String(f.get("page")), link = `https://raavanaa.org${page === "/" ? "/" : page}?from=${f.get("where")}-${name}`;
      const out = mk.querySelector("[data-trlink]");
      out.hidden = false; out.innerHTML = `<code>${esc(link)}</code> <button type="button" class="pt-btn ghost" data-trcopy>Copy</button><br><small>Every visit through this link shows under Campaigns as “${esc(f.get("where") + "-" + name)}”.</small>`;
      out.querySelector("[data-trcopy]").onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => toast("Link copied"), () => toast(link)); };
    };
    const nt = app.querySelector("[data-notrack]");
    if (nt) nt.onchange = () => { try { if (nt.checked) localStorage.setItem("raav-notrack", "1"); else localStorage.removeItem("raav-notrack"); toast(nt.checked ? "This device is no longer counted" : "This device is counted again"); } catch (e) { toast("This browser blocks saving the choice."); } };
  }

  function render() {
    const [page, id] = route();
    const cur = ["suggestions", "reports", "projects", "sponsors", "day", "close", "people", "champions", "volunteers", "circles", "traffic", "team"].includes(page) ? page : "dashboard";
    drawNav(cur);
    if (page === "suggestions" && id) { app.innerHTML = detail(id); wireDetail(id); }
    else if (page === "suggestions") { app.innerHTML = suggestions(); wireSuggestions(); }
    else if (page === "people") { app.innerHTML = people(); wirePeople(); }
    else if (page === "champions") { app.innerHTML = champions(); wireChampions(); }
    else if (page === "circles") { app.innerHTML = circles(); wireCircles(); }
    else if (page === "volunteers") { app.innerHTML = volunteers(); wireVolunteers(); }
    else if (page === "traffic") { app.innerHTML = traffic(); wireTraffic(); }
    else if (page === "team" && LIVE) { app.innerHTML = liveTeam(); if (ACCESS) wireLiveTeam(); }
    else if (page === "team") { app.innerHTML = team(); wireTeam(); }
    else if (page === "close") { app.innerHTML = closeDay(id); wireClose(); }
    else if (page === "day") { app.innerHTML = dayPrep(id); wireDay(); }
    else if (page === "sponsors") { app.innerHTML = sponsors(); wireSponsors(); }
    else if (page === "projects" && id) { app.innerHTML = editor(id); wireEditor(id); }
    else if (page === "projects") { app.innerHTML = projects(); wireProjects(); }
    else if (page === "reports" && id) { app.innerHTML = reportDetail(id); wireReport(id); }
    else if (page === "reports") { app.innerHTML = reports(); wireReports(); }
    else app.innerHTML = dashboard();
    document.title = `${{ suggestions: "Suggestions", reports: "Reports & feedback", projects: "Projects", sponsors: "Sponsors & pledges", day: "Day preparation", close: "Close the day", people: "People", champions: "Champions", volunteers: "Volunteers", circles: "Family circles", traffic: "Traffic", team: "Team & logins" }[page] || "Dashboard"} · Team Portal · Raavanaa`;
  }

  Promise.all([fetch("/portal-demo.json").then(r => r.json()), fetch("/projects.json").then(r => r.json()).catch(() => ({ projects: [] })).then(async d => { try { const m = await fetch("/api/projects").then(r => r.json()); const have = new Set((d.projects || []).map(p => p.slug)); d.projects = [...(d.projects || []), ...(m.projects || []).filter(p => !have.has(p.slug))]; } catch (e) { /* only projects.json */ } return d; })])
    .then(async ([d, p]) => {
      D = d; P = (p.projects || []).filter(x => !x.hidden);
      P.filter(x => stageNum(x) === 2 && D.days[x.slug]).forEach(syncDay);
      const demo = new URLSearchParams(location.search).has("demo");
      if (!demo) {
        if (await handleTokens()) return;
        try {
          ME = await api("/api/portal/me");
          const r = await api("/api/portal/suggestions");
          D.suggestions = r.suggestions; C = await api("/api/portal/champions").then(x => ({ list: x.champions, districts: x.districts })).catch(() => C);
          ASKS = await api("/api/portal/pledges").then(x => x.pledges || []).catch(() => []); D.user = { name: ME.name, role: ME.admin ? "Admin" : "Team" };
          if (!D.team.includes(ME.name)) D.team = [ME.name, ...D.team];
          LIVE = true; NOW = new Date();
        } catch (e) {
          if (e.status === 401 || e.status === 403) { signIn(); return; }
          // No portal API here (for example a plain preview): fall back to the demo.
        }
      }
      if (!LIVE) C = { list: [{ id: 1, name: "Kumar Selvam", phone: "077 123 4567", email: "", district: "Nuwara Eliya", areas: "Pussellawa, Gampola", note: "Knows the estate schools.", active: true, visits: 2 }, { id: 2, name: "Nadeesha Perera", phone: "071 555 0101", email: "", district: "Kandy", areas: "Gampola, Peradeniya", note: "", active: true, visits: 0 }],
        districts: ["Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"] };
      const banner = document.querySelector(".pt-demo");
      if (LIVE) { banner.textContent = `Signed in as ${ME.email} · Suggestions, “I'd like to give” requests, Traffic and Team & logins are live · other screens are still a demo`; banner.classList.add("live"); }
      window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
      render();
    })
    .catch(() => { app.innerHTML = "<p>Could not load the portal preview.</p>"; });
})();
