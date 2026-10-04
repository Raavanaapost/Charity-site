/* Shared site script: loads content/*.json and renders the current page.
   Content is edited from /admin — no code changes needed for new projects. */
(function () {
  let COMMENTS = [];
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
      const fd = new FormData(f); // read the entries before the fields are disabled
      try {
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() });
        if (!r.ok) throw new Error(r.status);
        f.querySelectorAll("input:not([type=hidden]),textarea,select").forEach(el => el.disabled = true);
        msg.textContent = f.dataset.done; msg.className = "toast";
        if (f.hasAttribute("data-comment")) {
          const art = document.createElement("article");
          const nm = String(fd.get("name") || "Anonymous");
          art.className = "comment";
          art.innerHTML = `<div class="who"><span class="avatar">${esc(nm.trim().charAt(0).toUpperCase() || "?")}</span><strong>${esc(nm)}</strong><span class="meta">Just now</span></div><p>${esc(fd.get("comment"))}</p>`;
          f.parentNode.insertBefore(art, f);
          const empty = f.parentNode.querySelector(":scope > p.note"); if (empty) empty.remove();
        }
      } catch (err) {
        btn.disabled = false;
        msg.textContent = "That didn't go through. Check your connection and try again."; msg.className = "note error";
      }
      msg.hidden = false;
    }));
  }

  // Home page totals: a white icon on a tile shaded in the logo's colors.
  const icon = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    // heart holding people: projects that help people
    projects: icon('<path class="fill" d="M12 21s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8 2.9C20 16.1 12 21 12 21z"/><circle cx="9.3" cy="11" r="1.5"/><circle cx="14.7" cy="11" r="1.5"/><path d="M7.2 15.6c.5-1.4 1.2-2.1 2.1-2.1s1.6.7 2.1 2.1M12.6 15.6c.5-1.4 1.2-2.1 2.1-2.1s1.6.7 2.1 2.1"/>'),
    // spark burst: work happening now
    active: icon('<circle class="fill" cx="12" cy="12" r="5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><path d="M10.2 12.2l1.3 1.3 2.4-2.8"/>'),
    // megaphone: news shared
    updates: icon('<path class="fill" d="M3.5 10v4a1 1 0 0 0 1 1H7l6.5 4.5v-15L7 9H4.5a1 1 0 0 0-1 1z"/><path d="M17 9.2a3.8 3.8 0 0 1 0 5.6M19.4 6.6a7.3 7.3 0 0 1 0 10.8"/><path d="M7.5 15l1.2 4.5h2.2L10 15.8"/>'),
    // star: extra numbers added in the admin page
    extra: icon('<path class="fill" d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9z"/>')
  };

  // Home headline: first letter always uppercase, set in the logo's script style.
  const headline = t => {
    const str = String(t || "").trim();
    if (!str) return "";
    const first = [...str][0];
    const rest = esc(str.slice(first.length)).replace(/\s+[-–—]\s+/, ' <span class="dash">–</span> ');
    return `<span class="initial">${esc(first.toUpperCase())}</span>${rest}`;
  };

  // Keep the home headline on one line: shrink it until it fits the screen.
  function fitHeadline() {
    const h = document.querySelector(".headline");
    if (!h) return;
    h.style.fontSize = "";
    let size = parseFloat(getComputedStyle(h).fontSize);
    while (h.scrollWidth > h.clientWidth + 1 && size > 16) { size -= 1; h.style.fontSize = size + "px"; }
  }
  let fitTimer;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitHeadline, 120); });
  if (document.fonts) document.fonts.ready.then(fitHeadline);

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
          <h1 class="headline">${headline(site.tagline)}</h1>
          <p>${esc(site.intro)}</p>
        </section>
        ${projects.length ? `<section class="totals" aria-label="At a glance">
          ${stats.map(([v, l, k]) => `<div class="stat-${k}"><i>${ICONS[k]}</i><p><b>${esc(v)}</b><span>${esc(l)}</span></p></div>`).join("")}
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
      fitHeadline();
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

  // Visitor comments: shown right away; admins can hide or delete them in the admin page.
  function commentsHTML(slug) {
    const list = COMMENTS.filter(c => c && c.approved !== false && c.project === slug && c.comment)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return `
      <section class="comments" aria-labelledby="c-title">
        <h2 id="c-title">Comments${list.length ? ` (${list.length})` : ""}</h2>
        ${list.length ? list.map(c => `<article class="comment">
            <div class="who"><span class="avatar">${esc(String(c.name || "?").trim().charAt(0).toUpperCase() || "?")}</span><strong>${esc(c.name || "Anonymous")}</strong><span class="meta">${fmtDate(c.date)}</span></div>
            <p>${esc(c.comment)}</p>
          </article>`).join("") : `<p class="note">No comments yet. Be the first to share a few kind words.</p>`}
        <form class="panel form comment-form" name="comments" data-ajax data-done="Thank you! Your comment is posted. It may take a minute to show for everyone." data-comment>
          <h3>Leave a comment</h3>
          <input type="hidden" name="form-name" value="comments">
          <input type="hidden" name="project" value="${esc(slug)}">
          <p hidden><label>Leave empty <input name="bot-field"></label></p>
          <label for="cm-name">Your name<input id="cm-name" name="name" required maxlength="80" autocomplete="name"></label>
          <label for="cm-text">Comment<textarea id="cm-text" name="comment" required maxlength="2000"></textarea></label>
          <button class="btn" type="submit">Post comment</button>
          <p class="note" data-msg hidden></p>
        </form>
      </section>`;
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
      ["updates", "Impact"],
      ["pictures", `Pictures${count(photos.length)}`],
      ["video", `Video${count(media.length)}`]
    ];

    const panes = {
      story: `<div class="story">${p.quote ? `<p class="pull">“${esc(p.quote)}”</p>` : ""}${md(p.story)}</div>`,
      updates: (updates.length ? updates.map(u => `<article class="update"><div class="meta">${fmtDate(u.date)}</div><h3>${esc(u.title)}</h3><div>${md(u.body)}</div></article>`).join("") : `<p class="empty">No impact updates yet.</p>`) + commentsHTML(slugOf(p)),
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

  // Phone menu button
  const menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", String(open)); nav.classList.toggle("open", open);
    });
    nav.addEventListener("click", e => { if (e.target.closest("a")) { menuBtn.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); } });
  }

  async function main() {
    const app = document.getElementById("app");
    const page = document.body.dataset.page;
    try {
      const [site, data, cm] = await Promise.all([load("/site.json"), load("/projects.json"), load("/comments.json").catch(() => ({}))]);
      COMMENTS = (cm && cm.comments) || [];
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
