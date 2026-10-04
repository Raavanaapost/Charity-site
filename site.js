/* Shared site script: loads content/*.json and renders the current page.
   Content is edited from /admin — no code changes needed for new projects. */
(function () {
  const PALETTES = [
    ["#2f7f8f", "#163a45", "#f2c14e"], ["#c0583a", "#5a2a2a", "#f6d79a"],
    ["#3d7a4f", "#1b3a2a", "#9fd3c7"], ["#b07d2b", "#4a3418", "#f1e3b5"],
    ["#4f5d9a", "#22284a", "#ffb38a"], ["#2e6d5c", "#10302a", "#cde8a0"]
  ];

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  const slugOf = p => p.slug ? slugify(p.slug) : slugify(p.title);
  // Small Markdown renderer: headings, paragraphs, lists, bold, italic, links, images.
  const inline = t => esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, "$1<em>$2</em>");
  const md = src => {
    const blocks = String(src || "").replace(/\r/g, "").split(/\n{2,}/);
    return blocks.map(b => {
      const t = b.trim(); if (!t) return "";
      const h = t.match(/^(#{1,4})\s+(.*)$/);
      if (h && !t.includes("\n")) { const n = Math.min(Math.max(h[1].length, 2), 4); return `<h${n}>${inline(h[2])}</h${n}>`; }
      const lines = t.split("\n");
      if (lines.every(l => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      if (lines.every(l => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map(l => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
      if (lines.every(l => /^>\s?/.test(l))) return `<p class="pull">${inline(lines.map(l => l.replace(/^>\s?/, "")).join(" "))}</p>`;
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    }).join("");
  };
  const fmtDate = d => {
    if (!d) return "";
    const dt = new Date(String(d).length === 10 ? d + "T12:00:00" : d);
    return isNaN(dt) ? esc(d) : dt.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  };
  // Resize uploaded photos through Netlify's image service so pages load fast on phones.
  const imgUrl = (src, w) => {
    const u = String(src || "");
    return u.startsWith("/") && !u.startsWith("//") ? `/.netlify/images?url=${encodeURIComponent(u)}&w=${w}&q=75` : u;
  };
  const art = i => { const [a, b, c] = PALETTES[i % PALETTES.length]; return `background:radial-gradient(circle at 78% 28%, ${c} 0 12%, transparent 13%),linear-gradient(160deg, ${a} 0%, ${b} 100%)`; };
  const coverHTML = (p, i, label, w = 800) => p.cover
    ? `<img src="${esc(imgUrl(p.cover, w))}" alt="" loading="lazy">${label ? `<span>${esc(label)}</span>` : ""}`
    : (label ? `<span>${esc(label)}</span>` : "");
  const coverStyle = (p, i) => p.cover ? "" : art(i);

  async function load(path) {
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error(path);
    return r.json();
  }

  function frame(site) {
    document.querySelectorAll("[data-site-name]").forEach(el => el.textContent = site.name || "");
    const f = document.querySelector("[data-site-footer]");
    if (f) f.textContent = site.footer || "";
    const y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  // "Follow our updates" box. The matching hidden form in index.html lets Netlify collect it.
  const signupHTML = (where, title = "Follow our updates") => `
    <form class="panel follow" name="updates" data-ajax data-done="Thank you! We'll email you when we post new updates.">
      <h2>${esc(title)}</h2>
      <p class="note" style="margin:0">Get an email when we post news from our projects.</p>
      <input type="hidden" name="form-name" value="updates">
      <input type="hidden" name="page" value="${esc(where)}">
      <p hidden><label>Leave empty <input name="bot-field"></label></p>
      <label class="sr" for="su-name-${esc(where)}">Name</label>
      <input id="su-name-${esc(where)}" name="name" autocomplete="name" placeholder="Your name (optional)">
      <label class="sr" for="su-email-${esc(where)}">Email</label>
      <input id="su-email-${esc(where)}" name="email" type="email" required autocomplete="email" placeholder="you@example.com">
      <button class="btn" type="submit">Follow</button>
      <p class="note" data-msg hidden></p>
    </form>`;

  function wireForms(root) {
    root.querySelectorAll("form[data-ajax]").forEach(f => f.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]"), msg = f.querySelector("[data-msg]");
      btn.disabled = true;
      try {
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() });
        if (!r.ok) throw new Error(r.status);
        f.querySelectorAll("input:not([type=hidden]),textarea,select").forEach(el => el.disabled = true);
        msg.textContent = f.dataset.done; msg.className = "toast";
      } catch (err) {
        btn.disabled = false;
        msg.textContent = "That didn't go through. Check your connection and try again."; msg.className = "note error";
      }
      msg.hidden = false;
    }));
  }

  // Icons for the home page totals (drawn in the logo's colors via CSS).
  const svg = d => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    // heart with a person: a project helping people
    projects: svg('<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/><circle cx="12" cy="11" r="1.6"/><path d="M9.6 15.2c.6-1.3 1.4-2 2.4-2s1.8.7 2.4 2"/>'),
    // pulse line: work happening now
    active: svg('<path d="M3 12h4l2.2-5 3.6 10 2.4-5H21"/>'),
    // megaphone: news shared
    updates: svg('<path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M19.5 6.5a7.5 7.5 0 0 1 0 11"/>'),
    // star: any extra number added in the admin page
    extra: svg('<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>')
  };

  function card(p, i) {
    return `
      <a class="card" href="/projects/${slugOf(p)}">
        <div class="cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.location)}</div>
        <div class="body">
          ${p.theme ? `<span class="tag">${esc(p.theme)}</span>` : ""}
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.summary)}</p>
          <div class="meta"><span>${esc(p.organization)}</span>${p.status ? `<span>· ${esc(p.status)}</span>` : ""}</div>
        </div>
      </a>`;
  }

  function renderList(app, site, projects) {
    let filter = "All";
    const themes = ["All", ...new Set(projects.map(p => p.theme).filter(Boolean))];
    const fi = Math.max(0, projects.findIndex(p => p.featured));
    const featured = projects[fi];
    const active = projects.filter(p => /active/i.test(p.status || "")).length;
    const updates = projects.reduce((n, p) => n + (p.updates || []).length, 0);
    const stats = [
      [projects.length, projects.length === 1 ? "project" : "projects", "projects"],
      [active, "active now", "active"],
      [updates, updates === 1 ? "update posted" : "updates posted", "updates"],
      ...(site.highlights || []).filter(h => h && h.value).map(h => [h.value, h.label, "extra"])
    ];
    const draw = () => {
      const rest = projects.map((p, i) => [p, i]).filter(([p, i]) => (filter !== "All" || i !== fi) && (filter === "All" || p.theme === filter));
      app.innerHTML = `
        <section class="intro">
          <h1>${esc(site.tagline)}</h1>
          <p>${esc(site.intro)}</p>
        </section>
        ${projects.length ? `<section class="totals" aria-label="At a glance">
          ${stats.map(([v, l, k]) => `<div class="stat-${k}"><i aria-hidden="true">${ICONS[k]}</i><p><b>${esc(v)}</b><span>${esc(l)}</span></p></div>`).join("")}
        </section>` : ""}
        ${featured ? `<a class="feature" href="/projects/${slugOf(featured)}">
          <div class="cover" style="${coverStyle(featured, fi)}">${coverHTML(featured, fi, "", 1400)}</div>
          <div class="body">
            <span class="eyebrow">Featured project${featured.location ? ` · ${esc(featured.location)}` : ""}</span>
            <h2>${esc(featured.title)}</h2>
            <p>${esc(featured.summary)}</p>
            ${(featured.impact || []).length ? `<div class="mini-stats">${featured.impact.slice(0, 2).map(s => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
            <span class="more">Read the story →</span>
          </div>
        </a>` : ""}
        <h2 class="section-title">${filter === "All" ? "All projects" : esc(filter) + " projects"}</h2>
        ${themes.length > 2 ? `<div class="filters" role="group" aria-label="Filter by theme">
          ${themes.map(t => `<button class="chip" aria-pressed="${t === filter}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>` : ""}
        ${rest.length ? `<section class="grid">${rest.map(([p, i]) => card(p, i)).join("")}</section>`
          : `<p class="empty">${projects.length ? "No other projects here yet." : "No projects yet. Add one from the admin page."}</p>`}
        <section class="signup-band">${signupHTML("home")}</section>`;
      app.querySelectorAll(".chip").forEach(b => b.onclick = () => { filter = b.dataset.t; draw(); });
      wireForms(app);
    };
    draw();
  }

  function embedFor(url) {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^www\.|^m\./, "");
      let id;
      if (h === "youtu.be") id = u.pathname.slice(1);
      if (h === "youtube.com") id = u.searchParams.get("v") || (u.pathname.match(/\/(shorts|embed|live)\/([^/?]+)/) || [])[2];
      if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
      if (h === "vimeo.com") { const v = u.pathname.split("/").filter(Boolean)[0]; if (/^\d+$/.test(v)) return `https://player.vimeo.com/video/${v}`; }
      if (h === "soundcloud.com") return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false`;
    } catch (e) { }
    return null;
  }

  function renderProject(app, site, projects, slug) {
    const i = projects.findIndex(p => slugOf(p) === slug);
    const p = projects[i];
    if (!p) {
      app.innerHTML = `<section class="intro"><h1>Project not found</h1><p>It may have been renamed or removed.</p><p><a href="/">See all projects</a></p></section>`;
      return;
    }
    document.title = `${p.title} · ${site.name}`;
    const initials = String(p.organization || site.name || "").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const updates = (p.updates || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const photos = p.photos || [];
    const media = p.media || [];
    const count = n => n ? ` (${n})` : "";
    const tabs = [
      ["story", "Story"],
      ["updates", `Updates${count(updates.length)}`],
      ["pictures", `Pictures${count(photos.length)}`],
      ["video", `Video${count(media.length)}`]
    ];

    const panes = {
      story: `<div class="story">${p.quote ? `<p class="pull">“${esc(p.quote)}”</p>` : ""}${md(p.story)}</div>`,
      updates: updates.length ? updates.map(u => `<article class="update"><div class="meta">${fmtDate(u.date)}</div><h3>${esc(u.title)}</h3><div>${md(u.body)}</div></article>`).join("") : `<p class="empty">No updates yet.</p>`,
      pictures: photos.length ? `<div class="photos">${photos.map((ph, k) => `<figure><button data-src="${esc(imgUrl(ph.image, 1600))}" aria-label="Open picture"><div class="cover"><img src="${esc(imgUrl(ph.image, 600))}" alt="${esc(ph.caption)}" loading="lazy"></div></button>${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : `<p class="empty">No pictures yet.</p>`,
      video: media.length ? `<div class="media">${media.map(m => { const e = embedFor(m.url); return e ? `<figure style="margin:0"><div class="embed"><iframe src="${esc(e)}" title="${esc(m.title)}" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe></div>${m.title ? `<figcaption class="note" style="padding-top:6px">${esc(m.title)}</figcaption>` : ""}</figure>` : `<a class="media-link" href="${esc(m.url)}" target="_blank" rel="noopener">▶ ${esc(m.title || m.url)}</a>`; }).join("")}</div>` : `<p class="empty">No videos yet.</p>`
    };

    const draw = tab => {
      app.innerHTML = `
        <nav class="crumbs"><a href="/">Projects</a>${p.theme ? ` / ${esc(p.theme)}` : ""}</nav>
        <header class="phead">
          ${p.theme ? `<span class="tag">${esc(p.theme)}</span>` : ""}
          <h1>${esc(p.title)}</h1>
          <p class="lede">${esc(p.summary)}</p>
          ${p.organization ? `<div class="byline"><span class="avatar">${esc(initials)}</span><span>by <strong>${esc(p.organization)}</strong>${p.location ? ` · ${esc(p.location)}` : ""}</span></div>` : ""}
        </header>
        <div class="layout">
          <div style="min-width:0">
            <div class="hero cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.cover ? "" : "Cover photo", 1400)}</div>
            <div class="tabs" role="tablist">
              ${tabs.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${k === tab}" data-t="${k}">${l}</button>`).join("")}
            </div>
            <section role="tabpanel">${panes[tab]}</section>
          </div>
          <aside class="side">
            <div class="panel">
              <h2>Project at a glance</h2>
              <dl class="facts">
                ${p.status ? `<dt>Status</dt><dd>${esc(p.status)}</dd>` : ""}
                ${p.location ? `<dt>Location</dt><dd>${esc(p.location)}</dd>` : ""}
                ${p.started ? `<dt>Started</dt><dd>${esc(p.started)}</dd>` : ""}
                ${p.reach ? `<dt>Reach</dt><dd>${esc(p.reach)}</dd>` : ""}
              </dl>
              ${(p.impact || []).length ? `<div class="stats">${p.impact.map(s => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
            </div>
            ${signupHTML(slugOf(p), "Follow this project")}
            <a class="btn ghost" href="/">Back to all projects</a>
          </aside>
        </div>`;
      wireForms(app);
      app.querySelectorAll(".tab").forEach(b => b.onclick = () => { draw(b.dataset.t); history.replaceState(null, "", "#" + b.dataset.t); });
      app.querySelectorAll(".photos button").forEach(b => b.onclick = () => {
        const lb = document.createElement("div");
        lb.className = "lightbox"; lb.innerHTML = `<img src="${esc(b.dataset.src)}" alt="">`;
        lb.onclick = () => lb.remove(); document.body.appendChild(lb);
      });
    };
    const start = location.hash.slice(1);
    draw(tabs.some(([k]) => k === start) ? start : "story");
  }

  function renderAbout(app, site) {
    app.innerHTML = `<section class="intro"><span class="eyebrow">About</span><h1>About ${esc(site.name)}</h1><div class="story">${md(site.about)}</div><p><a href="/">Browse the projects</a></p></section>`;
  }

  async function main() {
    const app = document.getElementById("app");
    const page = document.body.dataset.page;
    try {
      const [site, data] = await Promise.all([load("/site.json"), load("/projects.json")]);
      frame(site);
      const projects = (data.projects || []).filter(p => p && p.title && !p.hidden);
      if (page === "contact") {
        document.title = `Contact · ${site.name}`;
        wireForms(document);
      } else if (page === "project") {
        const slug = decodeURIComponent(location.pathname.replace(/\/+$/, "").split("/").pop());
        renderProject(app, site, projects, slugify(slug));
      } else if (page === "about") {
        document.title = `About · ${site.name}`;
        renderAbout(app, site);
      } else {
        document.title = site.name;
        renderList(app, site, projects);
      }
    } catch (e) {
      app.innerHTML = `<p class="empty">The page couldn't load its content. Refresh to try again.</p>`;
      console.error(e);
    }
  }
  main();
})();
