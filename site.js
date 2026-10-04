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
  const art = i => { const [a, b, c] = PALETTES[i % PALETTES.length]; return `background:radial-gradient(circle at 78% 28%, ${c} 0 12%, transparent 13%),linear-gradient(160deg, ${a} 0%, ${b} 100%)`; };
  const coverHTML = (p, i, label) => p.cover
    ? `<img src="${esc(p.cover)}" alt="" loading="lazy">${label ? `<span>${esc(label)}</span>` : ""}`
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

  function renderList(app, site, projects) {
    let filter = "All";
    const themes = ["All", ...new Set(projects.map(p => p.theme).filter(Boolean))];
    const draw = () => {
      const shown = projects.map((p, i) => [p, i]).filter(([p]) => filter === "All" || p.theme === filter);
      app.innerHTML = `
        <section class="intro">
          <span class="eyebrow">${projects.length} project${projects.length === 1 ? "" : "s"}</span>
          <h1>${esc(site.tagline)}</h1>
          <p>${esc(site.intro)}</p>
        </section>
        ${themes.length > 2 ? `<div class="filters" role="group" aria-label="Filter by theme">
          ${themes.map(t => `<button class="chip" aria-pressed="${t === filter}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>` : ""}
        ${shown.length ? `<section class="grid">
          ${shown.map(([p, i]) => `
            <a class="card" href="/projects/${slugOf(p)}">
              <div class="cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.location)}</div>
              <div class="body">
                ${p.theme ? `<span class="tag">${esc(p.theme)}</span>` : ""}
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.summary)}</p>
                <div class="meta"><span>${esc(p.organization)}</span>${p.status ? `<span>· ${esc(p.status)}</span>` : ""}</div>
              </div>
            </a>`).join("")}
        </section>` : `<p class="empty">No projects yet. Add one from the admin page.</p>`}`;
      app.querySelectorAll(".chip").forEach(b => b.onclick = () => { filter = b.dataset.t; draw(); });
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
    const tabs = [["story", "Story"], ["updates", `Updates${updates.length ? ` (${updates.length})` : ""}`]];
    if (photos.length) tabs.push(["photos", "Photos"]);
    if (media.length) tabs.push(["media", "Video & audio"]);

    const panes = {
      story: `<div class="story">${p.quote ? `<p class="pull">“${esc(p.quote)}”</p>` : ""}${md(p.story)}</div>`,
      updates: updates.length ? updates.map(u => `<article class="update"><div class="meta">${fmtDate(u.date)}</div><h3>${esc(u.title)}</h3><div>${md(u.body)}</div></article>`).join("") : `<p class="empty">No updates yet.</p>`,
      photos: `<div class="photos">${photos.map((ph, k) => `<figure><button data-src="${esc(ph.image)}" aria-label="Open photo"><div class="cover"><img src="${esc(ph.image)}" alt="${esc(ph.caption)}" loading="lazy"></div></button>${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`).join("")}</div>`,
      media: `<div class="media">${media.map(m => { const e = embedFor(m.url); return e ? `<figure style="margin:0"><div class="embed"><iframe src="${esc(e)}" title="${esc(m.title)}" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy"></iframe></div>${m.title ? `<figcaption class="note" style="padding-top:6px">${esc(m.title)}</figcaption>` : ""}</figure>` : `<a class="media-link" href="${esc(m.url)}" target="_blank" rel="noopener">▶ ${esc(m.title || m.url)}</a>`; }).join("")}</div>`
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
            <div class="hero cover" style="${coverStyle(p, i)}">${coverHTML(p, i, p.cover ? "" : "Cover photo")}</div>
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
            <a class="btn ghost" href="/">Back to all projects</a>
          </aside>
        </div>`;
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
      if (page === "project") {
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
